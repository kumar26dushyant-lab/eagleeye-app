// Dodo Payments Webhook Handler
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPaymentConfirmationEmail, sendSubscriptionCancelledEmail } from "@/lib/email";
import { sendPaymentFailedEmail, sendWelcomeEmail as sendTrialWelcomeEmail } from "@/lib/trial/emails";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Grace period duration in days
const GRACE_PERIOD_DAYS = 3;

// Verify webhook signature using HMAC-SHA256
async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  webhookKey: string
): Promise<boolean> {
  if (!signature) return false;
  
  try {
    // Dodo sends signature as: sha256=<hash>
    const expectedSignature = signature.replace('sha256=', '');
    
    // Create HMAC-SHA256 hash of the raw body
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Timing-safe comparison
    return computedSignature === expectedSignature;
  } catch (error) {
    console.error('[Dodo Webhook] Signature verification error:', error);
    return false;
  }
}

// Manual webhook handler since the SDK requires key at import time
export async function POST(request: NextRequest) {
  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  
  if (!webhookKey) {
    console.error("[Dodo Webhook] Missing webhook key");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  try {
    const rawBody = await request.text();
    
    // Verify webhook signature before processing (if signature is provided)
    const signature = request.headers.get('dodo-signature') || request.headers.get('x-dodo-signature');
    
    if (signature) {
      // Signature provided - verify it
      const isValid = await verifyWebhookSignature(rawBody, signature, webhookKey);
      
      if (!isValid) {
        console.error('[Dodo Webhook] Invalid signature - possible spoofed request');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('[Dodo Webhook] Signature verified successfully');
    } else {
      // No signature provided - log warning but continue processing
      // TODO: Make signature verification mandatory once Dodo confirms they send signatures
      console.warn('[Dodo Webhook] No signature header found - processing without verification');
    }
    
    const payload = JSON.parse(rawBody);
    
    console.log("[Dodo Webhook] Received:", payload.type);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const data = payload.data || {};
    
    switch (payload.type) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(supabase, data);
        break;
      case 'payment.failed':
        await handlePaymentFailed(supabase, data);
        break;
      case 'subscription.active':
        await handleSubscriptionActive(supabase, data);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(supabase, data);
        break;
      case 'subscription.renewed':
        await handleSubscriptionRenewed(supabase, data);
        break;
      case 'refund.succeeded':
        await handleRefundSucceeded(supabase, data);
        break;
      default:
        console.log("[Dodo Webhook] Unhandled event type:", payload.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Dodo Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handlePaymentSucceeded(supabase: any, data: any) {
  console.log("[Dodo Webhook] Payment succeeded - FULL DATA:", JSON.stringify(data, null, 2));
  
  const customerId = data.customer?.customer_id;
  const customerEmail = data.customer?.email?.toLowerCase();
  const customerPhone = data.customer?.phone_number || data.customer?.phone || null;
  const customerName = data.customer?.name || null;
  const subscriptionId = data.subscription_id;
  const productId = data.product_id;
  const paymentId = data.payment_id;
  const paymentStatus = data.status || data.payment_status;
  const amount = data.amount || data.total_amount;
  
  // Log key payment details
  console.log("[Dodo Webhook] Payment details:", { 
    email: customerEmail, 
    paymentId, 
    subscriptionId,
    status: paymentStatus,
    amount,
    productId 
  });
  
  if (!customerEmail) {
    console.error("[Dodo Webhook] No customer email in payment data");
    return;
  }
  
  // SAFEGUARD: Skip processing if this looks like a mandate verification (₹1 test)
  // Real subscription payments should be for the actual amount ($29/$79)
  if (amount && (amount === 1 || amount === 100)) { // 1 INR or 100 paise
    console.log("[Dodo Webhook] Skipping - appears to be ₹1 mandate verification, not actual payment");
    return;
  }
  
  // Log phone number if provided
  if (customerPhone) {
    console.log("[Dodo Webhook] Customer phone provided:", customerPhone);
  }
  
  // Determine tier based on product
  let tier = 'founder'; // Solo plan
  if (productId?.toLowerCase().includes('team') || data.product_name?.toLowerCase().includes('team')) {
    tier = 'team';
  }
  
  // Check if subscription exists for this email (try multiple lookup methods)
  let existingId: string | null = null;
  
  // First try by customer_email
  const { data: byEmail } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('customer_email', customerEmail)
    .single();
  
  if (byEmail) {
    existingId = byEmail.id;
  } else {
    // Try to find by profile email (for older records without customer_email)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', customerEmail)
      .single();
    
    if (profile) {
      const { data: byUser } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', profile.id)
        .single();
      
      if (byUser) {
        existingId = byUser.id;
      }
    }
  }
  
  if (existingId) {
    // Determine if this is a trial signup ($0) or actual payment
    // For trial signups, keep status as 'trialing' until first real charge
    const isTrialSignup = !amount || amount === 0;
    const trialEndsAt = isTrialSignup 
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      : null;
    
    // Update existing subscription - clear any payment failure flags
    const { error } = await supabase
      .from('subscriptions')
      .update({
        customer_email: customerEmail, // Ensure customer_email is set
        customer_phone: customerPhone, // Store phone if provided
        dodo_customer_id: customerId,
        dodo_subscription_id: subscriptionId,
        dodo_payment_id: paymentId,
        tier: tier,
        status: isTrialSignup ? 'trialing' : 'active', // Keep trialing for $0 payments
        // Set trial dates for trial signups
        ...(isTrialSignup && {
          trial_started_at: new Date().toISOString(),
          trial_ends_at: trialEndsAt,
        }),
        // Clear payment failure fields on successful payment
        payment_failed_at: null,
        grace_period_ends_at: null,
        account_deletion_scheduled_at: null,
        payment_retry_count: 0,
        last_payment_error: null,
        payment_failed_email_sent: false,
        grace_period_email_sent: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingId);  // Use ID for reliable update
    
    // Also update profile with phone and name if provided
    if (customerPhone || customerName) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', customerEmail)
        .single();
      
      if (profile) {
        const profileUpdate: any = {};
        if (customerPhone) profileUpdate.phone = customerPhone;
        if (customerName && !profile.full_name) profileUpdate.full_name = customerName;
        
        if (Object.keys(profileUpdate).length > 0) {
          await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', profile.id);
        }
      }
    }
    
    // Mark any unresolved payment failures as resolved
    await supabase
      .from('payment_failure_logs')
      .update({ 
        resolved_at: new Date().toISOString(),
        resolved_by: 'auto_payment_success'
      })
      .eq('customer_email', customerEmail)
      .is('resolved_at', null);
    
    if (error) {
      console.error("[Dodo Webhook] Failed to update subscription:", error);
    } else {
      console.log("[Dodo Webhook] Subscription updated for:", customerEmail, "Tier:", tier);
      
      // Send payment confirmation email for updates too (reactivation)
      try {
        await sendPaymentConfirmationEmail({
          to: customerEmail,
          planName: tier === 'team' ? 'Team' : 'Founder (Solo)',
          amount: tier === 'team' ? '$79' : '$29',
          loginLink: 'https://eagleeye.work/login',
        });
        console.log("[Dodo Webhook] Payment confirmation email sent to:", customerEmail);
      } catch (emailError) {
        console.error("[Dodo Webhook] Failed to send email:", emailError);
      }
    }
  } else {
    // Create new subscription
    // Determine if this is a trial signup ($0) or actual payment
    const isTrialSignup = !amount || amount === 0;
    const now = new Date();
    const trialEndsAt = isTrialSignup 
      ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      : null;
    
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        customer_email: customerEmail,
        customer_phone: customerPhone, // Store phone if provided
        dodo_customer_id: customerId,
        dodo_subscription_id: subscriptionId,
        dodo_payment_id: paymentId,
        product_id: productId,
        tier: tier,
        status: isTrialSignup ? 'trialing' : 'active', // Keep trialing for $0 payments
        trial_started_at: isTrialSignup ? now.toISOString() : null,
        trial_ends_at: trialEndsAt,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });
    
    if (error) {
      console.error("[Dodo Webhook] Failed to create subscription:", error);
    } else {
      console.log("[Dodo Webhook] Subscription created for:", customerEmail, "Tier:", tier);
      
      // Send appropriate email based on whether this is trial or paid
      try {
        if (isTrialSignup && trialEndsAt) {
          // Trial signup - send trial welcome email
          await sendTrialWelcomeEmail({
            email: customerEmail,
            name: customerName || 'there',
            daysLeft: 7,
            trialEndsAt: new Date(trialEndsAt),
          });
          console.log("[Dodo Webhook] Trial welcome email sent to:", customerEmail);
          
          // Mark welcome email as sent
          await supabase
            .from('subscriptions')
            .update({ welcome_email_sent: true })
            .eq('customer_email', customerEmail);
        } else {
          // Paid signup - send payment confirmation
          await sendPaymentConfirmationEmail({
            to: customerEmail,
            planName: tier === 'team' ? 'Team' : 'Founder (Solo)',
            amount: tier === 'team' ? '$79' : '$29',
            loginLink: 'https://eagleeye.work/login',
          });
          console.log("[Dodo Webhook] Payment confirmation email sent to:", customerEmail);
        }
      } catch (emailError) {
        console.error("[Dodo Webhook] Failed to send email:", emailError);
      }
    }
  }
}

async function handleSubscriptionActive(supabase: any, data: any) {
  console.log("[Dodo Webhook] Subscription active:", data);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('dodo_customer_id', data.customer?.customer_id);
  
  if (error) {
    console.error("[Dodo Webhook] Failed to update subscription:", error);
  }
}

async function handleSubscriptionCancelled(supabase: any, data: any) {
  console.log("[Dodo Webhook] Subscription cancelled:", data);
  
  const customerEmail = data.customer?.email?.toLowerCase();
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('dodo_customer_id', data.customer?.customer_id);
  
  if (error) {
    console.error("[Dodo Webhook] Failed to cancel subscription:", error);
  } else if (customerEmail) {
    // Send cancellation confirmation email
    await sendSubscriptionCancelledEmail({ to: customerEmail });
    console.log("[Dodo Webhook] Cancellation email sent to:", customerEmail);
  }
}

async function handleSubscriptionRenewed(supabase: any, data: any) {
  console.log("[Dodo Webhook] Subscription renewed:", data);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('dodo_customer_id', data.customer?.customer_id);
  
  if (error) {
    console.error("[Dodo Webhook] Failed to renew subscription:", error);
  }
}

async function handleRefundSucceeded(supabase: any, data: any) {
  console.log("[Dodo Webhook] Refund succeeded:", data);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('dodo_payment_id', data.payment_id);
  
  if (error) {
    console.error("[Dodo Webhook] Failed to process refund:", error);
  }
}

async function handlePaymentFailed(supabase: any, data: any) {
  console.log("[Dodo Webhook] Payment failed:", data);
  
  const customerEmail = data.customer?.email?.toLowerCase();
  const customerId = data.customer?.customer_id;
  const paymentId = data.payment_id;
  const failureReason = data.failure_reason || data.error_message || 'Payment declined';
  
  if (!customerEmail) {
    console.error("[Dodo Webhook] No customer email in payment failed data");
    return;
  }
  
  const now = new Date();
  const gracePeriodEndsAt = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const accountDeletionAt = new Date(gracePeriodEndsAt.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day after grace period
  
  // Get existing subscription - try both customer_email and looking up via profile
  let subscription = null;
  
  // First try by customer_email
  const { data: subByEmail } = await supabase
    .from('subscriptions')
    .select('id, status, payment_retry_count')
    .eq('customer_email', customerEmail)
    .single();
  
  if (subByEmail) {
    subscription = subByEmail;
  } else {
    // Try to find by profile email (for older records without customer_email)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', customerEmail)
      .single();
    
    if (profile) {
      const { data: subByUser } = await supabase
        .from('subscriptions')
        .select('id, status, payment_retry_count')
        .eq('user_id', profile.id)
        .single();
      
      if (subByUser) {
        subscription = subByUser;
        // Update the subscription to have customer_email for future lookups
        await supabase
          .from('subscriptions')
          .update({ customer_email: customerEmail })
          .eq('id', subByUser.id);
      }
    }
  }
  
  if (!subscription) {
    console.log("[Dodo Webhook] No subscription found for:", customerEmail);
    return;
  }
  
  const retryCount = (subscription.payment_retry_count || 0) + 1;
  
  // Update subscription to payment_failed/grace_period status
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'payment_failed',
      payment_failed_at: now.toISOString(),
      grace_period_ends_at: gracePeriodEndsAt.toISOString(),
      account_deletion_scheduled_at: accountDeletionAt.toISOString(),
      payment_retry_count: retryCount,
      last_payment_error: failureReason,
      updated_at: now.toISOString(),
    })
    .eq('customer_email', customerEmail);
  
  if (updateError) {
    console.error("[Dodo Webhook] Failed to update subscription:", updateError);
    return;
  }
  
  // Log the payment failure
  await supabase
    .from('payment_failure_logs')
    .insert({
      subscription_id: subscription.id,
      customer_email: customerEmail,
      failure_reason: failureReason,
      payment_provider: 'dodo',
      payment_id: paymentId,
      attempted_at: now.toISOString(),
    });
  
  // Send payment failed email with retry date
  try {
    const userName = customerEmail.split('@')[0]; // Fallback name
    await sendPaymentFailedEmail({
      email: customerEmail,
      name: userName,
      retryDate: gracePeriodEndsAt,
    });
    
    // Mark email as sent
    await supabase
      .from('subscriptions')
      .update({ payment_failed_email_sent: true })
      .eq('customer_email', customerEmail);
    
    console.log("[Dodo Webhook] Payment failed email sent to:", customerEmail);
  } catch (emailError) {
    console.error("[Dodo Webhook] Failed to send payment failed email:", emailError);
  }
  
  console.log("[Dodo Webhook] Payment failed processed for:", customerEmail, "Grace period ends:", gracePeriodEndsAt);
}
