'use client'

import { useState } from 'react'

interface CoinCounterProps {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

export function CoinCounter({ value, min, max, step, onChange }: CoinCounterProps) {
  const handleDecrease = () => {
    const newValue = Math.max(min, value - step)
    onChange(newValue)
  }

  const handleIncrease = () => {
    const newValue = Math.min(max, value + step)
    onChange(newValue)
  }

  return (
    <div className="flex justify-between items-center mt-3 w-full font-black text-neutral-800 text-opacity-50 max-md:flex-wrap max-md:max-w-full">
      {/* Coins Input */}
      <div className="flex gap-3 self-stretch p-3 text-sm bg-white rounded-lg border border-gray-300 border-solid">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={value <= min}
          className={`justify-center items-center w-6 h-6 whitespace-nowrap bg-neutral-800 bg-opacity-10 rounded-[100px] ${
            value <= min ? 'cursor-not-allowed' : 'cursor-pointer font-bold hover:bg-opacity-20'
          }`}
          aria-label="Decrease coins"
        >
          -
        </button>
        
        <div className="text-2xl font-bold leading-6 text-center text-neutral-800 sm:px-8">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="hidden"
          />
          {value} <span className="text-base">Coins</span>
        </div>
        
        <button
          type="button"
          onClick={handleIncrease}
          disabled={value >= max}
          className={`justify-center items-center w-6 h-6 whitespace-nowrap bg-neutral-800 bg-opacity-10 rounded-[100px] ${
            value >= max ? 'cursor-not-allowed' : 'cursor-pointer font-bold hover:bg-opacity-20'
          }`}
          aria-label="Increase coins"
        >
          +
        </button>
      </div>

      {/* Transfer Icon */}
      <div className="self-stretch my-auto text-xl">
        <svg className="shrink-0 w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,12L10,8V11H2V13H10V16M20,18V16H12V14H20V12L24,15L20,18Z" />
        </svg>
      </div>

      {/* Robux Display */}
      <div className="flex gap-1.5 self-stretch items-center my-auto font-bold tracking-tight text-center text-black">
        {/* Robux Logo */}
        <div className="shrink-0 w-12 h-7 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center">
          <svg className="w-8 h-4" viewBox="0 0 32 16" fill="white">
            <path d="M2 2h8v2H6v2h3v2H6v2h4v2H2V2zm10 0h3c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2h-3V2zm2 2v6h1V4h-1zm4-2h2l2 3-2 3h-2l2-3-2-3zm6 0h8v2h-4v2h3v2h-3v2h4v2h-8V2z"/>
          </svg>
        </div>
        <div>
          <span className="text-2xl">{value}</span>
          <span className="text-base"> Robux</span>
        </div>
      </div>
    </div>
  )
}