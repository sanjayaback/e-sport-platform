'use client'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Bell, X } from 'lucide-react'
import { INotification } from '@/types'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<INotification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    try {
      const res = await axios.get('/api/notifications')
      setNotifications(res.data.data.notifications)
      setUnread(res.data.data.unreadCount)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markAllRead() {
    await axios.patch('/api/notifications', { markAll: true })
    setUnread(0)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const typeIcon: Record<string, string> = {
    tournament_created: '🏆',
    player_joined: '👤',
    winner_selected: '🥇',
    screenshot_submitted: '📸',
    payment_confirmed: '✅',
    general: '📢',
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
      >
        <Bell className="w-4 h-4 text-slate-500" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-lg overflow-hidden z-50 animate-in">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-display font-semibold text-sm text-slate-700">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-violet-600 hover:underline font-medium">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">No notifications yet</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                    !n.read ? 'bg-violet-50/50 border-l-2 border-l-violet-400' : ''
                  }`}
                >
                  <div className="flex gap-2">
                    <span className="text-base mt-0.5 shrink-0">{typeIcon[n.type] || '📢'}</span>
                    <div>
                      <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
