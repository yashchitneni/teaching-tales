'use client'

import { useState } from 'react'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { 
  getMockUserXP, 
  getMockUserStats, 
  getMockUserBadges, 
  formatReadingTime, 
  formatTrend,
  type TimePeriod 
} from '@/lib/xpData'

export default function MyStatsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('This Week')
  
  const userXP = getMockUserXP()
  const userStats = getMockUserStats(selectedPeriod)
  const userBadges = getMockUserBadges()

  // Calculate XP progress percentage
  const xpProgress = (userXP.currentXP / userXP.maxXP) * 100

  return (
    <div className="min-h-screen bg-gray-100">
      <TopNavWithTabs />
      
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Top Row: XP Level (Left) and Stats (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* XP Level Section */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">XP Level</h2>
            
            <div className="flex flex-col items-center space-y-6">
              {/* Level Badge */}
              <div className="text-center">
                <div className="text-blue-500 font-medium mb-2">Level {userXP.level}</div>
                {/* House Image Placeholder */}
                <div className="w-32 h-32 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                  <div className="text-6xl">🏠</div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{userXP.title}</h3>
              </div>

              {/* Progress Bar */}
              <div className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 text-sm">Read for {userXP.hoursToNext} more hours to reach Level {userXP.level + 1}</span>
                  <span className="text-gray-500 font-medium text-sm">{userXP.currentXP}/{userXP.maxXP} XP</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Stats</h2>
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
                className="px-4 py-2 border border-blue-500 rounded-full text-blue-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="All Time">All Time</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Accuracy */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className="text-blue-500 text-2xl mb-2">🎯</div>
                <div className="text-gray-600 font-medium mb-2">Accuracy</div>
                <div className="text-4xl font-bold text-gray-800 mb-2">{userStats.accuracy}</div>
                <div className="text-red-500 text-sm font-medium">
                  {formatTrend(userStats.accuracyTrend).text}
                </div>
              </div>

              {/* Reading Time */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className="text-blue-500 text-2xl mb-2">⏰</div>
                <div className="text-gray-600 font-medium mb-2">Reading Time</div>
                <div className="text-4xl font-bold text-gray-800 mb-2">
                  {formatReadingTime(userStats.readingTimeMinutes)}
                </div>
                <div className="text-red-500 text-sm font-medium">
                  {formatTrend(userStats.readingTimeTrend).text}
                </div>
              </div>

              {/* Words/Min */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className="text-blue-500 text-2xl mb-2">📚</div>
                <div className="text-gray-600 font-medium mb-2">Words/Min</div>
                <div className="text-4xl font-bold text-gray-800 mb-2">{userStats.wordsPerMinute}</div>
                <div className="text-red-500 text-sm font-medium">
                  {formatTrend(userStats.wordsPerMinuteTrend).text}
                </div>
              </div>

              {/* Challenging Words */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className="text-blue-500 text-2xl mb-2">📝</div>
                <div className="text-gray-600 font-medium mb-2">Challenging Words</div>
                <div className="text-4xl font-bold text-gray-800 mb-2">{userStats.challengingWords}</div>
                <div className="text-red-500 text-sm font-medium">
                  {formatTrend(userStats.challengingWordsTrend).text}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Badges</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userBadges.map((badge) => (
              <div key={badge.id} className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <h3 className="font-bold text-gray-800 mb-2">{badge.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{badge.description}</p>
                
                {/* Badge Icon */}
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-2xl opacity-50">{badge.icon}</div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-orange-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    {badge.progress}/{badge.maxProgress} for {badge.tier}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}