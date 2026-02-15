import React, { useState, useRef } from 'react'
import { ChatMessage, Source } from '@/types'
import { chatApi } from '@/services/api'
import { useSSE } from '@/hooks/useSSE'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import SourcesPanel from './SourcesPanel'

interface ChatWindowProps {
  selectedDocIds?: string[]
}

export default function ChatWindow({ selectedDocIds }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string>()
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [currentSources, setCurrentSources] = useState<Source[]>([])
  const streamingContentRef = useRef('')

  const { startStream, stopStream } = useSSE()

  const handleSendMessage = (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
    }
    setMessages((prev) => [...prev, userMessage])

    // Start streaming
    setIsStreaming(true)
    setStreamingContent('')
    streamingContentRef.current = ''

    // Build SSE URL
    const url = chatApi.getChatStreamUrl(message, sessionId, selectedDocIds)

    // Start SSE stream
    startStream(url, {
      onSession: (newSessionId) => {
        setSessionId(newSessionId)
      },
      onToken: (text) => {
        streamingContentRef.current += text
        setStreamingContent((prev) => prev + text)
      },
      onSources: (sources) => {
        setCurrentSources(sources)
        // Add assistant message with sources using ref value
        setMessages((prev) => {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: streamingContentRef.current,
            sources,
          }
          return [...prev, assistantMessage]
        })
      },
      onDone: () => {
        setIsStreaming(false)
        setStreamingContent('')
        streamingContentRef.current = ''
      },
      onError: (errorMessage) => {
        console.error('SSE Error:', errorMessage)
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: `Error: ${errorMessage}`,
        }
        setMessages((prev) => [...prev, errorMsg])
        setIsStreaming(false)
        setStreamingContent('')
        streamingContentRef.current = ''
      },
    })
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
        />
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={isStreaming}
        />
      </div>
      <SourcesPanel sources={currentSources} />
    </div>
  )
}
