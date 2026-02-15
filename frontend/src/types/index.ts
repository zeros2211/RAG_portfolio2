export type DocumentStatus = 'PROCESSING' | 'READY' | 'FAILED'

export interface Document {
  doc_id: string
  filename: string
  status: DocumentStatus
  page_count?: number
  error_message?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

export interface Source {
  doc_id: string
  filename: string
  page: number
  score: number
  snippet: string
}

export interface SSECallbacks {
  onSession?: (sessionId: string) => void
  onToken?: (text: string) => void
  onSources?: (sources: Source[]) => void
  onDone?: () => void
  onError?: (message: string) => void
}
