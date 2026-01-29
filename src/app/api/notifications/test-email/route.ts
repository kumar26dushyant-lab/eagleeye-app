import { NextRequest, NextResponse } from 'next/server'
import { generateDigestHTML, generateDigestText, EmailDigestData } from '@/lib/notifications/email'

// GET - Preview email digest (for testing)
// POST - Send test email
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'html'

  // Generate sample data for preview
  const sampleData: EmailDigestData = {
    recipientEmail: 'founder@example.com',
    recipientName: 'Founder',
    date: new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    summary: {
      totalTasks: 24,
      critical: 3,
      blockers: 2,
      overdue: 1,
      completedToday: 5,
    },
    topPriorities: [
      { 
        title: 'Review Q4 investor deck', 
        source: 'Asana', 
        urgency: 'critical',
        dueDate: 'Today',
      },
      { 
        title: 'Respond to Series A term sheet', 
        source: 'Gmail', 
        urgency: 'critical',
        dueDate: 'Tomorrow',
      },
      { 
        title: 'Fix production authentication bug', 
        source: 'Slack', 
        urgency: 'high',
      },
      { 
        title: 'Prepare board meeting agenda', 
        source: 'Notion', 
        urgency: 'high',
        dueDate: 'Friday',
      },
      { 
        title: 'Review new hire candidates', 
        source: 'Asana', 
        urgency: 'medium',
      },
    ],
    blockers: [
      {
        title: 'AWS deployment stuck',
        reason: 'Waiting for DevOps approval on production access',
        waitingOn: 'Mike (DevOps)',
      },
      {
        title: 'Contract review delayed',
        reason: 'Legal team needs clarification on indemnity clause',
        waitingOn: 'Legal Team',
      },
    ],
    upcomingDeadlines: [
      { title: 'Investor deck submission', dueDate: 'Jan 30', daysLeft: 1 },
      { title: 'Q4 financial close', dueDate: 'Jan 31', daysLeft: 2 },
      { title: 'Product launch', dueDate: 'Feb 5', daysLeft: 7 },
      { title: 'Board meeting', dueDate: 'Feb 10', daysLeft: 12 },
    ],
    quickWins: [
      { title: 'Approve expense reports', estimatedTime: '5 min' },
      { title: 'Review PR #234', estimatedTime: '10 min' },
      { title: 'Send standup update', estimatedTime: '5 min' },
    ],
  }

  if (format === 'text') {
    return new Response(generateDigestText(sampleData), {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  if (format === 'json') {
    return NextResponse.json(sampleData)
  }

  // Return HTML preview (default)
  return new Response(generateDigestHTML(sampleData), {
    headers: { 'Content-Type': 'text/html' },
  })
}

// POST - Send a test email
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Email service not configured',
        setup: {
          step1: 'Go to https://resend.com and create a free account',
          step2: 'Get your API key from the dashboard',
          step3: 'Add RESEND_API_KEY=re_xxxxx to your .env.local',
          step4: 'Restart the server and try again',
        },
        preview: 'Visit /api/notifications/test-email to preview the email template',
      })
    }

    // Import and send
    const { sendDigestEmail } = await import('@/lib/notifications/email')
    
    const success = await sendDigestEmail({
      recipientEmail: email,
      recipientName: 'Test User',
      date: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      summary: {
        totalTasks: 24,
        critical: 3,
        blockers: 2,
        overdue: 1,
        completedToday: 5,
      },
      topPriorities: [
        { title: 'Review Q4 investor deck', source: 'Asana', urgency: 'critical', dueDate: 'Today' },
        { title: 'Respond to Series A term sheet', source: 'Gmail', urgency: 'critical' },
        { title: 'Fix production bug', source: 'Slack', urgency: 'high' },
      ],
      blockers: [
        { title: 'AWS deployment stuck', reason: 'Waiting for DevOps approval', waitingOn: 'Mike' },
      ],
      upcomingDeadlines: [
        { title: 'Investor deck submission', dueDate: 'Tomorrow', daysLeft: 1 },
        { title: 'Q4 close', dueDate: 'Friday', daysLeft: 3 },
      ],
      quickWins: [
        { title: 'Approve expenses', estimatedTime: '5 min' },
      ],
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${email}`,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send email. Check server logs.',
      })
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}
