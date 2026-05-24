import Link from 'next/link'
import { NavAuthButton } from '@/components/NavAuthButton'
import { HeaderSearch } from '@/components/HeaderSearch'

export default function PublicLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/40 sticky top-0 z-50 bg-background">
        <div className="max-w-5xl mx-auto py-5 px-6 flex items-center justify-between">
          <Link
            href="/"
            className="hover:opacity-70 transition-opacity"
          >
            <span className="editorial-heading text-xl tracking-tight">
              I Am Unhooked
            </span>
          </Link>
          <nav className="flex items-center gap-8">
            <Link
              href="/blog"
              className="editorial-label hover:text-foreground transition-colors hidden sm:block"
            >
              Articles
            </Link>
            <HeaderSearch />
            <NavAuthButton />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/40">
        <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="editorial-label">
            &copy; {new Date().getFullYear()} I Am Unhooked
          </span>
          <nav className="flex items-center gap-6">
            <Link href="/blog" className="editorial-label hover:text-foreground transition-colors">
              Articles
            </Link>
            <Link href="/" className="editorial-label hover:text-foreground transition-colors">
              Home
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
