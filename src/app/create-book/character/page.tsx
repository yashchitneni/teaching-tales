'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SelectableCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Character {
  id: string
  name: string
  description: string
  image: string
}

const charactersByUniverse: Record<string, Character[]> = {
  pokemon: [
    { id: "pikachu", name: "Pikachu", description: "Electric mouse Pokemon", image: "⚡" },
    { id: "charizard", name: "Charizard", description: "Fire/Flying dragon Pokemon", image: "🔥" },
    { id: "bulbasaur", name: "Bulbasaur", description: "Grass/Poison Pokemon", image: "🌱" },
    { id: "squirtle", name: "Squirtle", description: "Water turtle Pokemon", image: "💧" },
    { id: "eevee", name: "Eevee", description: "Evolution Pokemon", image: "🦊" },
    { id: "mewtwo", name: "Mewtwo", description: "Psychic Pokemon", image: "🔮" }
  ],
  mario: [
    { id: "mario", name: "Mario", description: "The famous plumber", image: "👨" },
    { id: "luigi", name: "Luigi", description: "Mario's brother", image: "👨" },
    { id: "peach", name: "Princess Peach", description: "Princess of Mushroom Kingdom", image: "👸" },
    { id: "yoshi", name: "Yoshi", description: "Mario's dinosaur friend", image: "🦕" },
    { id: "bowser", name: "Bowser", description: "King of the Koopas", image: "🐢" },
    { id: "toad", name: "Toad", description: "Mushroom Kingdom resident", image: "🍄" }
  ],
  "harry-potter": [
    { id: "harry", name: "Harry Potter", description: "The Boy Who Lived", image: "⚡" },
    { id: "hermione", name: "Hermione Granger", description: "The brightest witch", image: "📚" },
    { id: "ron", name: "Ron Weasley", description: "Harry's best friend", image: "♟️" },
    { id: "dumbledore", name: "Albus Dumbledore", description: "Hogwarts Headmaster", image: "🧙" },
    { id: "hagrid", name: "Rubeus Hagrid", description: "Keeper of Keys", image: "🗝️" },
    { id: "snape", name: "Severus Snape", description: "Potions Master", image: "🧪" }
  ],
  // Add more characters for other universes...
}

export default function CharacterSelectionPage() {
  const [selectedCharacter, setSelectedCharacter] = useState<string>("")
  const [selectedUniverse, setSelectedUniverse] = useState<string>("")
  const [characters, setCharacters] = useState<Character[]>([])
  const router = useRouter()

  useEffect(() => {
    // Get selected universe from session storage
    const universe = sessionStorage.getItem('selectedUniverse') || 'pokemon'
    setSelectedUniverse(universe)
    setCharacters(charactersByUniverse[universe] || charactersByUniverse.pokemon)
  }, [])

  const handleNext = () => {
    if (selectedCharacter) {
      sessionStorage.setItem('selectedCharacter', selectedCharacter)
      router.push('/create-book/spark')
    }
  }

  const handleBack = () => {
    router.push('/create-book/universe')
  }

  return (
    <div className="min-h-screen cosmic-bg">
      {/* Navigation */}
      <nav className="relative z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
          <h1 className="text-xl font-raleway font-bold text-secondary">Create a Book</h1>
          <div className="w-20" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm">
                ✓
              </div>
              <div className="w-16 h-1 bg-primary" />
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
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
              Choose Your Character
            </h2>
            <p className="text-muted-foreground">
              Select who will be the hero of your story
            </p>
          </div>

          {/* Character Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            {characters.map((character) => (
              <SelectableCard
                key={character.id}
                selected={selectedCharacter === character.id}
                onClick={() => setSelectedCharacter(character.id)}
                className="cursor-pointer"
              >
                <CardHeader className="text-center">
                  <div className="text-5xl mb-3">{character.image}</div>
                  <CardTitle className="text-lg">{character.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-center text-muted-foreground">
                    {character.description}
                  </p>
                </CardContent>
              </SelectableCard>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!selectedCharacter}
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