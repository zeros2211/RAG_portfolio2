import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import PDFViewer from '@/components/viewer/PDFViewer'
import { documentApi } from '@/services/api'
import { ArrowLeft } from 'lucide-react'

export default function ViewerPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const docId = searchParams.get('docId')
  const pageParam = searchParams.get('page')
  const page = pageParam ? parseInt(pageParam, 10) : 1

  if (!docId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">No document ID provided</p>
          <Button onClick={() => navigate('/chat')}>
            Back to Chat
          </Button>
        </div>
      </div>
    )
  }

  const fileUrl = documentApi.getDocumentFileUrl(docId)

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-card px-6 py-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">PDF Viewer</h1>
      </header>
      <div className="flex-1 overflow-hidden">
        <PDFViewer
          docId={docId}
          initialPage={page}
          fileUrl={fileUrl}
        />
      </div>
    </div>
  )
}
