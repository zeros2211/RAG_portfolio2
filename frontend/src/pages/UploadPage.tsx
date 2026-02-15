import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import DropZone from '@/components/upload/DropZone'
import DocumentList from '@/components/upload/DocumentList'
import { documentApi } from '@/services/api'
import { Document } from '@/types'
import { MessageSquare, CheckSquare, Square } from 'lucide-react'

export default function UploadPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set())
  const [isUploading, setIsUploading] = useState(false)

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

  const readyDocuments = documents.filter((doc) => doc.status === 'READY')
  const hasReadyDocuments = readyDocuments.length > 0
  const allSelected = hasReadyDocuments && selectedDocIds.size === readyDocuments.length

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">RAG Chat System</h1>
          <p className="text-muted-foreground">
            Upload PDF documents and start asking questions
          </p>
        </div>

        <DropZone onFilesSelected={handleFilesSelected} disabled={isUploading} />

        {isUploading && (
          <div className="mt-4 text-center text-muted-foreground">
            Uploading files...
          </div>
        )}

        {hasReadyDocuments && (
          <div className="mt-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Uploaded Documents</h2>
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
                  Select All Documents
                </>
              )}
            </Button>
          </div>
        )}

        <DocumentList
          documents={documents}
          selectedDocIds={selectedDocIds}
          onToggleDocument={handleToggleDocument}
        />

        {hasReadyDocuments && (
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              onClick={handleStartChat}
              disabled={selectedDocIds.size === 0}
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              {selectedDocIds.size > 0
                ? `Start Chat (${selectedDocIds.size} selected)`
                : 'Select documents to start chat'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
