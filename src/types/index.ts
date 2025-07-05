export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface Anime {
  mal_id: number;
  title: string;
  image_url: string;
  synopsis: string;
  episodes: number;
  score: number;
  genres: Array<{ name: string }>;
}

export interface WatchlistItem {
  userId: string;
  animeId: number;
  status: 'watching' | 'completed' | 'on-hold' | 'dropped' | 'plan-to-watch' | 'favorite';
}