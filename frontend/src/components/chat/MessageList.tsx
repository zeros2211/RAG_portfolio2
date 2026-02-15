import React, { useEffect, useRef } from 'react'
import { ChatMessage } from '@/types'
import { User, Bot } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface MessageListProps {
  messages: ChatMessage[]
  isStreaming: boolean
  streamingContent: string
}

export default function MessageList({
  messages,
  isStreaming,
  streamingContent,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex gap-3 ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.role === 'assistant' && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <Card
            className={`max-w-[80%] p-4 ${
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </Card>
          {message.role === 'user' && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-5 w-5 text-secondary-foreground" />
            </div>
          )}
        </div>
      ))}

      {/* Streaming message */}
      {isStreaming && (
        <div className="flex gap-3 justify-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <Card className="max-w-[80%] p-4 bg-muted">
            <p className="whitespace-pre-wrap break-words">
              {streamingContent}
              <span className="inline-block w-2 h-4 ml-1 bg-foreground animate-pulse" />
            </p>
          </Card>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
