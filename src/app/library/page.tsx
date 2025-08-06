'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import Image from 'next/image'

// Define our data structure based on the Library Tree with HTML.txt
const libraryData = {
  'Sports': {
    image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/sports.webp',
    categories: {
      'Team Sports': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/team_sports.webp',
        items: [
          { name: 'Soccer', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/soccer.webp' },
          { name: 'Basketball', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/basketball.webp' },
          { name: 'Baseball', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/baseball.webp' },
          { name: 'Volleyball', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/volleyball.webp' },
          { name: 'Football', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/football.webp' },
          { name: 'Hockey', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/hockey.webp' },
          { name: 'Rugby', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/rugby.webp' }
        ]
      },
      'Individual Sports': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/individual_sports.webp',
        items: [
          { name: 'Tennis', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/tennis.webp' },
          { name: 'Gymnastics', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/gymnastics.webp' },
          { name: 'Martial Arts', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/martial_arts.webp' },
          { name: 'Track and Field', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/track_and_field.webp' }
        ]
      },
      'Adventure Sports': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/adventure_sports.webp',
        items: [
          { name: 'Climbing', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/climbing.webp' },
          { name: 'Hiking', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/hiking.webp' },
          { name: 'Skateboarding', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/skateboarding.webp' }
        ]
      },
      'Water Sports': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/water_sports.webp',
        items: [
          { name: 'Swimming', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/swimming.webp' },
          { name: 'Diving', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/diving.webp' },
          { name: 'Sailing', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/sailing.webp' }
        ]
      },
      'Winter Sports': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/winter_sports.webp',
        items: [
          { name: 'Skiing', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/skiing.webp' },
          { name: 'Snowboarding', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/snowboarding.webp' },
          { name: 'Ice Skating', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/ice_skating.webp' }
        ]
      },
      'Athletics': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/athletics.webp',
        items: [
          { name: 'Track and Field', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/track_and_field.webp' },
          { name: 'Road Races', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/road_races.webp' }
        ]
      },
      'Mind Sports': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/mind_sports.webp',
        items: [
          { name: 'Chess', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/chess.webp' },
          { name: 'Puzzle Competitions', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/puzzle_competitions.webp' }
        ]
      }
    }
  },
  'Animals': {
    image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/animals.webp',
    categories: {
      'Wildlife': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/wildlife.webp',
        items: [
          { name: 'Mammals', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/mammals.webp' },
          { name: 'Frogs', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/frogs.webp' },
          { name: 'Reptiles', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/reptiles.webp' }
        ]
      },
      'Pets': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/pets.webp',
        items: [
          { name: 'Dogs', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/dogs.webp' },
          { name: 'Hamsters', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/hamsters.webp' },
          { name: 'Small Pets', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/small_pets.webp' }
        ]
      },
      'Marine Life': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/marine_life.webp',
        items: [
          { name: 'Fish', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/fish.webp' },
          { name: 'Ocean Creatures', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/ocean_creatures.webp' },
          { name: 'Coral Reefs', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/coral_reefs.webp' }
        ]
      }
    }
  },
  'Science & Nature': {
    image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/science_and_nature.webp',
    categories: {
      'Physical Sciences': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/physical_sciences.webp',
        items: [
          { name: 'Physics', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/physics.webp' },
          { name: 'Chemistry', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/chemistry.webp' }
        ]
      },
      'Life Sciences': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/life_sciences.webp',
        items: [
          { name: 'Biology', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/biology.webp' },
          { name: 'Environmental Science', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/environmental_science.webp' }
        ]
      },
      'Earth & Space': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/earth_and_space.webp',
        items: [
          { name: 'Astronomy', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/astronomy.webp' },
          { name: 'Geology', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/geology.webp' }
        ]
      }
    }
  },
  'History & Culture': {
    image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/history_and_culture.webp',
    categories: {
      'Ancient Civilizations': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/ancient_civilizations.webp',
        items: [
          { name: 'Egypt', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/egypt.webp' },
          { name: 'Rome', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/rome.webp' }
        ]
      },
      'World History': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/world_history.webp',
        items: [
          { name: 'Medieval Times', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/medieval_times.webp' },
          { name: 'Modern History', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/modern_history.webp' }
        ]
      },
      'Cultures Around the World': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/cultures_around_the_world.webp',
        items: [
          { name: 'Traditions', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/traditions.webp' },
          { name: 'Languages', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/languages.webp' }
        ]
      }
    }
  },
  'Arts & Crafts': {
    image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/arts_and_crafts.webp',
    categories: {
      'Visual Arts': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/visual_arts.webp',
        items: [
          { name: 'Drawing', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/drawing.webp' },
          { name: 'Painting', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/painting.webp' }
        ]
      },
      'Performing Arts': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/performing_arts.webp',
        items: [
          { name: 'Dance', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/dance.webp' }
        ]
      },
      'Crafts': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/crafts.webp',
        items: [
          { name: 'DIY Projects', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/diy_projects.webp' },
          { name: 'Recycling Crafts', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/recycling_crafts.webp' }
        ]
      }
    }
  },
  'Technology & Innovation': {
    image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/technology_and_innovation.webp',
    categories: {
      'Computing': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/computing.webp',
        items: [
          { name: 'Computers', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/computers.webp' },
          { name: 'Internet', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/internet.webp' }
        ]
      },
      'Inventions': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/inventions.webp',
        items: [
          { name: 'Historical Inventions', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/historical_inventions.webp' },
          { name: 'Modern Innovations', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/modern_innovations.webp' }
        ]
      }
    }
  },
  'Literature & Stories': {
    image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/literature_and_stories.webp',
    categories: {
      'Fairy Tales': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/fairy_tales.webp',
        items: [
          { name: 'Classic Tales', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/classic_tales.webp' },
          { name: 'Folk Tales', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/folk_tales.webp' }
        ]
      },
      'Popular Children\'s Stories': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/popular_childrens_stories.webp',
        items: [
          { name: 'Modern Favorites', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/modern_favorites.webp' },
          { name: 'Author Spotlights', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/author_spotlights.webp' }
        ]
      }
    }
  },
  'Travel & Geography': {
    image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/travel_and_geography.webp',
    categories: {
      'Countries': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/countries.webp',
        items: [
          { name: 'USA', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/usa.webp' },
          { name: 'World', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/world.webp' }
        ]
      },
      'Geography': {
        image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/geography.webp',
        items: [
          { name: 'Maps', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/maps.webp' },
          { name: 'Physical Geography', image: 'https://teaching-tales-production-teachingtalesbucketbucket-ncvkkabz.s3.amazonaws.com/images/maps.webp' }
        ]
      }
    }
  }
}

export default function LibraryPage() {
  const router = useRouter()
  
  // Track which single area and category are currently expanded (single-path navigation)
  const [expandedArea, setExpandedArea] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [selectedLastChoice, setSelectedLastChoice] = useState<string | null>(null)

  const toggleArea = (areaName: string) => {
    if (expandedArea === areaName) {
      // Clicking the same area closes it
      setExpandedArea(null)
      setExpandedCategory(null) // Also close any expanded category
      setSelectedLastChoice(null) // Reset last choice selection
    } else {
      // Clicking a different area opens it and closes others
      setExpandedArea(areaName)
      setExpandedCategory(null) // Reset category when switching areas
      setSelectedLastChoice(null) // Reset last choice selection
    }
  }

  const toggleCategory = (areaName: string, categoryName: string) => {
    const categoryKey = `${areaName}:${categoryName}`
    if (expandedCategory === categoryKey) {
      // Clicking the same category closes it
      setExpandedCategory(null)
      setSelectedLastChoice(null) // Reset last choice selection
    } else {
      // Clicking a different category opens it and closes others
      setExpandedCategory(categoryKey)
      setSelectedLastChoice(null) // Reset last choice selection when switching categories
    }
  }

  const handleItemClick = (itemName: string) => {
    setSelectedLastChoice(selectedLastChoice === itemName ? null : itemName)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <TopNavWithTabs />
      
      <div className="px-32 py-6 space-y-12">
        {/* Section 1: Pick an Area of Interest - Always Visible */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-fit mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Pick an Area of Interest</h1>
            <p className="text-gray-600">Each world holds endless possibilities. Which one speaks to your imagination?</p>
          </div>
          
          <div>
            {/* Split into rows of 4 items each */}
            {(() => {
              const areas = Object.entries(libraryData);
              const rows = [];
              for (let i = 0; i < areas.length; i += 4) {
                rows.push(areas.slice(i, i + 4));
              }
              return rows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-4 mb-4">
                  {row.map(([areaName, areaData]) => (
                                  <div
                    key={areaName}
                    className="group w-60"
                    onClick={() => toggleArea(areaName)}
                  >
                                      <div className={`border rounded-md overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 flex flex-col p-3 cursor-pointer ${
                      expandedArea === areaName 
                        ? 'border-blue-600 bg-blue-600 bg-opacity-10' 
                        : 'bg-white hover:bg-gray-200 border-gray-300'
                    }`}>
                      <Image
                        src={areaData.image}
                        alt={areaName}
                        width={243}
                        height={108}
                        className="aspect-[2.25] object-cover object-center w-full"
                      />
                      <div className="text-black text-base font-semibold leading-5 mt-1 text-center">{areaName}</div>
                    </div>
                </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Section 2: Pick Again - Only visible when area is selected */}
        {expandedArea && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-fit mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Pick Again</h2>
            </div>
            
            <div>
              {/* Split into rows of 4 items each */}
              {(() => {
                const categories = Object.entries(libraryData[expandedArea as keyof typeof libraryData].categories);
                const rows = [];
                for (let i = 0; i < categories.length; i += 4) {
                  rows.push(categories.slice(i, i + 4));
                }
                return rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex justify-center gap-4 mb-4">
                    {row.map(([categoryName, categoryData]) => (
                                      <div
                      key={categoryName}
                      className="group w-60"
                      onClick={() => toggleCategory(expandedArea, categoryName)}
                    >
                    <div className={`border rounded-md overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 flex flex-col p-3 cursor-pointer ${
                      expandedCategory === `${expandedArea}:${categoryName}`
                        ? 'border-blue-600 bg-blue-600 bg-opacity-10'
                        : 'bg-white hover:bg-gray-200 border-gray-300'
                    }`}>
                      <Image
                        src={categoryData.image}
                        alt={categoryName}
                        width={243}
                        height={108}
                        className="aspect-[2.25] object-cover object-center w-full"
                      />
                      <div className="text-black text-base font-semibold leading-5 mt-1 text-center">{categoryName}</div>
                    </div>
                  </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Section 3: Last Choice - Only visible when category is selected */}
        {expandedCategory && expandedArea && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-fit mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-800 mb-2">Last Choice</h3>
            </div>
            
            <div>
              {/* Split into rows of 4 items each */}
              {(() => {
                const categoryName = expandedCategory.split(':')[1]
                const areaData = libraryData[expandedArea as keyof typeof libraryData]
                if (!areaData || !areaData.categories) return null;
                
                const categoryData = (areaData.categories as any)[categoryName]
                if (!categoryData || !categoryData.items) return null;
                
                const items = categoryData.items as Array<{name: string, image: string}>;
                const rows = [];
                for (let i = 0; i < items.length; i += 4) {
                  rows.push(items.slice(i, i + 4));
                }
                return rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex justify-center gap-4 mb-4">
                    {row.map((item) => (
                    <div
                      key={item.name}
                      className="group w-60"
                      onClick={() => handleItemClick(item.name)}
                    >
                      <div className={`border rounded-md overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 flex flex-col p-3 cursor-pointer ${
                        selectedLastChoice === item.name
                          ? 'border-blue-600 bg-blue-600 bg-opacity-10'
                          : 'bg-white hover:bg-gray-200 border-gray-300'
                      }`}>
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={243}
                          height={108}
                          className="aspect-[2.25] object-cover object-center w-full"
                        />
                        <div className="text-black text-base font-semibold leading-5 mt-1 text-center">{item.name}</div>
                      </div>
                    </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
            
            {/* Start Reading Button - Only visible when Last Choice is selected */}
            {selectedLastChoice && (
              <div className="flex justify-center mt-8">
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
                  onClick={() => {
                    router.push(`/stories?topic=${encodeURIComponent(selectedLastChoice!)}`)
                  }}
                >
                  Start Reading
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}