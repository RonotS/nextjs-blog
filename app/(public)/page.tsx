import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import type { Metadata } from 'next'
import { getPublishedPosts } from '@/features/posts/queries'
import { getPopularTags } from '@/features/posts/queries'
import { readTime } from '@/lib/utils'
import type { PostWithRelations } from '@/features/posts/types'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Practical deep-dives, guides, and architecture insights for engineers who ship.',
}

export const revalidate = 60

interface HomePageProps {
  searchParams: Promise<{ code?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  if (params.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`)
  }

  const [{ posts }, popularTags] = await Promise.all([
    getPublishedPosts(1, 10),
    getPopularTags(8),
  ])

  if (posts.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-24 text-center">
        <p className="text-muted-foreground">No articles yet — check back soon.</p>
      </div>
    )
  }

  const featured = posts[0]
  const rest = posts.slice(1)

  return (
    <div className="animate-page">
      {/* ── Featured Article Hero ── */}
      <FeaturedHero post={featured} />

      {/* ── Article Grid ── */}
      {rest.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {rest.map((post, i) => (
              <ArticleCard
                key={post.id}
                post={post}
                style={{ animationDelay: `${(i + 1) * 80}ms` }}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Tags ── */}
      {popularTags.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="border-t border-border/60 pt-10">
            <p className="editorial-label mb-5">Topics</p>
            <div className="flex flex-wrap gap-3">
              {popularTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog/tag/${tag.slug}`}
                  className="border border-border rounded-full px-4 py-1.5 text-xs tracking-wide text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

// ── Featured hero ─────────────────────────────────────────────────────────────

function FeaturedHero({ post }: { post: PostWithRelations }) {
  const authorName = post.author?.full_name ?? post.author?.email ?? 'Unknown'
  const mins = readTime(post.content ?? '')
  const publishedDate = post.published_at
    ? format(new Date(post.published_at), 'MMMM d, yyyy')
    : null

  return (
    <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center border-b border-border/60">
      {/* Category label */}
      {post.category && (
        <Link
          href={`/blog/category/${post.category.slug}`}
          className="editorial-label hover:text-foreground transition-colors"
        >
          {post.category.name}
        </Link>
      )}

      {/* Title */}
      <Link href={`/blog/${post.slug}`}>
        <h1 className="editorial-heading text-4xl md:text-5xl lg:text-6xl mt-4 mb-6 hover:opacity-70 transition-opacity">
          {post.title}
        </h1>
      </Link>

      {/* Excerpt */}
      {post.excerpt && (
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
          {post.excerpt}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>{authorName}</span>
        {publishedDate && (
          <>
            <span className="text-border">·</span>
            <time dateTime={post.published_at!}>{publishedDate}</time>
          </>
        )}
        <span className="text-border">·</span>
        <span>{mins} min read</span>
      </div>
    </section>
  )
}

// ── Article card ──────────────────────────────────────────────────────────────

function ArticleCard({
  post,
  style,
}: {
  post: PostWithRelations
  style?: React.CSSProperties
}) {
  const authorName = post.author?.full_name ?? post.author?.email ?? 'Unknown'
  const mins = readTime(post.content ?? '')
  const publishedDate = post.published_at
    ? format(new Date(post.published_at), 'MMM d, yyyy')
    : null

  return (
    <article className="animate-fade-up group" style={style}>
      {/* Cover image */}
      {post.cover_image && (
        <Link href={`/blog/${post.slug}`} className="block mb-4">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        </Link>
      )}

      {/* Category */}
      {post.category && (
        <Link
          href={`/blog/category/${post.category.slug}`}
          className="editorial-label hover:text-foreground transition-colors"
        >
          {post.category.name}
        </Link>
      )}

      {/* Title */}
      <Link href={`/blog/${post.slug}`}>
        <h2 className="editorial-heading text-xl md:text-2xl mt-2 mb-2 group-hover:opacity-70 transition-opacity">
          {post.title}
        </h2>
      </Link>

      {/* Excerpt */}
      {post.excerpt && (
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-3">
          {post.excerpt}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{authorName}</span>
        {publishedDate && (
          <>
            <span className="text-border">·</span>
            <time dateTime={post.published_at!}>{publishedDate}</time>
          </>
        )}
        <span className="text-border">·</span>
        <span>{mins} min read</span>
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-3">
          {post.tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/blog/tag/${tag.slug}`}
              className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}
    </article>
  )
}
