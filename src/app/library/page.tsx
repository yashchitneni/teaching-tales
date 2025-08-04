'use client'

import { useState } from 'react'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import Image from 'next/image'

// Define our data structure based on the Library Tree with HTML.txt
const libraryData = {
  'Sports': {
    image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/sports_1024x585.webp',
    categories: {
      'Team Sports': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/team_sports_1024x585.webp',
        items: [
          { name: 'Soccer', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/soccer_1024x585.webp' },
          { name: 'Basketball', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/basketball_1024x585.webp' },
          { name: 'Baseball', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/baseball_1024x585.webp' },
          { name: 'Volleyball', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/volleyball_1024x585.webp' },
          { name: 'Football', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/football_1024x585.webp' },
          { name: 'Hockey', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/hockey_1024x585.webp' },
          { name: 'Rugby', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/rugby_1024x585.webp' }
        ]
      },
      'Individual Sports': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/individual_sports_1024x585.webp',
        items: [
          { name: 'Tennis', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/tennis_1024x585.webp' },
          { name: 'Gymnastics', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/gymnastics_1024x585.webp' },
          { name: 'Martial Arts', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/martial_arts_1024x585.webp' },
          { name: 'Track and Field', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/track_field_1024x585.webp' }
        ]
      },
      'Adventure Sports': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/adventure_sports_1024x585.webp',
        items: [
          { name: 'Climbing', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/climbing_1024x585.webp' },
          { name: 'Hiking', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/hiking_1024x585.webp' },
          { name: 'Skateboarding', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/skateboarding_1024x585.webp' }
        ]
      },
      'Water Sports': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/water_sports_1024x585.webp',
        items: [
          { name: 'Swimming', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/swimming_1024x585.webp' },
          { name: 'Diving', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/diving_1024x585.webp' },
          { name: 'Sailing', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/sailing_1024x585.webp' }
        ]
      },
      'Winter Sports': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/winter_sports_1024x585.webp',
        items: [
          { name: 'Skiing', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/skiing_1024x585.webp' },
          { name: 'Snowboarding', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/snowboarding_1024x585.webp' },
          { name: 'Ice Skating', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/ice_skating_1024x585.webp' }
        ]
      },
      'Athletics': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/athletics_1024x585.webp',
        items: [
          { name: 'Track and Field', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/track_field_1024x585.webp' },
          { name: 'Road Races', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/road_races_1024x585.webp' }
        ]
      },
      'Mind Sports': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/mind_sports_1024x585.webp',
        items: [
          { name: 'Chess', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/chess_1024x585.webp' },
          { name: 'Puzzle Competitions', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/puzzle_competitions_1024x585.webp' }
        ]
      }
    }
  },
  'Animals': {
    image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/animals_1024x585.webp',
    categories: {
      'Wildlife': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/wildlife_1024x585.webp',
        items: [
          { name: 'Mammals', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/mammals_1024x585.webp' },
          { name: 'Birds', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/birds_1024x585.webp' },
          { name: 'Reptiles', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/reptiles_1024x585.webp' }
        ]
      },
      'Pets': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/pets_1024x585.webp',
        items: [
          { name: 'Dogs', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/dogs_1024x585.webp' },
          { name: 'Cats', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/cats_1024x585.webp' },
          { name: 'Small Pets', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/small_pets_1024x585.webp' }
        ]
      },
      'Marine Life': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/marine_life_1024x585.webp',
        items: [
          { name: 'Fish', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/fish_1024x585.webp' },
          { name: 'Ocean Creatures', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/ocean_creatures_1024x585.webp' },
          { name: 'Coral Reefs', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/coral_reefs_1024x585.webp' }
        ]
      }
    }
  },
  'Science & Nature': {
    image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/science_nature_1024x585.webp',
    categories: {
      'Physical Sciences': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/physical_sciences_1024x585.webp',
        items: [
          { name: 'Physics', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/physics_1024x585.webp' },
          { name: 'Chemistry', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/chemistry_1024x585.webp' }
        ]
      },
      'Life Sciences': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/life_sciences_1024x585.webp',
        items: [
          { name: 'Biology', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/biology_1024x585.webp' },
          { name: 'Environmental Science', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/environmental_science_1024x585.webp' }
        ]
      },
      'Earth & Space': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/earth_space_1024x585.webp',
        items: [
          { name: 'Astronomy', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/astronomy_1024x585.webp' },
          { name: 'Geology', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/geology_1024x585.webp' }
        ]
      }
    }
  },
  'History & Culture': {
    image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/history_culture_1024x585.webp',
    categories: {
      'Ancient Civilizations': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/ancient_civilizations_1024x585.webp',
        items: [
          { name: 'Egypt', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/egypt_1024x585.webp' },
          { name: 'Rome', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/rome_1024x585.webp' }
        ]
      },
      'World History': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/world_history_1024x585.webp',
        items: [
          { name: 'Medieval Times', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/medieval_times_1024x585.webp' },
          { name: 'Modern History', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/modern_history_1024x585.webp' }
        ]
      },
      'Cultures Around the World': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/cultures_around_world_1024x585.webp',
        items: [
          { name: 'Traditions', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/traditions_1024x585.webp' },
          { name: 'Languages', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/languages_1024x585.webp' }
        ]
      }
    }
  },
  'Arts & Crafts': {
    image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/arts_crafts_1024x585.webp',
    categories: {
      'Visual Arts': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/visual_arts_1024x585.webp',
        items: [
          { name: 'Drawing', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/drawing_1024x585.webp' },
          { name: 'Painting', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/painting_1024x585.webp' }
        ]
      },
      'Performing Arts': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/performing_arts_1024x585.webp',
        items: [
          { name: 'Dance', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/dance_1024x585.webp' }
        ]
      },
      'Crafts': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/crafts_1024x585.webp',
        items: [
          { name: 'DIY Projects', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/diy_projects_1024x585.webp' },
          { name: 'Recycling Crafts', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/recycling_crafts_1024x585.webp' }
        ]
      }
    }
  },
  'Technology & Innovation': {
    image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/technology_innovation_1024x585.webp',
    categories: {
      'Computing': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/computing_1024x585.webp',
        items: [
          { name: 'Computers', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/computers_1024x585.webp' },
          { name: 'Internet', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/internet_1024x585.webp' }
        ]
      },
      'Inventions': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/inventions_1024x585.webp',
        items: [
          { name: 'Historical Inventions', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/historical_inventions_1024x585.webp' },
          { name: 'Modern Innovations', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/modern_innovations_1024x585.webp' }
        ]
      }
    }
  },
  'Literature & Stories': {
    image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/literature_stories_1024x585.webp',
    categories: {
      'Fairy Tales': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/fairy_tales_1024x585.webp',
        items: [
          { name: 'Classic Tales', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/classic_tales_1024x585.webp' },
          { name: 'Folk Tales', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/folk_tales_1024x585.webp' }
        ]
      },
      'Popular Children\'s Stories': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/popular_childrens_stories_1024x585.webp',
        items: [
          { name: 'Modern Favorites', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/modern_favorites_1024x585.webp' },
          { name: 'Author Spotlights', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/author_spotlights_1024x585.webp' }
        ]
      }
    }
  },
  'Travel & Geography': {
    image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/travel_geography_1024x585.webp',
    categories: {
      'Countries': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/countries_1024x585.webp',
        items: [
          { name: 'USA', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/usa_1024x585.webp' },
          { name: 'World', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/world_1024x585.webp' }
        ]
      },
      'Geography': {
        image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/geography_1024x585.webp',
        items: [
          { name: 'Maps', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/maps_1024x585.webp' },
          { name: 'Physical Geography', image: 'https://d3dp0uoydvg1je.cloudfront.net/interests/physical_geography_1024x585.webp' }
        ]
      }
    }
  }
}

export default function LibraryPage() {
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
                const categoryData = libraryData[expandedArea as keyof typeof libraryData].categories[categoryName as keyof typeof libraryData[keyof typeof libraryData]['categories']]
                const items = categoryData.items;
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
                    console.log('Start reading:', selectedLastChoice)
                    // TODO: Navigate to reading page
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