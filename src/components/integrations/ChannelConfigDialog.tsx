'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Check, Hash, AtSign, Bell, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

interface Channel {
  id: string
  name: string
  type: 'channel' | 'group' | 'dm'
  memberCount?: number
  isMonitored: boolean
}

interface ChannelConfigDialogProps {
  provider: 'slack' | 'teams'
  isOpen: boolean
  onClose: () => void
}

export function ChannelConfigDialog({ provider, isOpen, onClose }: ChannelConfigDialogProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [mentionDetection, setMentionDetection] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && provider === 'slack') {
      // Fetch real channels from Slack
      setIsLoading(true)
      fetch('/api/integrations/slack/channels')
        .then(res => res.json())
        .then(data => {
          if (data.channels) {
            setChannels(data.channels.map((ch: { id: string; name: string; num_members?: number }) => ({
              id: ch.id,
              name: ch.name,
              type: 'channel' as const,
              memberCount: ch.num_members || 0,
              isMonitored: false, // Default to not monitored
            })))
          }
        })
        .catch(err => {
          console.error('Failed to fetch channels:', err)
          setChannels([])
        })
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, provider])

  const filteredChannels = channels.filter(ch => 
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const monitoredCount = channels.filter(ch => ch.isMonitored).length

  const toggleChannel = (channelId: string) => {
    setChannels(prev => prev.map(ch => 
      ch.id === channelId ? { ...ch, isMonitored: !ch.isMonitored } : ch
    ))
  }

  const handleSave = () => {
    // In a real app, this would save to the backend
    onClose()
  }

  if (!isOpen) return null

  const providerName = provider === 'slack' ? 'Slack' : 'Microsoft Teams'
  const providerIcon = provider === 'slack' ? '💬' : '🟦'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{providerIcon}</span>
              <div>
                <h2 className="text-lg font-semibold">{providerName} Settings</h2>
                <p className="text-sm text-muted-foreground">Configure monitoring preferences</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mention Detection Toggle */}
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <AtSign className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Global @mention Detection</p>
                  <p className="text-sm text-muted-foreground">
                    Detect when you&apos;re @mentioned in ANY channel, even ones not monitored below
                  </p>
                </div>
              </div>
              <Switch
                checked={mentionDetection}
                onCheckedChange={setMentionDetection}
              />
            </div>
          </div>

          {/* Channel List */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Monitored Channels</span>
                <Badge variant="secondary" className="text-xs">
                  {monitoredCount} active
                </Badge>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search channels..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Channel List */}
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading channels...</span>
                </div>
              ) : filteredChannels.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {searchQuery ? 'No channels match your search' : 'No channels found. Make sure Slack is connected.'}
                </div>
              ) : (
                filteredChannels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => toggleChannel(channel.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                    channel.isMonitored 
                      ? 'bg-blue-500/10 border border-blue-500/30' 
                      : 'hover:bg-muted border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Hash className={`h-4 w-4 ${channel.isMonitored ? 'text-blue-500' : 'text-muted-foreground'}`} />
                    <span className={`text-sm ${channel.isMonitored ? 'font-medium' : ''}`}>
                      {channel.name}
                    </span>
                    {channel.memberCount && (
                      <span className="text-xs text-muted-foreground">
                        {channel.memberCount} members
                      </span>
                    )}
                  </div>
                  {channel.isMonitored && (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
                </button>
              ))
              )}
            </div>
          </div>

          {/* Info Note */}
          <div className="px-4 pb-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Bell className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  <strong>Smart Detection:</strong> Even if a channel isn&apos;t monitored, EagleEye will still catch direct @mentions of you, urgent keywords, and escalations directed to you.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/30">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
