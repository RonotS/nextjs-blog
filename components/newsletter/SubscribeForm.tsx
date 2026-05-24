'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

const schema = z.object({ email: z.string().email('Enter a valid email address') })
type FormValues = z.infer<typeof schema>

export function SubscribeForm() {
  const [subscribed, setSubscribed] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json().catch(() => null)
      if (json?.success) {
        setSubscribed(true)
        toast.success(json.message)
      } else {
        toast.error(json?.message ?? 'Something went wrong')
      }
    } catch {
      toast.error('Network error. Please try again.')
    }
  }

  if (subscribed) {
    return (
      <div className="border-t border-border/60 mt-14 pt-10 pb-4 text-center max-w-lg mx-auto">
        <p className="editorial-heading text-xl">You&apos;re subscribed</p>
        <p className="text-muted-foreground text-sm mt-2">
          You&apos;ll get an email when the next post is published.
        </p>
      </div>
    )
  }

  return (
    <div className="border-t border-border/60 mt-14 pt-10 pb-4 text-center max-w-lg mx-auto">
      <h2 className="editorial-heading text-2xl mb-2">Stay updated</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Get notified when new posts are published. No spam, unsubscribe anytime.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3 max-w-sm mx-auto">
        <label htmlFor="subscribe-email" className="sr-only">Email address</label>
        <input
          {...register('email')}
          id="subscribe-email"
          type="email"
          placeholder="your@email.com"
          className="flex-1 h-10 border-b border-border bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-foreground transition-colors"
          disabled={isSubmitting}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 px-6 bg-foreground text-background text-sm font-medium rounded-full hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {isSubmitting ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
      {errors.email && (
        <p className="text-destructive text-xs mt-2">{errors.email.message}</p>
      )}
      <p className="text-muted-foreground/50 text-xs mt-4 tracking-wide">No spam · Unsubscribe anytime</p>
    </div>
  )
}
