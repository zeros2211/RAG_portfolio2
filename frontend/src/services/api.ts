import axios from 'axios'
import { Document, ChatMessage } from '@/types'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

export const documentApi = {
  uploadDocuments: async (files: File[]): Promise<Document[]> => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    const response = await api.post<Document[]>('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getDocuments: async (): Promise<Document[]> => {
    const response = await api.get<Document[]>('/documents')
    return response.data
  },

  getDocument: async (docId: string): Promise<Document> => {
    const response = await api.get<Document>(`/documents/${docId}`)
    return response.data
  },

  getDocumentFileUrl: (docId: string): string => {
    return `${API_BASE_URL}/documents/${docId}/file`
  },
}

export const chatApi = {
  getChatStreamUrl: (
    message: string,
    sessionId?: string,
    docIds?: string[]
  ): string => {
    const params = new URLSearchParams({ message })
    if (sessionId) params.append('session_id', sessionId)
    if (docIds && docIds.length > 0) {
      params.append('doc_ids', docIds.join(','))
    }
    return `${API_BASE_URL}/chat/stream?${params.toString()}`
  },

  getSessionMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await api.get<Array<{role: 'user' | 'assistant', content: string, created_at: string}>>(
      `/chat/sessions/${sessionId}/messages`
    )
    return response.data.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))
  },
}

export default api
