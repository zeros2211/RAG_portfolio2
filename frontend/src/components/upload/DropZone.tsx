import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export default function DropZone({ onFilesSelected, disabled = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === 'application/pdf'
    )

    if (files.length > 0) {
      onFilesSelected(files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      onFilesSelected(files)
      // Reset input
      e.target.value = ''
    }
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <Card
      className={`relative border-2 border-dashed transition-colors cursor-pointer ${
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">
          Drop PDF files here
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          or click to browse
        </p>
        <Button
          variant="outline"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
        >
          Select Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled}
        />
      </div>
    </Card>
  )
}
