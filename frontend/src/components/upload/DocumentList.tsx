import { CheckCircle, Clock, XCircle, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Document } from '@/types'

interface DocumentListProps {
  documents: Document[]
  selectedDocIds: Set<string>
  onToggleDocument: (docId: string) => void
}

export default function DocumentList({
  documents,
  selectedDocIds,
  onToggleDocument,
}: DocumentListProps) {
  if (documents.length === 0) {
    return null
  }

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'READY':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'PROCESSING':
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'READY':
        return <Badge variant="default">Ready</Badge>
      case 'PROCESSING':
        return <Badge variant="secondary">Processing</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Uploaded Documents</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <Card
            key={doc.doc_id}
            className={`cursor-pointer transition-all ${
              selectedDocIds.has(doc.doc_id)
                ? 'ring-2 ring-primary'
                : 'hover:shadow-md'
            } ${doc.status !== 'READY' ? 'opacity-60' : ''}`}
            onClick={() => {
              if (doc.status === 'READY') {
                onToggleDocument(doc.doc_id)
              }
            }}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <CardTitle className="text-sm truncate" title={doc.filename}>
                    {doc.filename}
                  </CardTitle>
                </div>
                {getStatusIcon(doc.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getStatusBadge(doc.status)}
                {doc.page_count !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    {doc.page_count} pages
                  </p>
                )}
                {doc.error_message && (
                  <p className="text-xs text-destructive">
                    {doc.error_message}
                  </p>
                )}
                {doc.status === 'READY' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedDocIds.has(doc.doc_id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        onToggleDocument(doc.doc_id)
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-xs text-muted-foreground">
                      Select for chat
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
