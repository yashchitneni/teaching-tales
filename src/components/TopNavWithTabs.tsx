'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useState } from 'react'
import { StreakModal } from './StreakModal'

export function TopNavWithTabs() {
  const pathname = usePathname()
  const [showStreakModal, setShowStreakModal] = useState(false)

  const tabs = [
    { name: 'Create My Own Story', href: '/create-book/universe' },
    { name: 'My Stories', href: '/my-stories' },
    { name: 'Library', href: '/library' },
    { name: 'My Reading Circles', href: '/reading-circles' },
  ]

  const isActiveTab = (href: string) => {
    return pathname.startsWith(href) || (href === '/create-book/universe' && pathname.startsWith('/create-book'))
  }

  return (
    <nav className="text-white" style={{ backgroundColor: '#0d6efd' }}>
      <div className="flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <div className="flex items-center flex-1">
          <Link href="/dashboard" className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-full mr-2"></div>
            <span className="font-bold text-lg">TeachTales</span>
          </Link>
        </div>

        {/* Center Tabs */}
        <div className="hidden md:flex justify-center flex-grow gap-1.5">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`px-4 py-2 rounded-[100px] justify-start items-center gap-1.5 flex ${
                isActiveTab(tab.href)
                  ? 'bg-white/20'
                  : 'bg-white/10'
              }`}
            >
              <span className={`text-base ${isActiveTab(tab.href) ? 'font-bold' : ''} text-gray-200`}>
                {tab.name}
              </span>
            </Link>
          ))}
        </div>

        {/* User Info */}
        <div className="flex flex-1 justify-end">
          <div className="flex flex-row items-center gap-2 text-white">
            {/* Streak */}
            <button 
              onClick={() => setShowStreakModal(true)}
              className="h-9 max-sm:h-7 p-2 cursor-pointer bg-[#FFE5B9] rounded-full border border-[#FF6723] border-opacity-20 justify-start items-center inline-flex hover:bg-[#FFD28C] transition-colors"
              title="View your reading streak"
            >
              <div className="relative w-4 h-4 mr-1">
                <svg className="w-full h-full" viewBox="0 0 16 16" fill="#FF6723">
                  <path d="M8 16c3.314 0 6-2 6-5.5 0-1.5-.5-4-2.5-6 .25 1.5-1.25 2-1.25 2C11 4 9 .5 6 0c.357 2 .5 4-2 6-1.25 1-2 2.729-2 4.5C2 14 4.686 16 8 16zm0-1c-1.657 0-3-1-3-2.75 0-.75.25-2 1.25-3C6.125 10 7 10.5 7 10.5c-.375-1.25.5-3.25 2-3.5-.179 1-.25 2 1 3 .625.5 1 1.364 1 2.25C11 14 9.657 15 8 15z"/>
                </svg>
              </div>
              <div className="text-center text-[#FF6723] text-base font-bold">0</div>
            </button>

            {/* Level */}
            <Link href="/my-stats" className="min-w-8 h-9 max-sm:h-7 p-2 cursor-pointer bg-blue-100 rounded-full border border-yellow-500/20 justify-start items-center gap-1.5 inline-flex" title="Level 0: 30/60 XP">
              <div className="w-6 h-6 relative">
                <div className="shrink-0 self-start w-4 aspect-square absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <svg className="w-full h-full" viewBox="0 0 16 16" fill="#FFC107">
                    <path d="M8 0l2.5 5.3 5.5.8-4 4.1.9 5.8L8 13.3 3.1 16l.9-5.8-4-4.1 5.5-.8z"/>
                  </svg>
                </div>
                <svg width="24" height="24">
                  <circle cx="12" cy="12" r="11" fill="none" stroke="#93C5FD" strokeWidth="2"></circle>
                  <circle cx="12" cy="12" r="11" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" transform="rotate(-90 12 12)" strokeDasharray="69.11503837897544" strokeDashoffset="34.55751918948772"></circle>
                </svg>
              </div>
              <div className="text-center text-blue-600 text-base font-bold whitespace-nowrap">Lvl 0</div>
            </Link>

            {/* Coins */}
            <Link href="/redeem-rewards" className="min-w-8 h-9 max-sm:h-7 p-2 cursor-pointer bg-yellow-100 hover:bg-yellow-200 rounded-full border border-yellow-500/20 justify-start items-center gap-1.5 inline-flex transition-colors" title="Redeem coins for Robux">
              <div className="w-4 h-4 relative">
                <svg className="w-full h-full" viewBox="0 0 16 16" fill="#FFC107">
                  <circle cx="8" cy="8" r="7" />
                  <text x="8" y="11" textAnchor="middle" fill="#FFF" fontSize="10" fontWeight="bold">$</text>
                </svg>
              </div>
              <div className="text-center text-yellow-600 text-base font-bold">867</div>
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <div className="cursor-pointer">
                <div className="w-8 h-8 max-sm:h-7 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center">
                  <svg className="text-blue-600 w-4 h-4" fill="currentColor" viewBox="0 0 448 512">
                    <path d="M224 0c-17.7 0-32 14.3-32 32V51.2C119 66 64 130.6 64 208v18.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S19.4 416 32 416H416c12.6 0 24-7.4 29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3C401.3 319.2 384 273.9 384 226.8V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32zm45.3 493.3c12-12 18.7-28.3 18.7-45.3H224 160c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Profile */}
            <div className="relative max-lg:hidden">
              <div className="flex flex-row items-center gap-2 cursor-pointer">
                <div className="underline">Yash</div>
                <div className="w-9 h-9">
                  <div className="w-full h-full rounded-full p-[1.8px] bg-transparent flex items-center justify-center">
                    <div className="w-full h-full bg-white/20 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <span className="hidden max-lg:inline ml-3">
              <button className="text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </span>
          </div>
        </div>
      </div>

      {/* Streak Modal */}
      {showStreakModal && (
        <StreakModal onClose={() => setShowStreakModal(false)} />
      )}
    </nav>
  )
}