import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import ChatWindow from '@/components/chat/ChatWindow'
import { ArrowLeft } from 'lucide-react'

export default function ChatPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const selectedDocIds = location.state?.selectedDocIds as string[] | undefined

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">RAG Chat</h1>
            <p className="text-sm text-muted-foreground">
              {selectedDocIds && selectedDocIds.length > 0
                ? `Searching ${selectedDocIds.length} selected document${
                    selectedDocIds.length > 1 ? 's' : ''
                  }`
                : 'Searching all documents'}
            </p>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatWindow selectedDocIds={selectedDocIds} />
      </div>
    </div>
  )
}
