import { MessageSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { ChatSession } from '@/services/api'

interface ChatSidebarProps {
  sessions: ChatSession[]
  currentSessionId?: string
  onSessionSelect: (sessionId: string) => void
  onNewChat: () => void
}

export default function ChatSidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewChat,
}: ChatSidebarProps) {
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

  return (
    <div className="w-64 border-r bg-muted/10 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <Button
          onClick={onNewChat}
          className="w-full gap-2"
          variant="default"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
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
                className={`p-3 cursor-pointer transition-all hover:bg-accent ${
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
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
