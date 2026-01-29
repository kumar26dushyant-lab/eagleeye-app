// Integration Layer - Public API
// Clean exports for the rest of the app

// Core types
export * from './types'

// Integration manager (main entry point)
export * from './manager'

// Simulator for testing
export { generateSimulatedSignals, generateSimulatedHealth, isSimulationMode } from './simulator'

// Individual adapters (new unified pattern)
export { SlackAdapter, SLACK_REQUIRED_SCOPES } from './adapters/slack'
export { AsanaAdapter, ASANA_REQUIRED_SCOPES } from './adapters/asana'

// Legacy exports (for backwards compatibility)
export * from './slack'
export * from './asana'
export * from './linear'
