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
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 lg:w-2/3 h-full">
            <div className="h-full">
              <div className="flex flex-col gap-4 h-full">
                <h2 className="text-2xl text-left font-semibold text-neutral-800">XP Level</h2>
                <div className="flex flex-col justify-center bg-white rounded-lg p-4 gap-4 flex-1 relative">
                  <div className="text-black text-base font-bold absolute top-4 left-4">Level {userXP.level}</div>
                  <div className="flex flex-col items-center">
                    <img src="https://app.teachtales.com/static/media/lvl-group-1.60be3ac8.png" alt="Level Icon" className="w-32 h-32 mb-4" />
                    <div className="text-2xl font-bold text-black">{userXP.title}</div>
                  </div>
                  <div className="flex flex-col w-full">
                    <div className="w-full bg-blue-100 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${xpProgress}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                      <div className="text-gray-600">Read for {userXP.hoursToNext} more hours to reach Level {userXP.level + 1}</div>
                      <div className="text-gray-400 whitespace-nowrap">{userXP.currentXP}/{userXP.maxXP} XP</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-full">
            <div className="h-full">
              <div className="flex flex-col gap-4 h-full">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold text-neutral-800">Stats</h2>
                  <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
                    className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm text-black"
                  >
                    <option value="This Week" className="text-black">This Week</option>
                    <option value="This Month" className="text-black">This Month</option>
                    <option value="All Time" className="text-black">All Time</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  {/* Accuracy */}
                  <div className="flex flex-col justify-center md:min-w-[250px] min-h-[120px] bg-white rounded-lg p-4">
                    <div className="flex flex-col items-center mb-2">
                      <div className="w-5 h-5 text-gray-600 mb-1">
                        <img src="https://app.teachtales.com/static/media/target.375fe4e2.svg" alt="Accuracy" />
                      </div>
                      <div className="text-sm text-gray-500">Accuracy</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2">
                        <div className="text-4xl font-bold text-black">{userStats.accuracy}</div>
                        <div className="text-sm px-2 py-0.5 rounded-full flex items-center gap-1 text-red-700 bg-red-100">
                          <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrow-trend-down" className="svg-inline--fa fa-arrow-trend-down w-3 h-3" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                            <path fill="currentColor" d="M384 352c-17.7 0-32 14.3-32 32s14.3 32 32 32H544c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32s-32 14.3-32 32v82.7L342.6 137.4c-12.5-12.5-32.8-12.5-45.3 0L192 242.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0L320 205.3 466.7 352H384z"></path>
                          </svg>
                          <span>100.0%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reading Time */}
                  <div className="flex flex-col justify-center md:min-w-[250px] min-h-[120px] bg-white rounded-lg p-4">
                    <div className="flex flex-col items-center mb-2">
                      <div className="w-5 h-5 text-gray-600 mb-1">
                        <img src="https://app.teachtales.com/static/media/clock.fd9eb879.svg" alt="Reading Time" />
                      </div>
                      <div className="text-sm text-gray-500">Reading Time</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2">
                        <div className="text-4xl font-bold text-black">{formatReadingTime(userStats.readingTimeMinutes)}</div>
                        <div className="text-sm px-2 py-0.5 rounded-full flex items-center gap-1 text-red-700 bg-red-100">
                          <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrow-trend-down" className="svg-inline--fa fa-arrow-trend-down w-3 h-3" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                            <path fill="currentColor" d="M384 352c-17.7 0-32 14.3-32 32s14.3 32 32 32H544c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32s-32 14.3-32 32v82.7L342.6 137.4c-12.5-12.5-32.8-12.5-45.3 0L192 242.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0L320 205.3 466.7 352H384z"></path>
                          </svg>
                          <span>98.6%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Words/Min */}
                  <div className="flex flex-col justify-center md:min-w-[250px] min-h-[120px] bg-white rounded-lg p-4">
                    <div className="flex flex-col items-center mb-2">
                      <div className="w-5 h-5 text-gray-600 mb-1">
                        <img src="https://app.teachtales.com/static/media/eyes.20fd8ea5.svg" alt="Words per Minute" />
                      </div>
                      <div className="text-sm text-gray-500">Words/Min</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2">
                        <div className="text-4xl font-bold text-black">{userStats.wordsPerMinute}</div>
                        <div className="text-sm px-2 py-0.5 rounded-full flex items-center gap-1 text-red-700 bg-red-100">
                          <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrow-trend-down" className="svg-inline--fa fa-arrow-trend-down w-3 h-3" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                            <path fill="currentColor" d="M384 352c-17.7 0-32 14.3-32 32s14.3 32 32 32H544c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32s-32 14.3-32 32v82.7L342.6 137.4c-12.5-12.5-32.8-12.5-45.3 0L192 242.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0L320 205.3 466.7 352H384z"></path>
                          </svg>
                          <span>100.0%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Challenging Words */}
                  <div className="flex flex-col justify-center md:min-w-[250px] min-h-[120px] bg-white rounded-lg p-4">
                    <div className="flex flex-col items-center mb-2">
                      <div className="w-5 h-5 text-gray-600 mb-1">
                        <img src="https://app.teachtales.com/static/media/sheet.3324f8be.svg" alt="Challenging Words" />
                      </div>
                      <div className="text-sm text-gray-500">Challenging Words</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2">
                        <div className="text-4xl font-bold text-black">{userStats.challengingWords}</div>
                        <div className="text-sm px-2 py-0.5 rounded-full flex items-center gap-1 text-red-700 bg-red-100">
                          <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrow-trend-down" className="svg-inline--fa fa-arrow-trend-down w-3 h-3" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                            <path fill="currentColor" d="M384 352c-17.7 0-32 14.3-32 32s14.3 32 32 32H544c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32s-32 14.3-32 32v82.7L342.6 137.4c-12.5-12.5-32.8-12.5-45.3 0L192 242.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0L320 205.3 466.7 352H384z"></path>
                          </svg>
                          <span>100.0%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl text-left font-semibold text-neutral-800">Badges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {userBadges.map((badge) => (
              <div key={badge.id} className="flex flex-col p-6 bg-white rounded-xl border border-gray-200">
                <div className="flex flex-col items-center gap-4">
                  <div className="text-center">
                    <div className="text-base font-bold text-black">{badge.name}</div>
                    <div className="text-sm text-gray-600 h-10 line-clamp-2">{badge.description}</div>
                  </div>
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <img src="https://app.teachtales.com/static/media/achievement-tier-0.0a63c8b1.svg" alt={badge.name} className="w-16 h-16" />
                  </div>
                  {badge.id === 'rising-reader' ? (
                    <div className="w-full h-8">
                      <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(201, 108, 41, 0.376)' }}>
                        <div 
                          className="h-full rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${(badge.progress / badge.maxProgress) * 100}%`, 
                            backgroundColor: 'rgb(201, 108, 41)' 
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 text-center mt-2">
                        {badge.progress}/{badge.maxProgress} for {badge.tier}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-8"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}