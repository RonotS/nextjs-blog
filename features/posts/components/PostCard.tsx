import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { readTime } from '@/lib/utils'
import type { PostWithRelations } from '../types'

interface PostCardProps {
  post: PostWithRelations
}

export function PostCard({ post }: PostCardProps) {
  const authorName = post.author?.full_name ?? post.author?.email ?? 'Unknown'
  const mins = readTime(post.content ?? '')

  return (
    <article className="group">
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

      {post.category && (
        <Link
          href={`/blog/category/${post.category.slug}`}
          className="editorial-label hover:text-foreground transition-colors"
        >
          {post.category.name}
        </Link>
      )}

      <Link href={`/blog/${post.slug}`}>
        <h2 className="editorial-heading text-xl md:text-2xl mt-2 mb-2 group-hover:opacity-70 transition-opacity leading-snug">
          {post.title}
        </h2>
      </Link>

      {post.excerpt && (
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-3">
          {post.excerpt}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{authorName}</span>
        {post.published_at && (
          <>
            <span className="text-border">·</span>
            <time dateTime={post.published_at}>
              {format(new Date(post.published_at), 'MMM d, yyyy')}
            </time>
          </>
        )}
        <span className="text-border">·</span>
        <span>{mins} min read</span>
      </div>

      {post.tags && post.tags.length > 0 && (
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
