"use client";

import Image from "next/image";
import { useState } from "react";

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 lg:px-12 relative">
        <div className="flex items-center gap-3">
          <Image
            src="https://ext.same-assets.com/3403448304/1727486668.png"
            alt="TeachTales Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <span className="text-2xl font-bold text-white font-raleway">TeachTales</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-white hover:text-primary transition-colors">Feedback</a>
          <a href="#" className="text-white hover:text-primary transition-colors">Login</a>
          <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors magical-glow">
            SIGN UP
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-secondary/30 md:hidden">
            <nav className="flex flex-col p-6 gap-4">
              <a href="#" className="text-white hover:text-primary transition-colors">Feedback</a>
              <a href="#" className="text-white hover:text-primary transition-colors">Login</a>
              <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors text-left">
                SIGN UP
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="cosmic-bg py-20 lg:py-32 px-6 lg:px-12 text-center">
          <div className="max-w-4xl mx-auto relative z-10">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="gradient-text">Write New Adventures</span>
              <br />
              <span className="text-white">With Characters You Love</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Create stories with characters from Harry Potter, Pokémon, and more. Our AI-driven adventures
              keep kids engaged and adapt to their reading level for real growth.
            </p>
            <button className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors magical-glow">
              TRY BETA FOR FREE
            </button>
          </div>
          <div className="mt-16 relative z-10">
            <Image
              src="https://ext.same-assets.com/3403448304/3720129679.avif"
              alt="Magical Book"
              width={600}
              height={400}
              className="mx-auto"
            />
          </div>
        </div>
      </section>

      {/* Wizarding World Section */}
      <section
        className="relative py-20 lg:py-32 px-6 lg:px-12"
        style={{
          backgroundImage: 'url("https://ext.same-assets.com/3403448304/1953986676.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#232059]/90 to-transparent"></div>
        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-8 text-white">
              Bring Your Own <span className="gradient-text">Wizarding</span>
              <br />
              <span className="gradient-text">World To Life</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Create your own <span className="font-semibold text-white">Harry Potter-inspired stories</span> filled with
              Hogwarts secrets, exciting spells, and magical creatures.
              TeachTales helps you decide what happens next as you write
              amazing adventures with Harry, Hermione, and all your favorite
              characters.
            </p>
            <button className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors magical-glow">
              WRITE YOUR HOGWARTS STORY
            </button>
          </div>
        </div>
      </section>

      {/* Shape Your Tale Section */}
      <section className="py-20 lg:py-32 px-6 lg:px-12 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold mb-8 text-white">
            Shape Your <span className="gradient-text">Unique Tale</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Take charge of your story by choosing the paths, characters, and twists that excite you. Watch as each
            chapter evolves into an unforgettable adventure, shaped entirely by your imagination.
          </p>
          <button className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors magical-glow">
            TRY BETA FOR FREE
          </button>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-card/30 backdrop-blur-sm rounded-2xl p-8 h-full">
              <Image
                src="https://ext.same-assets.com/3403448304/24210027.png"
                alt="Your Story, Your Level"
                width={300}
                height={200}
                className="mx-auto mb-6 rounded-lg"
              />
              <h3 className="text-2xl font-bold text-white mb-4">Your Story, Your Level</h3>
              <p className="text-gray-300 leading-relaxed">
                Set the stage with stories that match your grade and reading level. Whether you're just starting
                out or already a pro, every story will challenge and excite you in the best way possible.
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-card/30 backdrop-blur-sm rounded-2xl p-8 h-full">
              <Image
                src="https://ext.same-assets.com/3403448304/407705279.png"
                alt="Step Into Your Favorite Worlds"
                width={300}
                height={200}
                className="mx-auto mb-6 rounded-lg"
              />
              <h3 className="text-2xl font-bold text-white mb-4">Step Into Your Favorite Worlds</h3>
              <p className="text-gray-300 leading-relaxed">
                Choose characters and settings from the stories you already love! Your favorite heroes from Harry Potter,
                Lord of the Rings, Marvels, and many more universes are waiting to join you in infinite adventures tailored just for you!
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-card/30 backdrop-blur-sm rounded-2xl p-8 h-full">
              <Image
                src="https://ext.same-assets.com/3403448304/734272526.png"
                alt="Build Your Story"
                width={300}
                height={200}
                className="mx-auto mb-6 rounded-lg"
              />
              <h3 className="text-2xl font-bold text-white mb-4">Build Your Story, One Chapter At A Time</h3>
              <p className="text-gray-300 leading-relaxed">
                Add twists, explore new ideas, and make sure everything fits perfectly while keeping the adventure going
                strong. It's your story, make it epic!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Stories Section */}
      <section className="py-20 lg:py-32 px-6 lg:px-12 text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold mb-8 text-white">
            Infinite Stories, <span className="gradient-text">Endless Possibilities</span>
          </h2>
          <p className="text-xl text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed">
            From thrilling quests to heartwarming tales, each story is crafted to match your imagination and bring
            your ideas to life.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Image
              src="https://ext.same-assets.com/3403448304/2951169889.png"
              alt="Story Interface 1"
              width={400}
              height={300}
              className="rounded-lg shadow-2xl"
            />
            <Image
              src="https://ext.same-assets.com/3403448304/1908583676.webp"
              alt="Story Interface 2"
              width={400}
              height={300}
              className="rounded-lg shadow-2xl"
            />
            <Image
              src="https://ext.same-assets.com/3403448304/2422039097.webp"
              alt="Story Interface 3"
              width={400}
              height={300}
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Benefits Cards */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">A New And Rewarding Experience</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              At the end of each chapter, test your knowledge with fun, never repetitive questions, that make your adventures
              even more exciting! Earns coins by answering correctly, and <span className="font-semibold text-white">redeem your
              coins for Robux</span>.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Choose Your Adventure, Your Way</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Write your own books through a <span className="font-semibold text-white">choose-your-own-adventure style</span>.
              Each decision you make shapes the characters, plot, and twists, turning your favorite worlds into a story that's uniquely yours.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Grow Alongside Your Heroes</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Watch your reading skills grow as our platform seamlessly <span className="font-semibold text-white">adjusts to your
              Lexile level</span>, providing challenges that keep pace with your progress.
            </p>
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="py-20 lg:py-32 px-6 lg:px-12 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="gradient-text">Share Your Feedback,</span> <span className="text-white">Help Us Improve!</span>
          </h2>
          <p className="text-xl text-gray-300 mb-4">Be the author of our next chapter!</p>
          <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Share your experience on the app, and help make TeachTales even more magical for readers everywhere.
            You can also use the form below.
          </p>
          <button className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors magical-glow">
            LEAVE FEEDBACK
          </button>
        </div>
      </section>

      {/* AI Advantages Section */}
      <section className="py-20 lg:py-32 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">
              The Advantages Of <span className="gradient-text">Generative AI</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              TeachTales takes the universe you select, the characters you love, and your reading level to create the
              foundation for a one-of-a-kind book. With dynamic AI, the story grows with each chapter, maintaining
              continuity and introducing fresh surprises. Every choice you make - big or small - guides the narrative,
              creating a story that's entirely your own.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              className="relative overflow-hidden rounded-2xl h-[300px] group cursor-pointer"
              style={{
                backgroundImage: 'url("https://ext.same-assets.com/3403448304/1652032509.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 group-hover:from-black/90 transition-all duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                <h3 className="text-xl font-bold text-white mb-3">Endless Variety</h3>
                <p className="text-gray-200 text-sm leading-relaxed">
                  Unlike standard reading apps, our dynamic chapters offer fresh journeys for every read, letting students explore new ideas that spark curiosity.
                </p>
              </div>
            </div>
            <div
              className="relative overflow-hidden rounded-2xl h-[300px] group cursor-pointer"
              style={{
                backgroundImage: 'url("https://ext.same-assets.com/3403448304/3114493299.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 group-hover:from-black/90 transition-all duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                <h3 className="text-xl font-bold text-white mb-3">Personalized Content</h3>
                <p className="text-gray-200 text-sm leading-relaxed">
                  Stories feel relevant because they're shaped by each child's own selections. Reading about topics they enjoy encourages more time spent practicing.
                </p>
              </div>
            </div>
            <div
              className="relative overflow-hidden rounded-2xl h-[300px] group cursor-pointer"
              style={{
                backgroundImage: 'url("https://ext.same-assets.com/3403448304/1653798282.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 group-hover:from-black/90 transition-all duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                <h3 className="text-xl font-bold text-white mb-3">Academic Rigor</h3>
                <p className="text-gray-200 text-sm leading-relaxed">
                  We match chapters to each student's reading level, then create focused questions that sharpen comprehension skills. No fluff, just concrete learning.
                </p>
              </div>
            </div>
            <div
              className="relative overflow-hidden rounded-2xl h-[300px] group cursor-pointer"
              style={{
                backgroundImage: 'url("https://ext.same-assets.com/3403448304/2782131416.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 group-hover:from-black/90 transition-all duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                <h3 className="text-xl font-bold text-white mb-3">Age Appropriateness</h3>
                <p className="text-gray-200 text-sm leading-relaxed">
                  Aligning stories with the appropriate age groups creates an enriching reading experience, offering complex moral dilemmas and prompting reflection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-12 border-t border-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Image
                src="https://ext.same-assets.com/3403448304/1727486668.png"
                alt="TeachTales Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="text-2xl font-bold text-white font-raleway">TeachTales</span>
            </div>
            <div className="text-center">
              <p className="text-gray-300 mb-2">Questions? Contact us at <a href="mailto:support@learnwith.ai" className="text-primary hover:underline">support@learnwith.ai</a></p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-sm text-gray-400">
            <span>© 2025 LearnWithAI. All rights reserved</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Contact Us</a>
              <a href="#" className="hover:text-primary transition-colors">Feedback</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
