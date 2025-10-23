'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Sparkles, Search } from 'lucide-react'
import { SparksService } from '@/lib/services/sparks-service'
import { TelemetryService } from '@/lib/services/telemetry-service'
import type { SuggestedSpark, Spark } from '@/lib/types/sparks'

interface SparkSelectorProps {
  universe: string
  character: string
  selectedSpark?: string
  onSparkSelect: (sparkId: string, sparkLabel: string) => void
  className?: string
}

export function SparkSelector({ 
  universe, 
  character, 
  selectedSpark, 
  onSparkSelect,
  className = ""
}: SparkSelectorProps) {
  const [suggestedSparks, setSuggestedSparks] = useState<SuggestedSpark[]>([])
  const [allSparks, setAllSparks] = useState<Spark[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [hasTrackedImpressions, setHasTrackedImpressions] = useState(false)

  useEffect(() => {
    // Load suggested sparks for the selected universe/character
    const suggested = SparksService.getSuggestedSparks(universe, character)
    const all = SparksService.getAllSparks()
    
    setSuggestedSparks(suggested)
    setAllSparks(all)
    setHasTrackedImpressions(false)
  }, [universe, character])

  useEffect(() => {
    // Track spark suggestions shown (only once per universe/character combo)
    if (suggestedSparks.length > 0 && !hasTrackedImpressions) {
      TelemetryService.trackSparkSuggestionsShown({
        universe,
        character,
        suggestedSparkIds: suggestedSparks.map(s => s.id),
        totalSuggestions: suggestedSparks.length
      })
      setHasTrackedImpressions(true)
    }
  }, [suggestedSparks, universe, character, hasTrackedImpressions])

  const handleSuggestedSparkClick = (spark: SuggestedSpark, index: number) => {
    // Track suggestion acceptance
    TelemetryService.trackSparkSuggestionAccepted({
      sparkId: spark.id,
      universe,
      character,
      suggestionRank: index + 1,
      totalSuggestions: suggestedSparks.length
    })

    // Track general spark selection
    TelemetryService.trackSparkSelected({
      sparkId: spark.id,
      universe,
      character,
      wasSuggested: true,
      selectionMethod: 'suggested_chip'
    })

    onSparkSelect(spark.id, spark.label)
  }

  const handleDropdownToggle = () => {
    if (!showDropdown) {
      // Track dropdown opening
      TelemetryService.trackSparkDropdownOpened({
        universe,
        character,
        hadSuggestions: suggestedSparks.length > 0,
        suggestionsCount: suggestedSparks.length
      })
    }
    setShowDropdown(!showDropdown)
  }

  const handleDropdownSparkSelect = (sparkId: string) => {
    const selectedSparkObj = allSparks.find(s => s.id === sparkId)
    if (!selectedSparkObj) return

    const wasSuggested = suggestedSparks.some(s => s.id === sparkId)
    
    if (!wasSuggested && suggestedSparks.length > 0) {
      // Track override (user selected non-suggested spark)
      TelemetryService.trackSparkOverride({
        selectedSparkId: sparkId,
        universe,
        character,
        rejectedSuggestions: suggestedSparks.map(s => s.id)
      })
    }

    // Track general spark selection
    TelemetryService.trackSparkSelected({
      sparkId: sparkId,
      universe,
      character,
      wasSuggested,
      selectionMethod: 'dropdown_override'
    })

    onSparkSelect(sparkId, selectedSparkObj.label)
    setShowDropdown(false)
  }

  const selectedSparkLabel = selectedSpark ? 
    (allSparks.find(s => s.id === selectedSpark)?.label || 
     suggestedSparks.find(s => s.id === selectedSpark)?.label || 
     'Unknown Spark') : 
    undefined

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Choose Your Story Spark
        </h3>
      </div>

      {/* Suggested Sparks */}
      {suggestedSparks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              Suggested for {character}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestedSparks.map((spark, index) => (
              <Button
                key={spark.id}
                variant={selectedSpark === spark.id ? "default" : "outline"}
                className={`
                  h-auto p-4 text-left justify-start transition-all duration-200
                  ${selectedSpark === spark.id 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600' 
                    : 'hover:bg-purple-50 hover:border-purple-300'
                  }
                `}
                onClick={() => handleSuggestedSparkClick(spark, index)}
                aria-label={`Select suggested spark: ${spark.label}`}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium">{spark.label}</span>
                  {spark.tags && spark.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {spark.tags.slice(0, 2).map(tag => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className={`text-xs ${
                            selectedSpark === spark.id 
                              ? 'bg-purple-500 text-purple-100' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Dropdown Override */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Or choose from all sparks:
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDropdownToggle}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            aria-expanded={showDropdown}
            aria-label="Toggle all sparks dropdown"
          >
            <Search className="w-4 h-4 mr-1" />
            Browse All
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {showDropdown && (
          <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
            <Select 
              value={selectedSpark || ""} 
              onValueChange={handleDropdownSparkSelect}
            >
              <SelectTrigger className="w-full border-0 focus:ring-0">
                <SelectValue placeholder="Select a spark from the full list..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {allSparks.map((spark) => {
                  const isSuggested = suggestedSparks.some(s => s.id === spark.id)
                  return (
                    <SelectItem 
                      key={spark.id} 
                      value={spark.id}
                      className={isSuggested ? 'bg-purple-50' : ''}
                    >
                      <div className="flex items-center gap-2">
                        <span>{spark.label}</span>
                        {isSuggested && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                            Suggested
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Selected Spark Display */}
      {selectedSparkLabel && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">
              Selected: {selectedSparkLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
