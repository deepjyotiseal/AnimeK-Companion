import axios from 'axios';

const JIKAN_API_BASE_URL = 'https://api.jikan.moe/v4';

// Rate limiting configuration
// Jikan API has a rate limit of 3 requests per second and 60 requests per minute
// https://docs.api.jikan.moe/#section/Information/Rate-Limiting
const API_COOLDOWN_MS = 500; // 500ms between requests (allows max 2 requests per second to be safe)
let lastRequestTime = 0;
let pendingRequests: Array<() => void> = [];
let isProcessingQueue = false;

/**
 * Manages API request queue to prevent rate limiting
 * @param apiCall - Function that makes the actual API call
 * @returns Promise with the API call result
 */
async function executeWithRateLimit<T>(apiCall: () => Promise<T>): Promise<T> {
  // Create a promise that resolves when it's this request's turn
  return new Promise<T>((resolve, reject) => {
    // Add this request to the queue
    pendingRequests.push(async () => {
      try {
        // Calculate time to wait
        const now = Date.now();
        const timeToWait = Math.max(0, lastRequestTime + API_COOLDOWN_MS - now);
        
        if (timeToWait > 0) {
          await new Promise(r => setTimeout(r, timeToWait));
        }
        
        // Execute the API call
        const result = await apiCall();
        lastRequestTime = Date.now();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    
    // Start processing the queue if it's not already being processed
    if (!isProcessingQueue) {
      processRequestQueue();
    }
  });
}

/**
 * Processes the request queue one by one
 */
async function processRequestQueue() {
  if (pendingRequests.length === 0) {
    isProcessingQueue = false;
    return;
  }
  
  isProcessingQueue = true;
  const nextRequest = pendingRequests.shift();
  
  if (nextRequest) {
    try {
      await nextRequest();
    } catch (error) {
      console.error('Error processing queued request:', error);
    }
  }
  
  // Process the next request
  processRequestQueue();
}

// Basic types for the Jikan API response
// We can expand these later as needed
interface JikanImage {
  jpg: {
    image_url: string;
    small_image_url: string;
    large_image_url: string;
  };
}

interface JikanTitle {
  type: string;
  title: string;
}

export interface JikanAnime {
  mal_id: number;
  url: string;
  images: JikanImage;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  titles: JikanTitle[];
  type: string;
  source: string;
  episodes: number | null;
  status: string; // e.g., "Finished Airing", "Currently Airing", "Not yet aired"
  airing: boolean;
  aired: {
    from: string | null;
    to: string | null;
    prop: {
      from: { day: number | null; month: number | null; year: number | null };
      to: { day: number | null; month: number | null; year: number | null };
    };
    string: string | null;
  };
  duration: string;
  rating: string; // e.g., "G - All Ages", "PG-13 - Teens 13 or older"
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  background: string | null;
  season: string | null; // e.g., "spring", "summer", "fall", "winter"
  year: number | null;
  broadcast: {
    day: string | null;
    time: string | null;
    timezone: string | null;
    string: string | null;
  };
  producers: { mal_id: number; type: string; name: string; url: string }[];
  licensors: { mal_id: number; type: string; name: string; url: string }[];
  studios: { mal_id: number; type: string; name: string; url: string }[];
  genres: { mal_id: number; type: string; name: string; url: string }[];
  explicit_genres: any[]; // Adjust if needed
  themes: { mal_id: number; type: string; name: string; url: string }[];
  demographics: { mal_id: number; type: string; name: string; url: string }[];
}

interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items: {
    count: number;
    total: number;
    per_page: number;
  };
}

interface JikanAnimeListResponse {
  data: JikanAnime[];
  pagination: JikanPagination;
}

/**
 * Fetches a paginated list of anime from the Jikan API.
 * @param page - The page number to fetch.
 * @param limit - The number of items per page (max 25 for Jikan).
 * @param type - Optional filter for anime type (tv, movie, ova, special, etc.)
 * @param orderBy - Optional parameter to sort results (score, popularity, etc.)
 * @returns Promise resolving to the API response.
 */
export const fetchAnimeList = async (
  page: number = 1,
  limit: number = 25,
  type?: string,
  orderBy: string = 'score'
): Promise<JikanAnimeListResponse> => {
  return executeWithRateLimit(async () => {
    try {
      // Add timeout to prevent long-hanging requests
      const response = await axios.get<JikanAnimeListResponse>(
        `${JIKAN_API_BASE_URL}/anime`,
        {
          params: {
            page,
            limit,
            type: type !== 'all' ? type : undefined,
            order_by: orderBy,
            sort: 'desc',
            sfw: true, // Filter out adult content
          },
          timeout: 10000, // 10 second timeout
        }
      );
      
      // Validate response data structure
      if (!response.data || !Array.isArray(response.data.data)) {
        console.error('Invalid response structure from anime list API:', response.data);
        return { data: [], pagination: { last_visible_page: 0, has_next_page: false, current_page: 0, items: { count: 0, total: 0, per_page: 0 } } };
      }
      
      return response.data;
    } catch (error: any) {
      // More detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx range
        console.error('Error response from anime list API:', error.response.status, error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received for anime list API:', error.request);
      } else {
        // Something happened in setting up the request
        console.error('Error setting up anime list request:', error.message);
      }
      
      // Return empty data instead of throwing to prevent app crashes
      return { data: [], pagination: { last_visible_page: 0, has_next_page: false, current_page: 0, items: { count: 0, total: 0, per_page: 0 } } };
    }
  });
};

// Add functions for fetching details, search, etc. later

/**
 * Fetches details for a specific anime by its MAL ID.
 * @param animeId - The MyAnimeList ID of the anime.
 * @returns Promise resolving to the anime details.
 */
export const fetchAnimeDetails = async (animeId: number): Promise<JikanAnime> => {
  return executeWithRateLimit(async () => {
    try {
      const response = await axios.get<{ data: JikanAnime }>(
        `${JIKAN_API_BASE_URL}/anime/${animeId}/full`,
        {
          timeout: 10000, // 10 second timeout
        }
      );
      return response.data.data; // Jikan wraps single item responses in a 'data' object
    } catch (error) {
      console.error(`Error fetching details for anime ID ${animeId}:`, error);
      throw error;
    }
  });
};

/**
 * Fetches seasonal anime for the current season
 */
export const fetchSeasonalAnime = async (
  page: number = 1,
  limit: number = 10
): Promise<JikanAnimeListResponse> => {
  const now = new Date();
  const season = getSeason(now.getMonth() + 1);
  
  return executeWithRateLimit(async () => {
    try {
      const response = await axios.get<JikanAnimeListResponse>(
        `${JIKAN_API_BASE_URL}/seasons/now`,
        {
          params: {
            page,
            limit,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching seasonal anime:', error);
      // Return empty data instead of throwing to prevent app crashes
      return { data: [], pagination: { last_visible_page: 0, has_next_page: false, current_page: 0, items: { count: 0, total: 0, per_page: 0 } } };
    }
  });
};

/**
 * Fetches top anime by score/popularity
 */
export const fetchTopAnime = async (
  page: number = 1,
  limit: number = 10
): Promise<JikanAnimeListResponse> => {
  return executeWithRateLimit(async () => {
    try {
      const response = await axios.get<JikanAnimeListResponse>(
        `${JIKAN_API_BASE_URL}/top/anime`,
        {
          params: {
            page,
            limit,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching top anime:', error);
      // Return empty data instead of throwing to prevent app crashes
      return { data: [], pagination: { last_visible_page: 0, has_next_page: false, current_page: 0, items: { count: 0, total: 0, per_page: 0 } } };
    }
  });
};

/**
 * Fetches anime recommendations based on a specific anime ID
 * 
 * Note: The recommendations endpoint returns a different structure than other endpoints.
 * Each item in the data array has an 'entry' property containing the anime details.
 */
export const fetchAnimeRecommendations = async (
  animeId: number,
  limit: number = 10
): Promise<JikanAnimeListResponse> => {
  return executeWithRateLimit(async () => {
    try {
      const response = await axios.get(
        `${JIKAN_API_BASE_URL}/anime/${animeId}/recommendations`,
        {
          params: {
            limit,
          },
        }
      );
      
      // Log the raw response structure for debugging
      console.log(`Recommendations API response structure for anime ${animeId}:`, 
        JSON.stringify(response.data.data?.[0], null, 2));
      
      // Process the response to ensure it matches the expected structure
      // The recommendations endpoint returns items with an 'entry' property
      // containing the actual anime data
      return response.data;
    } catch (error) {
      console.error(`Error fetching recommendations for anime ${animeId}:`, error);
      // Return empty data instead of throwing to prevent app crashes
      return { data: [], pagination: { last_visible_page: 0, has_next_page: false, current_page: 0, items: { count: 0, total: 0, per_page: 0 } } };
    }
  });
};

/**
 * Search for anime with optional filters
 */
export const searchAnime = async (
  query: string,
  page: number = 1,
  limit: number = 25,
  filters?: {
    type?: 'tv' | 'movie' | 'ova' | 'special' | 'ona' | 'music';
    status?: 'airing' | 'complete' | 'upcoming';
    rating?: 'g' | 'pg' | 'pg13' | 'r17' | 'r' | 'rx';
    orderBy?: 'title' | 'start_date' | 'score' | 'popularity';
    sort?: 'desc' | 'asc';
  }
): Promise<JikanAnimeListResponse> => {
  return executeWithRateLimit(async () => {
    try {
      const response = await axios.get<JikanAnimeListResponse>(
        `${JIKAN_API_BASE_URL}/anime`,
        {
          params: {
            q: query,
            page,
            limit,
            ...filters,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error searching anime:', error);
      // Return empty data instead of throwing to prevent app crashes
      return { data: [], pagination: { last_visible_page: 0, has_next_page: false, current_page: 0, items: { count: 0, total: 0, per_page: 0 } } };
    }
  });
};

/**
 * Fetches anime staff details by anime ID
 */
export const fetchAnimeStaff = async (animeId: number) => {
  return executeWithRateLimit(async () => {
    try {
      const response = await axios.get(`${JIKAN_API_BASE_URL}/anime/${animeId}/staff`);
      return response.data;
    } catch (error) {
      console.error('Error fetching anime staff:', error);
      // Return empty data instead of throwing to prevent app crashes
      return { data: [] };
    }
  });
};

/**
 * Fetches related anime by anime ID
 */
export const fetchRelatedAnime = async (animeId: number) => {
  return executeWithRateLimit(async () => {
    try {
      const response = await axios.get(`${JIKAN_API_BASE_URL}/anime/${animeId}/relations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching related anime:', error);
      // Return empty data instead of throwing to prevent app crashes
      return { data: [] };
    }
  });
};

/**
 * Fetches anime reviews by anime ID
 */
export const fetchAnimeReviews = async (animeId: number) => {
  return executeWithRateLimit(async () => {
    try {
      const response = await axios.get(`${JIKAN_API_BASE_URL}/anime/${animeId}/reviews`);
      return response.data;
    } catch (error) {
      console.error('Error fetching anime reviews:', error);
      // Return empty data instead of throwing to prevent app crashes
      return { data: [] };
    }
  });
};

/**
 * Fetches upcoming anime (not yet aired)
 */
export const fetchUpcomingAnime = async (
  page: number = 1,
  limit: number = 10
): Promise<JikanAnimeListResponse> => {
  return executeWithRateLimit(async () => {
    try {
      // Add timeout to prevent long-hanging requests
      const response = await axios.get<JikanAnimeListResponse>(
        `${JIKAN_API_BASE_URL}/anime`,
        {
          params: {
            page,
            limit,
            status: 'upcoming',
            order_by: 'popularity',
            sort: 'desc'
          },
          timeout: 10000, // 10 second timeout
        }
      );
      
      // Validate response data structure
      if (!response.data || !Array.isArray(response.data.data)) {
        console.error('Invalid response structure from upcoming anime API:', response.data);
        return { data: [], pagination: { last_visible_page: 0, has_next_page: false, current_page: 0, items: { count: 0, total: 0, per_page: 0 } } };
      }
      
      return response.data;
    } catch (error: any) {
      // More detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx range
        console.error('Error response from upcoming anime API:', error.response.status, error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received for upcoming anime API:', error.request);
      } else {
        // Something happened in setting up the request
        console.error('Error setting up upcoming anime request:', error.message);
      }
      
      // Return empty data instead of throwing to prevent app crashes
      return { data: [], pagination: { last_visible_page: 0, has_next_page: false, current_page: 0, items: { count: 0, total: 0, per_page: 0 } } };
    }
  });
};

/**
 * Fetches currently airing anime
 */
export const fetchAiringAnime = async (
  page: number = 1,
  limit: number = 10
): Promise<JikanAnimeListResponse> => {
  return executeWithRateLimit(async () => {
    try {
      // Add timeout to prevent long-hanging requests
      const response = await axios.get<JikanAnimeListResponse>(
        `${JIKAN_API_BASE_URL}/anime`,
        {
          params: {
            page,
            limit,
            status: 'airing',
            order_by: 'popularity',
            sort: 'desc'
          },
          timeout: 10000, // 10 second timeout
        }
      );
      
      // Validate response data structure
      if (!response.data || !Array.isArray(response.data.data)) {
        console.error('Invalid response structure from airing anime API:', response.data);
        return { data: [], pagination: { last_visible_page: 0, has_next_page: false, current_page: 0, items: { count: 0, total: 0, per_page: 0 } } };
      }
      
      return response.data;
    } catch (error: any) {
      // More detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx range
        console.error('Error response from airing anime API:', error.response.status, error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received for airing anime API:', error.request);
      } else {
        // Something happened in setting up the request
        console.error('Error setting up airing anime request:', error.message);
      }
      
      // Return empty data instead of throwing to prevent app crashes
      return { data: [], pagination: { last_visible_page: 0, has_next_page: false, current_page: 0, items: { count: 0, total: 0, per_page: 0 } } };
    }
  });
};

/**
 * Fetches anime by genre
 */
export const fetchAnimeByGenre = async (
  genreId: number,
  page: number = 1,
  limit: number = 10
): Promise<JikanAnimeListResponse> => {
  return executeWithRateLimit(async () => {
    try {
      // Add timeout to prevent long-hanging requests
      const response = await axios.get<JikanAnimeListResponse>(
        `${JIKAN_API_BASE_URL}/anime`,
        {
          params: {
            page,
            limit,
            genres: genreId,
            order_by: 'score',
            sort: 'desc'
          },
          timeout: 10000, // 10 second timeout
        }
      );
      
      // Validate response data structure
      if (!response.data || !Array.isArray(response.data.data)) {
        console.error(`Invalid response structure from genre ${genreId} anime API:`, response.data);
        return { data: [], pagination: { last_visible_page: 0, has_next_page: false, current_page: 0, items: { count: 0, total: 0, per_page: 0 } } };
      }
      
      return response.data;
    } catch (error: any) {
      // More detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx range
        console.error(`Error response from genre ${genreId} anime API:`, error.response.status, error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error(`No response received for genre ${genreId} anime API:`, error.request);
      } else {
        // Something happened in setting up the request
        console.error(`Error setting up genre ${genreId} anime request:`, error.message);
      }
      
      // Return empty data instead of throwing to prevent app crashes
      return { data: [], pagination: { last_visible_page: 0, has_next_page: false, current_page: 0, items: { count: 0, total: 0, per_page: 0 } } };
    }
  });
};

/**
 * Fetches popular anime (by popularity ranking)
 */
export const fetchPopularAnime = async (
  page: number = 1,
  limit: number = 10
): Promise<JikanAnimeListResponse> => {
  return executeWithRateLimit(async () => {
    try {
      // Add timeout to prevent long-hanging requests
      const response = await axios.get<JikanAnimeListResponse>(
        `${JIKAN_API_BASE_URL}/anime`,
        {
          params: {
            page,
            limit,
            order_by: 'popularity',
            sort: 'desc'
          },
          timeout: 10000, // 10 second timeout
        }
      );
      
      // Validate response data structure
      if (!response.data || !Array.isArray(response.data.data)) {
        console.error('Invalid response structure from popular anime API:', response.data);
        return { data: [], pagination: { last_visible_page: 0, has_next_page: false, current_page: 0, items: { count: 0, total: 0, per_page: 0 } } };
      }
      
      return response.data;
    } catch (error: any) {
      // More detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx range
        console.error('Error response from popular anime API:', error.response.status, error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received for popular anime API:', error.request);
      } else {
        // Something happened in setting up the request
        console.error('Error setting up popular anime request:', error.message);
      }
      
      // Return empty data instead of throwing to prevent app crashes
      return { data: [], pagination: { last_visible_page: 0, has_next_page: false, current_page: 0, items: { count: 0, total: 0, per_page: 0 } } };
    }
  });
};

// Helper function to determine current season
function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}
