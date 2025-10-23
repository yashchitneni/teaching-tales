import type { SparksMapping, SuggestedSpark, Spark } from '@/lib/types/sparks';
import sparksData from '@/lib/data/sparks.json';

export class SparksService {
  private static readonly data: SparksMapping = sparksData as SparksMapping;

  static getAllSparks(): Spark[] {
    return this.data.allSparks;
  }

  static getSuggestedSparks(universeId: string, characterId: string): SuggestedSpark[] {
    const uni = this.data.universes.find(u => u.id === universeId);
    if (!uni) return [];
    const character = uni.characters.find(c => c.id === characterId);
    if (!character) return [];
    return [...character.suggestedSparks].sort((a, b) => (b.weight || 0) - (a.weight || 0));
  }

  static findSparkById(sparkId: string): Spark | SuggestedSpark | undefined {
    return this.data.allSparks.find(s => s.id === sparkId) ||
      this.data.universes.flatMap(u => u.characters).flatMap(c => c.suggestedSparks).find(s => s.id === sparkId);
  }
}


