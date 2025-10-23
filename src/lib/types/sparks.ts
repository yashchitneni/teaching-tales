export type Spark = {
  id: string;
  label: string;
  tags?: string[];
};

export type SuggestedSpark = Spark & {
  weight?: number;
  readingLevel?: string;
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
  allSparks: Spark[];
};


