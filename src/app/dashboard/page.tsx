'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface Child {
  id: string
  firstName: string
  lastName: string
  grade: string
  streak: number
  booksRead: number
}

interface Book {
  id: string
  title: string
  universe: string
  character: string
  progress: number
  lastRead: string
}

export default function DashboardPage() {
  // Mock data - replace with actual data fetching
  const [selectedChild, setSelectedChild] = useState<Child>({
    id: "1",
    firstName: "Alex",
    lastName: "Smith",
    grade: "3rd Grade",
    streak: 5,
    booksRead: 12
  })

  const [children] = useState<Child[]>([
    selectedChild,
    {
      id: "2",
      firstName: "Emma",
      lastName: "Smith",
      grade: "1st Grade",
      streak: 3,
      booksRead: 8
    }
  ])

  const [recentBooks] = useState<Book[]>([
    {
      id: "1",
      title: "Pikachu's Great Adventure",
      universe: "Pokemon",
      character: "Pikachu",
      progress: 75,
      lastRead: "2 hours ago"
    },
    {
      id: "2",
      title: "Luigi's Mystery Mansion",
      universe: "Mario",
      character: "Luigi",
      progress: 30,
      lastRead: "Yesterday"
    },
    {
      id: "3",
      title: "Harry's First Spell",
      universe: "Harry Potter",
      character: "Harry Potter",
      progress: 100,
      lastRead: "3 days ago"
    }
  ])

  return (
    <div className="min-h-screen cosmic-bg">
      {/* Navigation */}
      <nav className="relative z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-raleway font-bold text-secondary">TeachTales</h1>
          
          {/* Child Selector */}
          <div className="flex items-center gap-4">
            <select 
              className="px-4 py-2 rounded-lg bg-card border border-border text-sm"
              value={selectedChild.id}
              onChange={(e) => {
                const child = children.find(c => c.id === e.target.value)
                if (child) setSelectedChild(child)
              }}
            >
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </option>
              ))}
            </select>
            
            <button className="p-2 rounded-lg hover:bg-card transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-raleway font-bold mb-2 text-secondary">
            Welcome back, {selectedChild.firstName}!
          </h2>
          <p className="text-muted-foreground">
            Ready for another learning adventure?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Reading Streak</span>
                <span className="text-4xl">🔥</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{selectedChild.streak} days</p>
              <p className="text-sm text-muted-foreground mt-1">Keep it going!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Books Read</span>
                <span className="text-4xl">📚</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{selectedChild.booksRead}</p>
              <p className="text-sm text-muted-foreground mt-1">Amazing progress!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Grade Level</span>
                <span className="text-4xl">🎓</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{selectedChild.grade}</p>
              <p className="text-sm text-muted-foreground mt-1">Learning at your pace</p>
            </CardContent>
          </Card>
        </div>

        {/* Create New Book CTA */}
        <div className="text-center mb-12">
          <Link href="/create-book/universe">
            <Button size="lg" className="text-lg px-8 py-6">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Book
            </Button>
          </Link>
        </div>

        {/* Recent Books */}
        <div>
          <h3 className="text-2xl font-raleway font-bold mb-6 text-secondary">Continue Reading</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentBooks.map(book => (
              <Card key={book.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{book.universe}</span>
                    <span className="text-sm text-muted-foreground">{book.lastRead}</span>
                  </div>
                  <CardTitle className="text-lg">{book.title}</CardTitle>
                  <CardDescription>Featuring {book.character}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{book.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                  </div>
                  <Link href={`/book/${book.id}/chapter/1`}>
                    <Button className="w-full mt-4" variant="outline">
                      Continue Reading
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}