import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedPosts } from '@/features/posts/queries'
import { PostList } from '@/features/posts/components/PostList'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Evidence-based recovery guides and personal stories for breaking free from porn addiction.',
}

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page: pageParam } = await searchParams
  const page = Number(pageParam) || 1
  const limit = 12
  const { posts, total } = await getPublishedPosts(page, limit)

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="max-w-5xl mx-auto py-16 px-6 animate-page">
      {/* Page header */}
      <div className="border-b border-border/60 pb-10 mb-12">
        <h1 className="editorial-heading text-4xl md:text-5xl mb-3">Articles</h1>
        <p className="text-muted-foreground text-base max-w-xl leading-relaxed">
          Evidence-based recovery guides, personal stories, and practical tools for lasting change.
        </p>
      </div>

      <PostList posts={posts} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-12">
          {page > 1 && (
            <Link
              href={`/blog?page=${page - 1}`}
              className="px-5 py-2 border border-border rounded-full text-sm hover:border-foreground/30 hover:text-foreground transition-colors text-muted-foreground"
            >
              ← Previous
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/blog?page=${page + 1}`}
              className="px-5 py-2 border border-border rounded-full text-sm hover:border-foreground/30 hover:text-foreground transition-colors text-muted-foreground"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
