'use client'
import { useEffect, useState } from 'react'

export default function HeroBackground() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-50 via-white to-indigo-50" />

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Soft gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-indigo-50" />
      
      {/* Floating gradient orbs */}
      <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-violet-200/30 blur-[100px] animate-float" />
      <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-indigo-200/25 blur-[90px] animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-purple-200/20 blur-[80px] animate-float" style={{ animationDelay: '4s' }} />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 light-grid opacity-50 pointer-events-none" />
    </div>
  )
}
