#!/usr/bin/env -S uv run
# /// script
# dependencies = [
#   "requests",
# ]
# ///

import requests
import os


image_urls = [
  "https://d3dp0uoydvg1je.cloudfront.net/interests/sports_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/animals_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/science_nature_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/history_culture_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/arts_crafts_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/technology_innovation_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/literature_stories_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/travel_geography_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/team_sports_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/individual_sports_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/adventure_sports_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/water_sports_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/winter_sports_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/athletics_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/mind_sports_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/soccer_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/basketball_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/baseball_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/volleyball_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/football_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/hockey_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/rugby_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/tennis_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/gymnastics_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/martial_arts_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/track_field_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/climbing_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/hiking_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/skateboarding_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/swimming_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/diving_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/sailing_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/skiing_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/snowboarding_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/ice_skating_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/road_races_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/chess_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/puzzle_competitions_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/wildlife_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/pets_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/marine_life_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/mammals_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/birds_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/reptiles_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/dogs_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/cats_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/small_pets_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/fish_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/ocean_creatures_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/coral_reefs_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/physical_sciences_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/life_sciences_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/earth_space_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/physics_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/chemistry_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/biology_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/environmental_science_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/astronomy_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/geology_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/ancient_civilizations_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/world_history_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/cultures_around_world_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/egypt_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/rome_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/medieval_times_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/modern_history_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/traditions_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/languages_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/visual_arts_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/performing_arts_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/crafts_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/drawing_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/painting_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/dance_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/diy_projects_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/recycling_crafts_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/computing_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/inventions_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/computers_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/internet_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/historical_inventions_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/modern_innovations_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/fairy_tales_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/popular_childrens_stories_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/classic_tales_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/folk_tales_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/modern_favorites_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/author_spotlights_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/countries_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/geography_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/usa_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/world_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/maps_1024x585.webp",
  "https://d3dp0uoydvg1je.cloudfront.net/interests/physical_geography_1024x585.webp"
]


os.makedirs('teachtales_images_library', exist_ok=True)

for i, url in enumerate(image_urls, 1):
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        ext = url.split('.')[-1]
        filename = f"image_{i}.{ext}"
        filepath = os.path.join('teachtales_images_library', filename)
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Downloaded {filename}")
    except Exception as e:
        print(f"Failed to download {url}: {e}")