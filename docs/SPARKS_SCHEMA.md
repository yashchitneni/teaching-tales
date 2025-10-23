## Curated Sparks Mapping Schema

This file defines the data model for curated spark suggestions by universe and character. We include a JSON schema, TypeScript types, and example data to seed.

### JSON Schema (Draft)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SparksMapping",
  "type": "object",
  "properties": {
    "version": { "type": "string" },
    "updatedAt": { "type": "string", "format": "date-time" },
    "universes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "characters": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": { "type": "string" },
                "name": { "type": "string" },
                "suggestedSparks": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": { "type": "string" },
                      "label": { "type": "string" },
                      "weight": { "type": "number" },
                      "tags": { "type": "array", "items": { "type": "string" } },
                      "readingLevel": { "type": "string" },
                      "notes": { "type": "string" }
                    },
                    "required": ["id", "label"]
                  }
                }
              },
              "required": ["id", "name", "suggestedSparks"]
            }
          }
        },
        "required": ["id", "name", "characters"]
      }
    },
    "allSparks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "label": { "type": "string" },
          "tags": { "type": "array", "items": { "type": "string" } }
        },
        "required": ["id", "label"]
      }
    }
  },
  "required": ["version", "universes", "allSparks"]
}
```

### TypeScript Types
```ts
export type Spark = {
  id: string;
  label: string;
  tags?: string[];
};

export type SuggestedSpark = Spark & {
  weight?: number; // influence suggestion ranking
  readingLevel?: string; // optional tie-in to TEKS/Lexile bands
  notes?: string;
};

export type CharacterMapping = {
  id: string;
  name: string;
  suggestedSparks: SuggestedSpark[];
};

export type UniverseMapping = {
  id: string;
  name: string;
  characters: CharacterMapping[];
};

export type SparksMapping = {
  version: string;
  updatedAt?: string;
  universes: UniverseMapping[];
  allSparks: Spark[]; // source of truth for dropdown override
};
```

### Example Seed (Minimal)
```json
{
  "version": "0.1.0",
  "updatedAt": "2025-09-20T00:00:00.000Z",
  "universes": [
    {
      "id": "space",
      "name": "Space Adventures",
      "characters": [
        {
          "id": "astro-ali",
          "name": "Astro Ali",
          "suggestedSparks": [
            { "id": "spark-meteor-mystery", "label": "Meteor Mystery", "weight": 0.9, "tags": ["mystery", "space"] },
            { "id": "spark-lost-satellite", "label": "The Lost Satellite", "weight": 0.7, "tags": ["quest", "teamwork"] }
          ]
        }
      ]
    }
  ],
  "allSparks": [
    { "id": "spark-meteor-mystery", "label": "Meteor Mystery", "tags": ["mystery", "space"] },
    { "id": "spark-lost-satellite", "label": "The Lost Satellite", "tags": ["quest", "teamwork"] },
    { "id": "spark-underwater-city", "label": "Underwater City", "tags": ["adventure", "ocean"] }
  ]
}
```

### Implementation Notes
- Store as a JSON file initially (simple editorial workflow), or migrate to a DB table later.
- The UI will render suggested sparks (sorted by weight) and a dropdown powered by `allSparks`.
- Telemetry should capture suggestion impressions, selection, and overrides.


