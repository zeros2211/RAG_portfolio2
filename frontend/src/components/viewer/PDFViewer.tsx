import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PDFViewerProps {
  docId: string
  initialPage?: number
  fileUrl: string
}

export default function PDFViewer({
  initialPage = 1,
  fileUrl,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(initialPage)
  const [pageInput, setPageInput] = useState<string>(String(initialPage))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error)
    setError('Failed to load PDF document')
    setLoading(false)
  }

  const goToPreviousPage = () => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1
      setPageNumber(newPage)
      setPageInput(String(newPage))
    }
  }

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      const newPage = pageNumber + 1
      setPageNumber(newPage)
      setPageInput(String(newPage))
    }
  }

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value)
  }

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const page = parseInt(pageInput, 10)
    if (!isNaN(page) && page >= 1 && page <= numPages) {
      setPageNumber(page)
    } else {
      setPageInput(String(pageNumber))
    }
  }

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* Controls */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousPage}
              disabled={pageNumber <= 1 || loading}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages || loading}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Page</span>
            <Input
              type="text"
              value={pageInput}
              onChange={handlePageInputChange}
              className="w-16 text-center"
              disabled={loading}
            />
            <span className="text-sm text-muted-foreground">
              of {numPages || '...'}
            </span>
          </form>

          <div className="w-24" />
        </div>
      </div>

      {/* PDF Display */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto">
          {loading && (
            <Card className="p-8 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading PDF...</p>
              </div>
            </Card>
          )}

          {error && (
            <Card className="p-8 bg-destructive/10 border-destructive">
              <p className="text-destructive text-center">{error}</p>
            </Card>
          )}

          {!error && (
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
              error=""
            >
              <div className="bg-white shadow-lg">
                <Page
                  pageNumber={pageNumber}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="mx-auto"
                />
              </div>
            </Document>
          )}
        </div>
      </div>
    </div>
  )
}
