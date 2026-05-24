'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-5">
        <p className="editorial-label">Error</p>
        <h1 className="editorial-heading text-3xl">Something went wrong</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="h-10 px-6 bg-foreground text-background rounded-full text-sm font-medium inline-flex items-center justify-center hover:opacity-80 transition-opacity"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
