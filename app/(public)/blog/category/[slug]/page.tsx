import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PostList } from '@/features/posts/components/PostList'
import type { PostWithRelations } from '@/features/posts/types'

export const revalidate = 60

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const { createStaticClient } = await import('@/lib/supabase/static')
  const supabase = createStaticClient()
  if (!supabase) return []
  const { data } = await supabase.from('categories').select('slug')
  return ((data ?? []) as { slug: string }[]).map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!category) return {}
  return {
    title: `${category.name} - Blog`,
    description: category.description ?? `Posts in ${category.name}`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!category) notFound()

  const { data: postsData } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(id, full_name, email, avatar_url),
      category:categories(id, name, slug),
      tags:post_tags(tag:tags(id, name, slug))
    `)
    .eq('status', 'published')
    .eq('category_id', category.id)
    .order('published_at', { ascending: false })

  const posts = (postsData ?? []).map((p) => ({
    ...p,
    // @ts-expect-error nested join shape
    tags: (p.tags ?? []).map((pt) => pt.tag).filter(Boolean),
  })) as PostWithRelations[]

  return (
    <div className="max-w-5xl mx-auto py-16 px-6 animate-page">
      <div className="border-b border-border/60 pb-10 mb-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
          Back to Articles
        </Link>
        <p className="editorial-label mb-2">Category</p>
        <h1 className="editorial-heading text-4xl md:text-5xl">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground text-base max-w-xl mt-3 leading-relaxed">{category.description}</p>
        )}
      </div>
      <PostList posts={posts} />
    </div>
  )
}
