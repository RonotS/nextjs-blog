import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-5">
        <p className="editorial-label">Page not found</p>
        <h1 className="editorial-heading text-7xl">404</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center pt-2">
          <Link
            href="/"
            className="h-10 px-6 bg-foreground text-background rounded-full text-sm font-medium inline-flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            Go Home
          </Link>
          <Link
            href="/blog"
            className="h-10 px-6 border border-border rounded-full text-sm inline-flex items-center justify-center hover:border-foreground/30 transition-colors text-muted-foreground hover:text-foreground"
          >
            Read Articles
          </Link>
        </div>
      </div>
    </div>
  )
}
