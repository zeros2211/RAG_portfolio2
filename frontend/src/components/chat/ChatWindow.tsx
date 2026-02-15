import { useState, useRef, useEffect } from 'react'
import { ChatMessage, Source } from '@/types'
import { chatApi } from '@/services/api'
import { useSSE } from '@/hooks/useSSE'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import SourcesPanel from './SourcesPanel'

interface ChatWindowProps {
  selectedDocIds?: string[]
  sessionId?: string
  onSessionIdChange?: (sessionId: string) => void
}

export default function ChatWindow({ selectedDocIds, sessionId: propSessionId, onSessionIdChange }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | undefined>(propSessionId)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [currentSources, setCurrentSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const streamingContentRef = useRef('')

  const { startStream } = useSSE()

  // Load messages when session ID changes
  useEffect(() => {
    const loadMessages = async () => {
      if (propSessionId) {
        setIsLoading(true)
        setSessionId(propSessionId)
        try {
          const loadedMessages = await chatApi.getSessionMessages(propSessionId)
          setMessages(loadedMessages)
        } catch (error) {
          console.error('Failed to load chat history:', error)
          setMessages([])
        } finally {
          setIsLoading(false)
        }
      } else {
        // New chat - clear messages
        setMessages([])
        setSessionId(undefined)
      }
    }
    loadMessages()
  }, [propSessionId])

  const handleMessageClick = (message: ChatMessage) => {
    if (message.sources) {
      setCurrentSources(message.sources)
    }
  }

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
        if (onSessionIdChange) {
          onSessionIdChange(newSessionId)
        }
      },
      onToken: (text) => {
        streamingContentRef.current += text
        setStreamingContent((prev) => prev + text)
      },
      onSources: (sources) => {
        setCurrentSources(sources)
        // Add assistant message with sources using ref value
        const finalContent = streamingContentRef.current
        setMessages((prev) => {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: finalContent,
            sources,
          }
          return [...prev, assistantMessage]
        })
      },
      onDone: () => {
        // Stop streaming and cleanup after message is added
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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading chat history...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          onMessageClick={handleMessageClick}
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
