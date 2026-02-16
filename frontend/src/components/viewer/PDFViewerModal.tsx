import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import PDFViewer from './PDFViewer'
import { documentApi } from '@/services/api'

interface PDFViewerModalProps {
  open: boolean
  onClose: () => void
  docId: string | null
  filename: string | null
  initialPage?: number
}

export default function PDFViewerModal({
  open,
  onClose,
  docId,
  filename,
  initialPage = 1,
}: PDFViewerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (!docId) return null

  const fileUrl = documentApi.getDocumentFileUrl(docId)

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={
          isFullscreen
            ? "max-w-full h-screen w-screen p-0 gap-0 m-0 rounded-none"
            : "max-w-6xl h-[90vh] p-0 gap-0"
        }
      >
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{filename || 'PDF Document'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <PDFViewer
            docId={docId}
            initialPage={initialPage}
            fileUrl={fileUrl}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
