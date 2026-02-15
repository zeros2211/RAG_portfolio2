import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ChatWindow from '@/components/chat/ChatWindow'
import ChatSidebar from '@/components/chat/ChatSidebar'
import { ArrowLeft } from 'lucide-react'
import { documentApi, chatApi, ChatSession } from '@/services/api'
import { Document } from '@/types'

export default function ChatPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const selectedDocIds = location.state?.selectedDocIds as string[] | undefined
  const initialSessionId = location.state?.sessionId as string | undefined
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(initialSessionId)

  // Load sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const allSessions = await chatApi.getSessions()
        setSessions(allSessions)
      } catch (error) {
        console.error('Failed to load sessions:', error)
      }
    }
    loadSessions()
  }, [])

  // Load selected document details
  useEffect(() => {
    const loadDocuments = async () => {
      if (selectedDocIds && selectedDocIds.length > 0) {
        setLoadingDocs(true)
        try {
          const docs = await Promise.all(
            selectedDocIds.map(id => documentApi.getDocument(id))
          )
          setSelectedDocuments(docs)
        } catch (error) {
          console.error('Failed to load document details:', error)
        } finally {
          setLoadingDocs(false)
        }
      }
    }
    loadDocuments()
  }, [selectedDocIds])

  const handleNewChat = () => {
    setCurrentSessionId(undefined)
  }

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId)
  }

  const handleSessionIdChange = async (sessionId: string) => {
    setCurrentSessionId(sessionId)
    // Refresh sessions list
    try {
      const allSessions = await chatApi.getSessions()
      setSessions(allSessions)
    } catch (error) {
      console.error('Failed to refresh sessions:', error)
    }
  }

  const handleSessionDeleted = async () => {
    // Refresh sessions list after deletion
    try {
      const allSessions = await chatApi.getSessions()
      setSessions(allSessions)
      // If current session was deleted, navigate to new chat
      if (currentSessionId && !allSessions.find(s => s.session_id === currentSessionId)) {
        setCurrentSessionId(undefined)
      }
    } catch (error) {
      console.error('Failed to refresh sessions:', error)
    }
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        onSessionDeleted={handleSessionDeleted}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">RAG Chat</h1>
              <div className="mt-1">
                {loadingDocs ? (
                  <p className="text-sm text-muted-foreground">Loading documents...</p>
                ) : selectedDocuments.length > 0 ? (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-muted-foreground">Searching:</span>
                    {selectedDocuments.map(doc => (
                      <Badge key={doc.doc_id} variant="secondary" className="text-xs">
                        {doc.filename}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents selected</p>
                )}
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            selectedDocIds={selectedDocIds}
            sessionId={currentSessionId}
            onSessionIdChange={handleSessionIdChange}
          />
        </div>
      </div>
    </div>
  )
}
