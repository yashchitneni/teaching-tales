'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SelectableCard, CardContent, CardHeader } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface Spark {
  id: string
  text: string
  theme: string
}

const sparksByCharacter: Record<string, Spark[]> = {
  pikachu: [
    { id: "1", text: "discovers a mysterious thunder stone that gives special powers", theme: "Power & Responsibility" },
    { id: "2", text: "must help a lost baby Pokemon find its way home", theme: "Friendship & Helping" },
    { id: "3", text: "enters a special tournament to become the strongest", theme: "Competition & Growth" },
    { id: "4", text: "finds a secret garden where electric flowers grow", theme: "Nature & Discovery" },
    { id: "5", text: "learns about teamwork when facing a big challenge", theme: "Teamwork & Cooperation" },
    { id: "6", text: "goes on an adventure to save the Pokemon Center", theme: "Courage & Heroes" }
  ],
  luigi: [
    { id: "1", text: "discovers a hidden mansion with friendly ghosts", theme: "Overcoming Fear" },
    { id: "2", text: "must rescue Mario from Bowser's castle", theme: "Bravery & Family" },
    { id: "3", text: "finds a magic vacuum that cleans up problems", theme: "Problem Solving" },
    { id: "4", text: "enters a kart race to win a special prize", theme: "Competition & Fun" },
    { id: "5", text: "helps Toads rebuild their village", theme: "Community & Helping" },
    { id: "6", text: "discovers he has a special jumping ability", theme: "Self-Discovery" }
  ],
  harry: [
    { id: "1", text: "finds a spell book with never-before-seen magic", theme: "Knowledge & Discovery" },
    { id: "2", text: "must help a new student feel welcome at Hogwarts", theme: "Kindness & Inclusion" },
    { id: "3", text: "discovers a secret room in the castle", theme: "Mystery & Adventure" },
    { id: "4", text: "learns about magical creatures in the Forbidden Forest", theme: "Nature & Understanding" },
    { id: "5", text: "organizes a Quidditch match for charity", theme: "Leadership & Giving" },
    { id: "6", text: "helps solve a mystery with Hermione and Ron", theme: "Friendship & Teamwork" }
  ],
  // Default sparks for any character
  default: [
    { id: "1", text: "goes on an unexpected adventure", theme: "Adventure & Courage" },
    { id: "2", text: "makes a new friend who needs help", theme: "Friendship & Kindness" },
    { id: "3", text: "discovers a hidden talent", theme: "Self-Discovery" },
    { id: "4", text: "must solve a tricky problem", theme: "Problem Solving" },
    { id: "5", text: "learns an important lesson about sharing", theme: "Values & Growth" },
    { id: "6", text: "finds a magical object with special powers", theme: "Magic & Responsibility" }
  ]
}

export default function SparkSelectionPage() {
  const [selectedSpark, setSelectedSpark] = useState<string>("")
  const [sparks, setSparks] = useState<Spark[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get selected character from session storage
    const character = sessionStorage.getItem('selectedCharacter') || ''
    const availableSparks = sparksByCharacter[character] || sparksByCharacter.default
    setSparks(availableSparks)
  }, [])

  const handleCreateBook = async () => {
    if (!selectedSpark) return

    setIsCreating(true)
    
    // Get all selections
    const universe = sessionStorage.getItem('selectedUniverse')
    const character = sessionStorage.getItem('selectedCharacter')
    const spark = sparks.find(s => s.id === selectedSpark)

    // TODO: Make API call to generate book
    console.log('Creating book with:', { universe, character, spark })

    // Simulate book creation
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Navigate to reading interface
    router.push('/book/1/chapter/1')
  }

  const handleBack = () => {
    router.push('/create-book/character')
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
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm">
                ✓
              </div>
              <div className="w-16 h-1 bg-primary" />
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                3
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-raleway font-bold mb-2 text-secondary">
              Choose Your Story Spark
            </h2>
            <p className="text-muted-foreground">
              What happens in your adventure?
            </p>
          </div>

          {/* Spark Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {sparks.map((spark) => (
              <SelectableCard
                key={spark.id}
                selected={selectedSpark === spark.id}
                onClick={() => setSelectedSpark(spark.id)}
                className="cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <p className="text-lg leading-relaxed">Your character {spark.text}</p>
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-primary font-medium">
                    Theme: {spark.theme}
                  </span>
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
              onClick={handleCreateBook}
              disabled={!selectedSpark || isCreating}
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Story...
                </>
              ) : (
                <>
                  Create Book
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}