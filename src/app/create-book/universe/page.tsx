'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SelectableCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Universe {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

const universes: Universe[] = [
  {
    id: "pokemon",
    name: "Pokemon",
    description: "Journey through the world of Pokemon",
    icon: "⚡",
    color: "bg-yellow-500"
  },
  {
    id: "mario",
    name: "Super Mario",
    description: "Adventure in the Mushroom Kingdom",
    icon: "🍄",
    color: "bg-red-500"
  },
  {
    id: "harry-potter",
    name: "Harry Potter",
    description: "Magical adventures at Hogwarts",
    icon: "🪄",
    color: "bg-purple-600"
  },
  {
    id: "star-wars",
    name: "Star Wars",
    description: "Epic battles in a galaxy far, far away",
    icon: "⚔️",
    color: "bg-blue-600"
  },
  {
    id: "marvel",
    name: "Marvel",
    description: "Superhero adventures",
    icon: "🦸",
    color: "bg-red-600"
  },
  {
    id: "frozen",
    name: "Frozen",
    description: "Magical ice kingdom adventures",
    icon: "❄️",
    color: "bg-cyan-500"
  }
]

export default function UniverseSelectionPage() {
  const [selectedUniverse, setSelectedUniverse] = useState<string>("")
  const router = useRouter()

  const handleNext = () => {
    if (selectedUniverse) {
      // TODO: Store selection in state management
      sessionStorage.setItem('selectedUniverse', selectedUniverse)
      router.push('/create-book/character')
    }
  }

  return (
    <div className="min-h-screen cosmic-bg">
      {/* Navigation */}
      <nav className="relative z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-raleway font-bold text-secondary">Create a Book</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="w-16 h-1 bg-muted" />
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm">
                2
              </div>
              <div className="w-16 h-1 bg-muted" />
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm">
                3
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-raleway font-bold mb-2 text-secondary">
              Choose a Universe
            </h2>
            <p className="text-muted-foreground">
              Select the world where your story will take place
            </p>
          </div>

          {/* Universe Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            {universes.map((universe) => (
              <SelectableCard
                key={universe.id}
                selected={selectedUniverse === universe.id}
                onClick={() => setSelectedUniverse(universe.id)}
                className="cursor-pointer"
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${universe.color} rounded-full flex items-center justify-center text-3xl mx-auto mb-3`}>
                    {universe.icon}
                  </div>
                  <CardTitle className="text-lg">{universe.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-center text-muted-foreground">
                    {universe.description}
                  </p>
                </CardContent>
              </SelectableCard>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Link href="/dashboard">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button
              onClick={handleNext}
              disabled={!selectedUniverse}
            >
              Next
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}