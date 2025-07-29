'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  unlockSection: number
}

export default function ReadingPage({ 
  params 
}: { 
  params: { bookId: string; chapterId: string } 
}) {
  // Mock story data - replace with actual data fetching
  const storyTitle = "Pikachu's Thunder Stone Adventure"
  const sections = [
    {
      id: 1,
      text: "One sunny morning, <span class='text-blue-400'>Pikachu</span> was exploring the <span class='text-orange-400'>forest</span> near Pallet Town. The <span class='text-orange-400'>trees</span> were tall and green, and the <span class='text-blue-400'>sky</span> was bright blue. As Pikachu hopped from rock to rock, something <span class='text-orange-400'>shiny</span> caught his eye.",
      unlocked: true
    },
    {
      id: 2,
      text: "Hidden beneath some <span class='text-orange-400'>leaves</span> was a <span class='text-blue-400'>mysterious stone</span> that sparkled with <span class='text-orange-400'>electric energy</span>. Pikachu had never seen anything like it before. The stone seemed to hum with <span class='text-blue-400'>power</span>, making Pikachu's cheeks spark with excitement.",
      unlocked: false
    },
    {
      id: 3,
      text: "Carefully, Pikachu picked up the <span class='text-blue-400'>thunder stone</span> with his tiny paws. Suddenly, he felt a surge of <span class='text-orange-400'>energy</span> flow through his body. His <span class='text-orange-400'>yellow fur</span> began to glow, and sparks of <span class='text-blue-400'>electricity</span> danced around him. What amazing power!",
      unlocked: false
    },
    {
      id: 4,
      text: "With this new <span class='text-blue-400'>power</span>, Pikachu realized he could help other Pokemon in need. He decided to use the thunder stone's <span class='text-orange-400'>energy</span> wisely and become a <span class='text-blue-400'>hero</span> in the forest. This was the beginning of Pikachu's greatest <span class='text-orange-400'>adventure</span>.",
      unlocked: false
    }
  ]

  const questions: Question[] = [
    {
      id: "1",
      question: "Where was Pikachu exploring?",
      options: ["The ocean", "The forest near Pallet Town", "A dark cave", "The city"],
      correctAnswer: 1,
      unlockSection: 2
    },
    {
      id: "2",
      question: "What did Pikachu find hidden beneath the leaves?",
      options: ["A Pokeball", "Some berries", "A mysterious stone", "Another Pokemon"],
      correctAnswer: 2,
      unlockSection: 3
    },
    {
      id: "3",
      question: "What happened when Pikachu picked up the stone?",
      options: ["He fell asleep", "He felt energy and began to glow", "Nothing happened", "He got scared"],
      correctAnswer: 1,
      unlockSection: 4
    }
  ]

  const [unlockedSections, setUnlockedSections] = useState<number[]>([1])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showNextPath, setShowNextPath] = useState(false)

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
    setShowFeedback(true)
    
    const correct = answerIndex === questions[currentQuestion].correctAnswer
    setIsCorrect(correct)
    
    if (correct) {
      // Unlock next section
      setTimeout(() => {
        setUnlockedSections([...unlockedSections, questions[currentQuestion].unlockSection])
        setShowFeedback(false)
        setSelectedAnswer(null)
        
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1)
        } else {
          // All questions answered, show path selection
          setShowNextPath(true)
        }
      }, 1500)
    } else {
      // Allow retry after showing feedback
      setTimeout(() => {
        setShowFeedback(false)
        setSelectedAnswer(null)
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Exit
            </Button>
          </Link>
          <h1 className="text-lg font-raleway font-bold text-secondary">{storyTitle}</h1>
          <div className="text-sm text-muted-foreground">
            Chapter {params.chapterId}
          </div>
        </div>
      </nav>

      {/* Reading Interface */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Story Content - Left Side */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-8">
                <div className="prose prose-lg max-w-none">
                  {sections.map((section, index) => (
                    <p 
                      key={section.id}
                      className={`mb-6 text-lg leading-relaxed transition-all duration-500 ${
                        unlockedSections.includes(section.id) 
                          ? 'opacity-100' 
                          : 'opacity-20 blur-sm select-none'
                      }`}
                      dangerouslySetInnerHTML={{ __html: section.text }}
                    />
                  ))}
                </div>

                {/* Next Path Selection */}
                {showNextPath && (
                  <div className="mt-8 pt-8 border-t">
                    <h3 className="text-xl font-raleway font-bold mb-4 text-secondary">
                      What happens next?
                    </h3>
                    <div className="grid gap-4">
                      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <p className="font-medium">Pikachu shares the stone's power with friends</p>
                        </CardContent>
                      </Card>
                      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <p className="font-medium">Pikachu keeps the stone secret and trains alone</p>
                        </CardContent>
                      </Card>
                      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <p className="font-medium">Pikachu seeks advice from Professor Oak</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Questions - Right Side */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Reading Questions</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Answer correctly to continue reading
                </p>
              </CardHeader>
              <CardContent>
                {!showNextPath && currentQuestion < questions.length && (
                  <div className="space-y-4">
                    <p className="font-medium">{questions[currentQuestion].question}</p>
                    <div className="space-y-2">
                      {questions[currentQuestion].options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          disabled={showFeedback}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedAnswer === index
                              ? showFeedback
                                ? isCorrect
                                  ? 'border-green-500 bg-green-50 text-green-900'
                                  : 'border-red-500 bg-red-50 text-red-900'
                                : 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {showFeedback && (
                      <p className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? '✓ Correct! Great job!' : '✗ Not quite. Try again!'}
                      </p>
                    )}
                  </div>
                )}

                {showNextPath && (
                  <div className="text-center">
                    <p className="text-lg font-medium text-green-600 mb-4">
                      🎉 Chapter Complete!
                    </p>
                    <Button onClick={() => console.log('Take quiz')}>
                      Take Chapter Quiz
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}