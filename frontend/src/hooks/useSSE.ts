import { useRef, useCallback } from 'react'
import { SSECallbacks } from '@/types'

export function useSSE() {
  const eventSourceRef = useRef<EventSource | null>(null)

  const startStream = useCallback((url: string, callbacks: SSECallbacks) => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    // Session event
    eventSource.addEventListener('session', (event) => {
      try {
        const data = JSON.parse(event.data)
        callbacks.onSession?.(data.session_id)
      } catch (error) {
        console.error('Error parsing session event:', error)
      }
    })

    // Token event (streaming response)
    eventSource.addEventListener('token', (event) => {
      try {
        const data = JSON.parse(event.data)
        callbacks.onToken?.(data.text)
      } catch (error) {
        console.error('Error parsing token event:', error)
      }
    })

    // Sources event
    eventSource.addEventListener('sources', (event) => {
      try {
        const data = JSON.parse(event.data)
        callbacks.onSources?.(data.sources)
      } catch (error) {
        console.error('Error parsing sources event:', error)
      }
    })

    // Done event
    eventSource.addEventListener('done', () => {
      callbacks.onDone?.()
      eventSource.close()
    })

    // Error event
    eventSource.addEventListener('error', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data)
        callbacks.onError?.(data.message)
      } catch {
        callbacks.onError?.('Connection error occurred')
      }
      eventSource.close()
    })

    // Connection error
    eventSource.onerror = () => {
      callbacks.onError?.('Failed to connect to server')
      eventSource.close()
    }

    return eventSource
  }, [])

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  return { startStream, stopStream }
}
