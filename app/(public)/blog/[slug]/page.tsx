import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Metadata } from 'next'
import { getPostBySlug, getAllPublishedSlugs } from '@/features/posts/queries'
import { EditorContent } from '@/components/editor/EditorContent'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { BackToTopButton } from '@/components/BackToTopButton'
import { CommentSection } from '@/features/comments/components/CommentSection'
import { ShareButton } from '@/components/ShareButton'
import { ChevronLeftIcon } from 'lucide-react'
import { SubscribeForm } from '@/components/newsletter/SubscribeForm'
import { readTime } from '@/lib/utils'

export const revalidate = 3600

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || '',
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || '',
      images: post.cover_image ? [post.cover_image] : [],
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      authors: post.author?.full_name ? [post.author.full_name] : undefined,
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const initials = post.author?.full_name
    ? post.author.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : post.author?.email?.[0]?.toUpperCase() ?? '?'

  const authorName = post.author?.full_name ?? post.author?.email ?? 'Unknown'
  const mins = readTime(post.content ?? '')
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? post.seo_description ?? '',
    image: post.cover_image ? [post.cover_image] : [],
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: post.author?.full_name
      ? [{ '@type': 'Person', name: post.author.full_name }]
      : [],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="animate-page">
        {/* ── Header ── */}
        <div className="max-w-3xl mx-auto px-6 pt-12">
          <div className="flex items-center gap-3 mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeftIcon className="size-3.5" aria-hidden="true" />
              Back to Articles
            </Link>
            {post.category && (
              <Link
                href={`/blog/category/${post.category.slug}`}
                className="editorial-label hover:text-foreground transition-colors"
              >
                {post.category.name}
              </Link>
            )}
          </div>

          {/* Title */}
          <h1 className="editorial-heading text-4xl md:text-5xl lg:text-[3.5rem] mb-6">
            {post.title}
          </h1>

          {/* Author & meta */}
          <div className="flex items-center gap-3 mb-10 text-sm text-muted-foreground">
            <Avatar className="h-9 w-9">
              <AvatarFallback
                className="text-xs font-semibold"
                style={{ background: '#1a1a1a', color: '#fff' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-medium">{authorName}</span>
              {post.published_at && (
                <>
                  <span className="text-border">·</span>
                  <time dateTime={post.published_at}>
                    {format(new Date(post.published_at), 'MMMM d, yyyy')}
                  </time>
                </>
              )}
              <span className="text-border">·</span>
              <span>{mins} min read</span>
            </div>
            <div className="ml-auto">
              <ShareButton
                url={`${baseUrl}/blog/${post.slug}`}
                title={post.title}
              />
            </div>
          </div>
        </div>

        {/* ── Cover image ── */}
        {post.cover_image && (
          <div className="max-w-4xl mx-auto px-6 mb-12">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
              <Image
                src={post.cover_image}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <div className="max-w-3xl mx-auto px-6">
          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed mb-10 font-editorial italic">
              {post.excerpt}
            </p>
          )}

          {/* Article body */}
          <EditorContent
            content={post.content ?? ''}
            className="prose-editorial"
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-14 pt-8 border-t border-border/60 flex flex-wrap gap-3">
              {post.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog/tag/${tag.slug}`}
                  className="border border-border rounded-full px-4 py-1.5 text-xs tracking-wide text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          <SubscribeForm />

          <CommentSection postId={post.id} postSlug={post.slug} />
        </div>
      </article>
      <BackToTopButton />
    </>
  )
}
