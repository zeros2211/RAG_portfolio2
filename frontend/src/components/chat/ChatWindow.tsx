import { useState, useRef, useEffect } from 'react'
import { ChatMessage, Source } from '@/types'
import { chatApi } from '@/services/api'
import { useSSE } from '@/hooks/useSSE'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import SourcesPanel from './SourcesPanel'

interface ChatWindowProps {
  selectedDocIds?: string[]
}

const SESSION_STORAGE_KEY = 'chat_session_id'

export default function ChatWindow({ selectedDocIds }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string>()
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [currentSources, setCurrentSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const streamingContentRef = useRef('')

  const { startStream } = useSSE()

  // Load session and messages on mount
  useEffect(() => {
    const loadSession = async () => {
      const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY)
      if (savedSessionId) {
        setSessionId(savedSessionId)
        try {
          const loadedMessages = await chatApi.getSessionMessages(savedSessionId)
          setMessages(loadedMessages)
        } catch (error) {
          console.error('Failed to load chat history:', error)
          // If session not found, start fresh
          localStorage.removeItem(SESSION_STORAGE_KEY)
        }
      }
      setIsLoading(false)
    }
    loadSession()
  }, [])

  // Save session ID to localStorage when it changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId)
    }
  }, [sessionId])

  const handleClearChat = () => {
    if (confirm('Are you sure you want to start a new chat? This will clear the current conversation.')) {
      setMessages([])
      setSessionId(undefined)
      setCurrentSources([])
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

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
        {messages.length > 0 && (
          <div className="border-b bg-card px-4 py-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              disabled={isStreaming}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        )}
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
