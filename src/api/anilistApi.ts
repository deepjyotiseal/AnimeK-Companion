import axios from 'axios';

const ANILIST_API_URL = 'https://graphql.anilist.co';

// Types for AniList API responses
export interface AniListAnime {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  coverImage: {
    extraLarge: string;
    large: string;
    medium: string;
    color: string | null;
  };
  bannerImage: string | null;
  season: string | null;
  seasonYear: number | null;
  description: string | null;
  type: string | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  duration: number | null;
  genres: string[];
  averageScore: number | null;
  popularity: number | null;
  studios: {
    nodes: {
      id: number;
      name: string;
      isAnimationStudio: boolean;
    }[];
  };
  startDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  };
  endDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  };
}

export interface AniListResponse {
  data: {
    Page: {
      media: AniListAnime[];
      pageInfo: {
        total: number;
        currentPage: number;
        lastPage: number;
        hasNextPage: boolean;
        perPage: number;
      };
    };
  };
}

/**
 * Fetches current season anime from AniList
 * @param page - The page number to fetch
 * @param perPage - Number of items per page
 * @returns Promise resolving to the API response
 */
export const fetchCurrentSeasonAnime = async (
  page: number = 1,
  perPage: number = 10
): Promise<AniListResponse> => {
  const query = `
    query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            extraLarge
            large
            medium
            color
          }
          bannerImage
          season
          seasonYear
          description
          type
          format
          status
          episodes
          duration
          genres
          averageScore
          popularity
          studios {
            nodes {
              id
              name
              isAnimationStudio
            }
          }
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
        }
      }
    }
  `;

  // Get current season and year
  const now = new Date();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed
  const year = now.getFullYear();
  const season = getSeason(month);

  try {
    const response = await axios.post<AniListResponse>(
      ANILIST_API_URL,
      {
        query,
        variables: {
          page,
          perPage,
          season,
          seasonYear: year,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error fetching current season anime:', error);
    // Return empty data instead of throwing to prevent app crashes
    return {
      data: {
        Page: {
          media: [],
          pageInfo: {
            total: 0,
            currentPage: page,
            lastPage: 1,
            hasNextPage: false,
            perPage,
          },
        },
      },
    };
  }
};

/**
 * Fetches popular anime from AniList
 * @param page - The page number to fetch
 * @param perPage - Number of items per page
 * @returns Promise resolving to the API response
 */
export const fetchPopularAnime = async (
  page: number = 1,
  perPage: number = 10
): Promise<AniListResponse> => {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            extraLarge
            large
            medium
            color
          }
          bannerImage
          season
          seasonYear
          description
          type
          format
          status
          episodes
          duration
          genres
          averageScore
          popularity
          studios {
            nodes {
              id
              name
              isAnimationStudio
            }
          }
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post<AniListResponse>(
      ANILIST_API_URL,
      {
        query,
        variables: {
          page,
          perPage,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error fetching popular anime:', error);
    // Return empty data instead of throwing to prevent app crashes
    return {
      data: {
        Page: {
          media: [],
          pageInfo: {
            total: 0,
            currentPage: page,
            lastPage: 1,
            hasNextPage: false,
            perPage,
          },
        },
      },
    };
  }
};

/**
 * Fetches anime details by ID from AniList
 * @param id - The AniList ID of the anime
 * @returns Promise resolving to the anime details
 */
export const fetchAnimeDetails = async (id: number): Promise<AniListAnime | null> => {
  // Validate the ID before making the request
  if (!id || isNaN(id) || id <= 0) {
    console.error(`Invalid anime ID provided: ${id}`);
    return null;
  }

  console.log(`Fetching anime details for ID: ${id}`);
  
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          extraLarge
          large
          medium
          color
        }
        bannerImage
        season
        seasonYear
        description
        type
        format
        status
        episodes
        duration
        genres
        averageScore
        popularity
        studios {
          nodes {
            id
            name
            isAnimationStudio
          }
        }
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      ANILIST_API_URL,
      {
        query,
        variables: {
          id,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );

    // More detailed error logging
    if (!response.data) {
      console.error(`No response data for anime ID ${id}`);
      return null;
    }
    
    if (response.data.errors) {
      console.error(`GraphQL errors for anime ID ${id}:`, response.data.errors);
      return null;
    }
    
    if (!response.data.data || !response.data.data.Media) {
      console.error(`No Media data returned for anime ID ${id}`, response.data);
      return null;
    }

    console.log(`Successfully fetched anime details for ID ${id}`);
    return response.data.data.Media;
  } catch (error: any) {
    console.error(`Error fetching anime details for ID ${id}:`, error);
    // Log more details about the error
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
    } else if (error.request) {
      console.error('Error request:', error.request);
    }
    return null;
  }
};

/**
 * Searches for anime on AniList
 * @param query - The search query
 * @param page - The page number to fetch
 * @param perPage - Number of items per page
 * @param filters - Optional filters for format, status, and sort options
 * @returns Promise resolving to the API response
 */
export const searchAnime = async (
  searchQuery: string,
  page: number = 1,
  perPage: number = 10,
  filters?: {
    format?: string;
    status?: string;
    sort?: string;
    sortDirection?: 'DESC' | 'ASC';
  }
): Promise<AniListResponse> => {
  const query = `
    query ($page: Int, $perPage: Int, $search: String, $format: MediaFormat, $status: MediaStatus, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, search: $search, format: $format, status: $status, sort: $sort) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            extraLarge
            large
            medium
            color
          }
          bannerImage
          season
          seasonYear
          description
          type
          format
          status
          episodes
          duration
          genres
          averageScore
          popularity
          studios {
            nodes {
              id
              name
              isAnimationStudio
            }
          }
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
        }
      }
    }
  `;

  // Prepare sort parameter based on filters
  let sortParam = null;
  if (filters?.sort) {
    const direction = filters.sortDirection || 'DESC';
    sortParam = [`${filters.sort}_${direction}`];
  }

  // Log the filter values being sent to the API
  console.log('Search filters:', {
    format: filters?.format,
    status: filters?.status,
    sort: sortParam
  });

  try {
    const response = await axios.post<AniListResponse>(
      ANILIST_API_URL,
      {
        query,
        variables: {
          page,
          perPage,
          search: searchQuery,
          format: filters?.format,
          status: filters?.status,
          sort: sortParam,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error searching anime:', error);
    // Return empty data instead of throwing to prevent app crashes
    return {
      data: {
        Page: {
          media: [],
          pageInfo: {
            total: 0,
            currentPage: page,
            lastPage: 1,
            hasNextPage: false,
            perPage,
          },
        },
      },
    };
  }
};

// Helper function to determine current season
function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return 'SPRING';
  if (month >= 6 && month <= 8) return 'SUMMER';
  if (month >= 9 && month <= 11) return 'FALL';
  return 'WINTER';
}

/**
 * Fetches anime recommendations based on a given anime ID
 * @param animeId - The ID of the anime to get recommendations for
 * @param perPage - Number of recommendations to fetch
 * @returns Promise resolving to the API response
 */
export const fetchAnimeRecommendations = async (
  animeId: number,
  perPage: number = 10
): Promise<AniListResponse> => {
  // If no animeId is provided, return empty data
  if (!animeId) {
    console.warn('No anime ID provided for recommendations');
    return {
      data: {
        Page: {
          media: [],
          pageInfo: {
            total: 0,
            currentPage: 1,
            lastPage: 1,
            hasNextPage: false,
            perPage,
          },
        },
      },
    };
  }

  const query = `
    query ($id: Int, $perPage: Int) {
      Media(id: $id, type: ANIME) {
        id
        recommendations(perPage: $perPage, sort: RATING_DESC) {
          nodes {
            mediaRecommendation {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                extraLarge
                large
                medium
                color
              }
              bannerImage
              season
              seasonYear
              description
              type
              format
              status
              episodes
              duration
              genres
              averageScore
              popularity
              studios {
                nodes {
                  id
                  name
                  isAnimationStudio
                }
              }
              startDate {
                year
                month
                day
              }
              endDate {
                year
                month
                day
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      ANILIST_API_URL,
      {
        query,
        variables: {
          id: animeId,
          perPage,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );

    // Check if we have valid recommendations data
    if (
      response.data?.data?.Media?.recommendations?.nodes &&
      Array.isArray(response.data.data.Media.recommendations.nodes)
    ) {
      // Extract the recommended anime from the nodes
      const recommendedAnime = response.data.data.Media.recommendations.nodes
        .map(node => node.mediaRecommendation)
        .filter(Boolean); // Filter out any null values

      // Return in the expected format
      return {
        data: {
          Page: {
            media: recommendedAnime,
            pageInfo: {
              total: recommendedAnime.length,
              currentPage: 1,
              lastPage: 1,
              hasNextPage: false,
              perPage,
            },
          },
        },
      };
    } else {
      console.warn('No recommendations found or invalid response structure');
      return {
        data: {
          Page: {
            media: [],
            pageInfo: {
              total: 0,
              currentPage: 1,
              lastPage: 1,
              hasNextPage: false,
              perPage,
            },
          },
        },
      };
    }
  } catch (error: any) {
    console.error('Error fetching anime recommendations:', error);
    // Return empty data instead of throwing to prevent app crashes
    return {
      data: {
        Page: {
          media: [],
          pageInfo: {
            total: 0,
            currentPage: 1,
            lastPage: 1,
            hasNextPage: false,
            perPage,
          },
        },
      },
    };
  }
};

/**
 * Fetches upcoming anime (not yet aired) from AniList
 * @param page - The page number to fetch
 * @param perPage - Number of items per page
 * @returns Promise resolving to the API response
 */
export const fetchUpcomingAnime = async (
  page: number = 1,
  perPage: number = 10
): Promise<AniListResponse> => {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            extraLarge
            large
            medium
            color
          }
          bannerImage
          season
          seasonYear
          description
          type
          format
          status
          episodes
          duration
          genres
          averageScore
          popularity
          studios {
            nodes {
              id
              name
              isAnimationStudio
            }
          }
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post<AniListResponse>(
      ANILIST_API_URL,
      {
        query,
        variables: {
          page,
          perPage,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error fetching upcoming anime:', error);
    // Return empty data instead of throwing to prevent app crashes
    return {
      data: {
        Page: {
          media: [],
          pageInfo: {
            total: 0,
            currentPage: page,
            lastPage: 1,
            hasNextPage: false,
            perPage,
          },
        },
      },
    };
  }
};

/**
 * Fetches currently airing anime from AniList
 * @param page - The page number to fetch
 * @param perPage - Number of items per page
 * @returns Promise resolving to the API response
 */
export const fetchAiringAnime = async (
  page: number = 1,
  perPage: number = 10
): Promise<AniListResponse> => {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            extraLarge
            large
            medium
            color
          }
          bannerImage
          season
          seasonYear
          description
          type
          format
          status
          episodes
          duration
          genres
          averageScore
          popularity
          studios {
            nodes {
              id
              name
              isAnimationStudio
            }
          }
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post<AniListResponse>(
      ANILIST_API_URL,
      {
        query,
        variables: {
          page,
          perPage,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error fetching airing anime:', error);
    // Return empty data instead of throwing to prevent app crashes
    return {
      data: {
        Page: {
          media: [],
          pageInfo: {
            total: 0,
            currentPage: page,
            lastPage: 1,
            hasNextPage: false,
            perPage,
          },
        },
      },
    };
  }
};