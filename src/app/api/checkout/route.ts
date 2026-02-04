// Dodo Payments Checkout Handler
import { NextRequest, NextResponse } from "next/server";
import DodoPayments from "dodopayments";

// Initialize Dodo client
function getDodoClient() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    throw new Error("DODO_PAYMENTS_API_KEY not configured");
  }
  
  return new DodoPayments({
    bearerToken: apiKey.trim(),
    environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") || "test_mode",
  });
}

// GET - Create checkout session and redirect (recommended approach)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get("productId")?.trim();
  const quantity = parseInt(searchParams.get("quantity") || "1", 10);

  if (!productId) {
    return NextResponse.json({ error: "Missing productId parameter" }, { status: 400 });
  }

  try {
    const client = getDodoClient();
    const returnUrl = process.env.DODO_PAYMENTS_RETURN_URL || "https://eagleeye.work/checkout/success";
    
    // Create checkout session via SDK (this respects test_mode environment)
    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity }],
      return_url: returnUrl,
    });
    
    if (session.checkout_url) {
      return NextResponse.redirect(session.checkout_url);
    }
    
    throw new Error("No checkout URL returned from Dodo");
  } catch (error) {
    console.error("[Checkout] Error:", error);
    return NextResponse.json({ 
      error: "Checkout failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// POST - Create checkout session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity = 1, customerEmail, customerName } = body;

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const client = getDodoClient();
    const returnUrl = process.env.DODO_PAYMENTS_RETURN_URL || "https://eagleeye.work/checkout/success";

    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity }],
      customer: customerEmail ? { email: customerEmail, name: customerName || "Customer" } : undefined,
      return_url: returnUrl,
    });

    return NextResponse.json({ checkout_url: session.checkout_url });
  } catch (error) {
    console.error("[Checkout Session] Error:", error);
    return NextResponse.json({ 
      error: "Failed to create checkout session", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
