// Export JikanAnime type from jikanApi.ts
import type { JikanAnime as JikanAnimeType } from '../api/jikanApi';

export type JikanAnime = JikanAnimeType;

// Re-export other anime-related types as needed
export interface AnimeFilter {
  type?: string;
  status?: string;
  genre?: number;
  sort?: string;
}