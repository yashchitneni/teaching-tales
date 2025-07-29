'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function TopNavWithTabs() {
  const pathname = usePathname()

  const tabs = [
    { name: 'Create My Own Story', href: '/create-book/universe' },
    { name: 'My Stories', href: '/my-stories' },
    { name: 'Library', href: '/library' },
    { name: 'My Reading Circles', href: '/reading-circles' },
  ]

  return (
    <nav className="bg-blue-600 text-white">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-full mr-2"></div>
            <span className="font-bold text-lg">TeachTales</span>
          </Link>
        </div>

        {/* Center Tabs */}
        <div className="hidden md:flex items-center space-x-4">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                pathname.startsWith(tab.href) || (tab.href === '/create-book/universe' && pathname.startsWith('/create-book'))
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <span>🔥</span>
            <span>0</span>
          </div>
          <div className="flex items-center space-x-2 bg-yellow-500 text-black px-3 py-1 rounded-full">
            <span>Lvl 0</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🪙</span>
            <span>803</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Yash</span>
            <div className="w-8 h-8 bg-white/20 rounded-full"></div>
          </div>
        </div>
      </div>
    </nav>
  )
} 