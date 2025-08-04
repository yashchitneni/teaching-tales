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
        <img 
          src="/static/media/money-bill-transfer.ac98ce0e.png" 
          alt="Transfer" 
          className="shrink-0 w-6 h-6"
        />
      </div>

      {/* Robux Display */}
      <div className="flex gap-1.5 self-stretch items-center my-auto font-bold tracking-tight text-center text-black">
        {/* Robux Logo */}
        <img 
          src="/static/media/roblox.67b615af.png" 
          alt="Roblox" 
          className="shrink-0 w-12 h-7"
        />
        <div>
          <span className="text-2xl">{value}</span>
          <span className="text-base"> Robux</span>
        </div>
      </div>
    </div>
  )
}