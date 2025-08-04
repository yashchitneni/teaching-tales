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
                    className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  >
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                    <option value="All Time">All Time</option>
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
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Badges</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userBadges.map((badge) => (
              <div key={badge.id} className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <h3 className="font-bold text-gray-800 mb-2">{badge.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{badge.description}</p>
                
                {/* Badge Icon */}
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <img src="https://app.teachtales.com/static/media/achievement-tier-0.0a63c8b1.svg" alt="Badge Icon" className="w-8 h-8 opacity-50" />
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