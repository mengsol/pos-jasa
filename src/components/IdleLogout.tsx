'use client'
import { useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'

// Auto-logout for kasir after X minutes of inactivity.
// X is configured by admin via Setting key `kasir_timeout_minutes` (0/empty = disabled).
export default function IdleLogout() {
  const router = useRouter()
  const pathname = usePathname()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeoutMs = useRef(0)

  const logout = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    router.push('/login')
  }, [router])

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    if (timeoutMs.current > 0) {
      timer.current = setTimeout(logout, timeoutMs.current)
    }
  }, [logout])

  useEffect(() => {
    let active = true
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    const onActivity = () => reset()

    async function init() {
      // Skip on the login screen
      if (pathname === '/login') return
      try {
        const meRes = await fetch('/api/auth/me')
        if (!meRes.ok || !active) return
        const me = await meRes.json()
        // Only kasir is auto-logged out
        if (me.role !== 'kasir') return

        const sRes = await fetch('/api/settings')
        if (!active) return
        const s = await sRes.json()
        const mins = parseInt(s.kasir_timeout_minutes ?? '0', 10)
        if (!mins || mins <= 0) return

        timeoutMs.current = mins * 60 * 1000
        events.forEach(e => window.addEventListener(e, onActivity, { passive: true }))
        reset()
      } catch {
        // ignore — fail open (no auto-logout if config can't be read)
      }
    }
    init()

    return () => {
      active = false
      events.forEach(e => window.removeEventListener(e, onActivity))
      if (timer.current) clearTimeout(timer.current)
      timeoutMs.current = 0
    }
  }, [pathname, reset])

  return null
}
