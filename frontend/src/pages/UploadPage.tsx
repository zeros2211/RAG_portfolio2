import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DropZone from '@/components/upload/DropZone'
import DocumentList from '@/components/upload/DocumentList'
import ChatSidebar from '@/components/chat/ChatSidebar'
import { documentApi, chatApi, ChatSession } from '@/services/api'
import { Document } from '@/types'
import { MessageSquare, CheckSquare, Square, Upload } from 'lucide-react'

export default function UploadPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set())
  const [isUploading, setIsUploading] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])

  // Load chat sessions
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

  // Poll for document status updates
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const docs = await documentApi.getDocuments()
        setDocuments(docs)
      } catch (error) {
        console.error('Error fetching documents:', error)
      }
    }

    // Initial fetch
    fetchDocuments()

    // Poll every 2 seconds
    const interval = setInterval(fetchDocuments, 2000)

    return () => clearInterval(interval)
  }, [])

  const handleFilesSelected = async (files: File[]) => {
    setIsUploading(true)
    try {
      const uploadedDocs = await documentApi.uploadDocuments(files)
      setDocuments(uploadedDocs)
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Failed to upload files. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleToggleDocument = (docId: string) => {
    setSelectedDocIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(docId)) {
        newSet.delete(docId)
      } else {
        newSet.add(docId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    const readyDocIds = readyDocuments.map((doc) => doc.doc_id)
    if (selectedDocIds.size === readyDocIds.length) {
      // Deselect all
      setSelectedDocIds(new Set())
    } else {
      // Select all
      setSelectedDocIds(new Set(readyDocIds))
    }
  }

  const handleStartChat = () => {
    // Pass selected doc IDs to chat page
    const selectedIds = Array.from(selectedDocIds)
    navigate('/chat', {
      state: { selectedDocIds: selectedIds },
    })
  }

  const handleNewChat = () => {
    navigate('/chat')
  }

  const handleSessionSelect = (sessionId: string) => {
    const session = sessions.find(s => s.session_id === sessionId)
    navigate('/chat', {
      state: {
        sessionId,
        selectedDocIds: session?.doc_ids || []
      }
    })
  }

  const handleSessionDeleted = async () => {
    // Refresh sessions list after deletion
    try {
      const allSessions = await chatApi.getSessions()
      setSessions(allSessions)
    } catch (error) {
      console.error('Failed to refresh sessions:', error)
    }
  }

  const readyDocuments = documents.filter((doc) => doc.status === 'READY')
  const hasReadyDocuments = readyDocuments.length > 0
  const allSelected = hasReadyDocuments && selectedDocIds.size === readyDocuments.length

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        currentSessionId={undefined}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        onSessionDeleted={handleSessionDeleted}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-8 py-8 max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              RAG Chat System
            </h1>
            <p className="text-lg text-muted-foreground">
              Upload PDF documents and start asking questions with AI-powered search
            </p>
          </div>

          {/* Upload Card */}
          <Card className="mb-8 border-2 border-dashed hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Documents
              </CardTitle>
              <CardDescription>
                Drag and drop PDF files or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DropZone onFilesSelected={handleFilesSelected} disabled={isUploading} />
              {isUploading && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Processing files...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents Card */}
          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Your Documents</CardTitle>
                    <CardDescription>
                      Select documents to search when chatting
                    </CardDescription>
                  </div>
                  {hasReadyDocuments && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="gap-2"
                    >
                      {allSelected ? (
                        <>
                          <CheckSquare className="h-4 w-4" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4" />
                          Select All
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <DocumentList
                  documents={documents}
                  selectedDocIds={selectedDocIds}
                  onToggleDocument={handleToggleDocument}
                />
              </CardContent>
            </Card>
          )}

          {/* Start Chat Button */}
          {hasReadyDocuments && (
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                onClick={handleStartChat}
                disabled={selectedDocIds.size === 0}
                className="gap-2 px-8 py-6 text-lg"
              >
                <MessageSquare className="h-5 w-5" />
                {selectedDocIds.size > 0
                  ? `Start Chat with ${selectedDocIds.size} Document${selectedDocIds.size > 1 ? 's' : ''}`
                  : 'Select documents to start chat'}
              </Button>
            </div>
          )}

          {/* Empty State */}
          {documents.length === 0 && !isUploading && (
            <div className="text-center py-12">
              <Upload className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No documents yet</h3>
              <p className="text-muted-foreground">
                Upload your first PDF to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
