import { MessageSquare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { ChatSession, chatApi } from '@/services/api'
import { useState } from 'react'

interface ChatSidebarProps {
  sessions: ChatSession[]
  currentSessionId?: string
  onSessionSelect: (sessionId: string) => void
  onSessionDeleted?: () => void
}

export default function ChatSidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onSessionDeleted,
}: ChatSidebarProps) {
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent session selection

    if (!confirm('Delete this chat? This action cannot be undone.')) {
      return
    }

    setDeletingSessionId(sessionId)
    try {
      await chatApi.deleteSession(sessionId)
      onSessionDeleted?.()
    } catch (error) {
      console.error('Failed to delete session:', error)
      alert('Failed to delete chat. Please try again.')
    } finally {
      setDeletingSessionId(null)
    }
  }

  return (
    <div className="w-64 border-r bg-muted/10 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          RAG System
        </h2>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No chat history yet
            </div>
          ) : (
            sessions.map((session) => (
              <Card
                key={session.session_id}
                className={`p-3 cursor-pointer transition-all hover:bg-accent group relative ${
                  currentSessionId === session.session_id
                    ? 'bg-accent border-primary'
                    : 'bg-background'
                }`}
                onClick={() => onSessionSelect(session.session_id)}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {session.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(session.updated_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteSession(session.session_id, e)}
                    disabled={deletingSessionId === session.session_id}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
