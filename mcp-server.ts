#!/usr/bin/env npx tsx
/**
 * MCP Server for I Am Unhooked Blog
 *
 * A standalone Model Context Protocol server that exposes blog management
 * tools (create, edit, publish, delete posts, list categories/tags) via
 * the existing REST API, authenticated with API keys.
 *
 * Usage:
 *   BLOG_API_KEY=fmblog_xxx npx tsx mcp-server.ts
 *
 * Environment variables:
 *   BLOG_API_KEY  — required, an API key generated from /dashboard/developer
 *   BLOG_API_URL  — optional, defaults to http://localhost:3000
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

// ── Configuration ────────────────────────────────────────────────────────────

const API_KEY = process.env.BLOG_API_KEY
const API_URL = (process.env.BLOG_API_URL || 'http://localhost:3000').replace(/\/$/, '')

if (!API_KEY) {
  console.error('Error: BLOG_API_KEY environment variable is required.')
  console.error('Generate one from your blog dashboard at /dashboard/developer')
  process.exit(1)
}

// ── HTTP helper ──────────────────────────────────────────────────────────────

async function apiRequest(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const url = `${API_URL}${path}`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = (await res.json()) as Record<string, unknown>
  return { ok: res.ok, status: res.status, data }
}

function formatError(result: { ok: boolean; status: number; data: Record<string, unknown> }): string {
  const error = result.data.error || result.data.message || 'Unknown error'
  return `API Error (${result.status}): ${error}`
}

// ── Server setup ─────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'iamunhooked-blog',
  version: '1.0.0',
})

// ── Tool: list_posts ─────────────────────────────────────────────────────────

server.tool(
  'list_posts',
  'List blog posts with optional filters. Returns paginated results with title, slug, status, category, tags, and dates.',
  {
    status: z.enum(['draft', 'published']).optional().describe('Filter by post status'),
    search: z.string().optional().describe('Search posts by title'),
    sort: z.enum(['created_at', 'updated_at', 'title']).optional().describe('Sort field (default: created_at)'),
    order: z.enum(['asc', 'desc']).optional().describe('Sort order (default: desc)'),
    page: z.number().int().min(1).optional().describe('Page number (default: 1)'),
    limit: z.number().int().min(1).max(100).optional().describe('Results per page (default: 20, max: 100)'),
  },
  async (params) => {
    const query = new URLSearchParams()
    if (params.status) query.set('status', params.status)
    if (params.search) query.set('search', params.search)
    if (params.sort) query.set('sort', params.sort)
    if (params.order) query.set('order', params.order)
    if (params.page) query.set('page', String(params.page))
    if (params.limit) query.set('limit', String(params.limit))

    const qs = query.toString()
    const result = await apiRequest('GET', `/api/posts${qs ? `?${qs}` : ''}`)

    if (!result.ok) {
      return { content: [{ type: 'text' as const, text: formatError(result) }] }
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] }
  }
)

// ── Tool: get_post ───────────────────────────────────────────────────────────

server.tool(
  'get_post',
  'Get the full details of a single blog post by its ID (UUID) or slug. Returns title, content (HTML), excerpt, SEO fields, status, category, tags, and dates.',
  {
    id: z.string().describe('Post ID (UUID) or slug'),
  },
  async (params) => {
    const result = await apiRequest('GET', `/api/posts/${encodeURIComponent(params.id)}`)

    if (!result.ok) {
      return { content: [{ type: 'text' as const, text: formatError(result) }] }
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] }
  }
)

// ── Tool: create_post ────────────────────────────────────────────────────────

server.tool(
  'create_post',
  'Create a new blog post. Content should be HTML (matching the TipTap editor format). Returns the created post. Tags and categories are resolved by name — new tags are auto-created, but categories must already exist.',
  {
    title: z.string().describe('Post title'),
    content: z.string().describe('Post content in HTML format'),
    status: z.enum(['draft', 'published']).optional().describe('Post status (default: draft)'),
    slug: z.string().optional().describe('URL slug (auto-generated from title if not provided)'),
    excerpt: z.string().optional().describe('Short excerpt/summary of the post'),
    meta_title: z.string().optional().describe('SEO meta title (defaults to post title)'),
    meta_description: z.string().optional().describe('SEO meta description (defaults to excerpt)'),
    category: z.string().optional().describe('Category name (must exist)'),
    tags: z.array(z.string()).optional().describe('Array of tag names (auto-created if new)'),
    image_url: z.string().optional().describe('Cover image URL'),
  },
  async (params) => {
    const body: Record<string, unknown> = {
      title: params.title,
      content: params.content,
    }
    if (params.status) body.status = params.status
    if (params.slug) body.slug = params.slug
    if (params.excerpt) body.excerpt = params.excerpt
    if (params.meta_title) body.meta_title = params.meta_title
    if (params.meta_description) body.meta_description = params.meta_description
    if (params.category) body.category = params.category
    if (params.tags) body.tags = params.tags
    if (params.image_url) body.image_url = params.image_url

    const result = await apiRequest('POST', '/api/posts/create', body)

    if (!result.ok) {
      return { content: [{ type: 'text' as const, text: formatError(result) }] }
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] }
  }
)

// ── Tool: update_post ────────────────────────────────────────────────────────

server.tool(
  'update_post',
  'Update an existing blog post. Only provided fields are changed — omitted fields are left unchanged. Use publish_post / unpublish_post for status changes.',
  {
    id: z.string().describe('Post ID (UUID)'),
    title: z.string().optional().describe('New title'),
    content: z.string().optional().describe('New content in HTML format'),
    slug: z.string().optional().describe('New URL slug'),
    excerpt: z.string().optional().describe('New excerpt/summary'),
    meta_title: z.string().optional().describe('New SEO meta title'),
    meta_description: z.string().optional().describe('New SEO meta description'),
    category: z.string().optional().describe('New category name'),
    tags: z.array(z.string()).optional().describe('Replace all tags with these tag names'),
    image_url: z.string().optional().describe('New cover image URL'),
  },
  async (params) => {
    const { id, ...fields } = params
    const body: Record<string, unknown> = {}
    if (fields.title !== undefined) body.title = fields.title
    if (fields.content !== undefined) body.content = fields.content
    if (fields.slug !== undefined) body.slug = fields.slug
    if (fields.excerpt !== undefined) body.excerpt = fields.excerpt
    if (fields.meta_title !== undefined) body.meta_title = fields.meta_title
    if (fields.meta_description !== undefined) body.meta_description = fields.meta_description
    if (fields.category !== undefined) body.category = fields.category
    if (fields.tags !== undefined) body.tags = fields.tags
    if (fields.image_url !== undefined) body.image_url = fields.image_url

    const result = await apiRequest('PATCH', `/api/posts/${encodeURIComponent(id)}`, body)

    if (!result.ok) {
      return { content: [{ type: 'text' as const, text: formatError(result) }] }
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] }
  }
)

// ── Tool: publish_post ───────────────────────────────────────────────────────

server.tool(
  'publish_post',
  'Publish a draft post, making it visible on the public blog. Sets published_at timestamp if not already set.',
  {
    id: z.string().describe('Post ID (UUID)'),
  },
  async (params) => {
    const result = await apiRequest('PATCH', `/api/posts/${encodeURIComponent(params.id)}`, {
      status: 'published',
    })

    if (!result.ok) {
      return { content: [{ type: 'text' as const, text: formatError(result) }] }
    }

    return { content: [{ type: 'text' as const, text: `Post published successfully.\n\n${JSON.stringify(result.data, null, 2)}` }] }
  }
)

// ── Tool: unpublish_post ─────────────────────────────────────────────────────

server.tool(
  'unpublish_post',
  'Unpublish a post, reverting it to draft status. The post will no longer be visible on the public blog.',
  {
    id: z.string().describe('Post ID (UUID)'),
  },
  async (params) => {
    const result = await apiRequest('PATCH', `/api/posts/${encodeURIComponent(params.id)}`, {
      status: 'draft',
    })

    if (!result.ok) {
      return { content: [{ type: 'text' as const, text: formatError(result) }] }
    }

    return { content: [{ type: 'text' as const, text: `Post reverted to draft.\n\n${JSON.stringify(result.data, null, 2)}` }] }
  }
)

// ── Tool: delete_post ────────────────────────────────────────────────────────

server.tool(
  'delete_post',
  'Permanently delete a blog post. This action cannot be undone.',
  {
    id: z.string().describe('Post ID (UUID)'),
  },
  async (params) => {
    const result = await apiRequest('DELETE', `/api/posts/${encodeURIComponent(params.id)}`)

    if (!result.ok) {
      return { content: [{ type: 'text' as const, text: formatError(result) }] }
    }

    return { content: [{ type: 'text' as const, text: 'Post deleted successfully.' }] }
  }
)

// ── Tool: list_categories ────────────────────────────────────────────────────

server.tool(
  'list_categories',
  'List all available blog categories. Use category names when creating or updating posts.',
  {},
  async () => {
    const result = await apiRequest('GET', '/api/categories')

    if (!result.ok) {
      return { content: [{ type: 'text' as const, text: formatError(result) }] }
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] }
  }
)

// ── Tool: list_tags ──────────────────────────────────────────────────────────

server.tool(
  'list_tags',
  'List all existing blog tags. Tags are auto-created when used in create_post or update_post, but this tool helps you discover existing ones.',
  {},
  async () => {
    const result = await apiRequest('GET', '/api/tags')

    if (!result.ok) {
      return { content: [{ type: 'text' as const, text: formatError(result) }] }
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] }
  }
)

// ── Start server ─────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('I Am Unhooked Blog MCP server running on stdio')
  console.error(`API URL: ${API_URL}`)
}

main().catch((err) => {
  console.error('Failed to start MCP server:', err)
  process.exit(1)
})
