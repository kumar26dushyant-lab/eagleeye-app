// Unified Data API - Uses the Integration Layer
// Returns normalized signals from all connected tools

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getIntegrationManager, type UnifiedSignal, type CoverageAssessment } from '@/lib/integrations'
import { generateSimulatedSignals, isSimulationMode } from '@/lib/integrations/simulator'
import type { IntentMode } from '@/lib/importance'

// Map unified signals to legacy format for backwards compatibility
function toLeagcySignal(signal: UnifiedSignal) {
  // Map new categories to old signal types
  const typeMap: Record<string, string> = {
    commitment: 'mention',
    deadline: 'urgent',
    mention: 'mention',
    question: 'question',
    blocker: 'blocker',
    decision: 'decision_needed',
    escalation: 'escalation',
    update: 'fyi',
  }
  
  return {
    id: signal.id,
    user_id: '',
    source: signal.source,
    source_message_id: signal.sourceId,
    channel_id: signal.channel || '',
    channel_name: signal.channel,
    sender_name: signal.sender,
    signal_type: typeMap[signal.category] || 'fyi',
    snippet: signal.snippet,
    timestamp: signal.timestamp,
    is_read: false,
    is_actioned: false,
    is_from_monitored_channel: true,
    detected_via: 'channel_monitor',
    message_url: signal.url,
    raw_metadata: {
      ...signal.metadata,
      category: signal.category,
      confidence: signal.confidence,
    },
    created_at: signal.timestamp,
  }
}

// Filter signals based on intent mode
// EagleEye's core value: Each mode should ONLY show what's truly important for that context
function filterByMode(signals: UnifiedSignal[], mode: IntentMode): UnifiedSignal[] {
  switch (mode) {
    case 'calm':
      // VACATION MODE: Only life-or-death situations
      // Only critical - blockers, decisions, escalations with HIGH confidence
      return signals.filter(s => 
        ['blocker', 'decision', 'escalation'].includes(s.category) && s.confidence >= 0.8
      )
    case 'on_the_go':
      // COMMUTE MODE: Critical + important asks
      // High priority - blockers, decisions, escalations, and direct actionable mentions
      return signals.filter(s => 
        (['blocker', 'decision', 'escalation'].includes(s.category) && s.confidence >= 0.7) ||
        (['mention', 'deadline'].includes(s.category) && s.confidence >= 0.75)
      )
    case 'focus':
      // DEEP WORK MODE: Only things that could derail your work
      // Blockers and imminent deadlines only
      return signals.filter(s => 
        ['blocker', 'deadline', 'escalation'].includes(s.category) && s.confidence >= 0.7
      )
    case 'work':
    default:
      // STANDARD MODE: Actionable signals only
      // Filter out low-confidence and pure FYI/updates unless they're high quality
      return signals.filter(s => {
        // Always show blockers, decisions, escalations
        if (['blocker', 'decision', 'escalation'].includes(s.category)) {
          return s.confidence >= 0.6
        }
        // Show mentions, questions, commitments with decent confidence
        if (['mention', 'question', 'commitment', 'deadline'].includes(s.category)) {
          return s.confidence >= 0.65
        }
        // Updates/FYI only if explicitly marked and high confidence
        if (s.category === 'update') {
          return s.confidence >= 0.7
        }
        return false
      })
  }
}

// Generate brief from signals
function generateBrief(signals: UnifiedSignal[], mode: IntentMode): string {
  const blockers = signals.filter(s => s.category === 'blocker').length
  const decisions = signals.filter(s => s.category === 'decision').length
  const mentions = signals.filter(s => s.category === 'mention').length
  const questions = signals.filter(s => s.category === 'question').length
  const deadlines = signals.filter(s => s.category === 'deadline').length

  const parts: string[] = []
  
  if (blockers > 0) parts.push(`${blockers} blocker${blockers > 1 ? 's' : ''}`)
  if (decisions > 0) parts.push(`${decisions} decision${decisions > 1 ? 's' : ''} needed`)
  if (deadlines > 0) parts.push(`${deadlines} deadline${deadlines > 1 ? 's' : ''}`)
  if (mentions > 0) parts.push(`${mentions} @mention${mentions > 1 ? 's' : ''}`)
  if (questions > 0) parts.push(`${questions} question${questions > 1 ? 's' : ''}`)

  if (parts.length === 0) {
    return mode === 'calm' 
      ? "All clear! No urgent items need your attention."
      : "You're all caught up! No new signals detected."
  }

  return `Today you have: ${parts.join(', ')}.`
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get integration manager
  const manager = getIntegrationManager()
  const hasIntegrations = manager.hasAnyIntegration()
  
  // Allow unauthenticated access when integrations are configured (for testing)
  if (!user && !hasIntegrations && !isSimulationMode()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const mode = (searchParams.get('mode') || 'work') as IntentMode
  
  // Validate mode
  if (!['calm', 'on_the_go', 'work', 'focus'].includes(mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  try {
    // Fetch signals from all integrations
    let allSignals: UnifiedSignal[]
    let coverage: CoverageAssessment
    
    if (isSimulationMode()) {
      // Use simulated data for testing
      allSignals = generateSimulatedSignals('slack', 20)
      coverage = {
        overall: 'medium',
        percentage: 50,
        communicationCoverage: 100,
        taskCoverage: 0,
        connectedTools: ['slack'],
        missingTools: ['asana', 'linear'],
        message: 'Using simulated data for testing',
      }
    } else {
      allSignals = await manager.fetchAllSignals()
      coverage = manager.assessCoverage()
    }

    // Filter by mode
    const filteredSignals = filterByMode(allSignals, mode)
    
    // Generate brief
    const briefText = generateBrief(filteredSignals, mode)

    // Convert to legacy format for backwards compatibility
    const legacySignals = filteredSignals.map(toLeagcySignal)
    legacySignals.forEach(s => { s.user_id = user?.id || 'demo' })

    // Calculate stats
    const stats = {
      needsAttention: filteredSignals.filter(s => 
        ['blocker', 'decision', 'mention', 'escalation'].includes(s.category)
      ).length,
      fyi: filteredSignals.filter(s => 
        ['update', 'question'].includes(s.category)
      ).length,
      handled: 0,
      signals: filteredSignals.length,
      totalSignals: allSignals.length,
    }

    return NextResponse.json({
      mode,
      dataSource: coverage.connectedTools.join('+') || 'none',
      connectedTools: coverage.connectedTools,
      coverage: {
        level: coverage.overall,
        percentage: coverage.percentage,
        message: coverage.message,
      },
      brief: {
        brief_text: briefText,
        needs_attention: [],
        fyi_items: [],
        handled_items: [],
        coverage_percentage: coverage.percentage,
        total_items_processed: allSignals.length,
        items_surfaced: filteredSignals.length,
      },
      signals: legacySignals.slice(0, 50),
      stats,
    })
  } catch (error) {
    console.error('Failed to fetch data:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
