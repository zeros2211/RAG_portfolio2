import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Source } from '@/types'
import { FileText, ExternalLink } from 'lucide-react'

interface SourcesPanelProps {
  sources: Source[]
  onSourceClick?: (source: Source) => void
}

export default function SourcesPanel({ sources, onSourceClick }: SourcesPanelProps) {
  if (sources.length === 0) {
    return (
      <div className="w-80 border-l bg-muted/20 p-4">
        <h3 className="font-semibold mb-4">Sources</h3>
        <p className="text-sm text-muted-foreground">
          No sources yet. Send a message to see relevant sources.
        </p>
      </div>
    )
  }

  const handleSourceClick = (source: Source) => {
    onSourceClick?.(source)
  }

  const getScoreColor = (score: number) => {
    // Lower score = more similar (cosine distance)
    if (score < 0.3) return 'text-green-600'
    if (score < 0.6) return 'text-yellow-600'
    return 'text-orange-600'
  }

  return (
    <div className="w-80 border-l bg-muted/20 flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Sources ({sources.length})</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {sources.map((source, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleSourceClick(source)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <CardTitle
                      className="text-sm truncate"
                      title={source.filename}
                    >
                      {source.filename}
                    </CardTitle>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Page {source.page}</Badge>
                  <span
                    className={`text-xs font-medium ${getScoreColor(
                      source.score
                    )}`}
                  >
                    Relevance: {((1 - source.score) * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {source.snippet}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
