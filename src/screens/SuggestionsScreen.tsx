import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchSeasonalAnime, 
  fetchTopAnime, 
  fetchAnimeByGenre
} from '../api/jikanApi';
import {
  searchAnime,
  fetchUpcomingAnime,
  fetchAiringAnime,
  fetchPopularAnime,
  fetchAnimeRecommendations
} from '../api/anilistApi';
import { useWatchlist } from '../hooks/useWatchlist';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const AnimeCard = ({ anime, onPress }) => {
  const { colors } = useTheme();
  if (!anime) {
    console.warn('AnimeCard received undefined anime data');
    return null;
  }

  // Handle the case where the anime data might be in different structures
  const entry = anime.entry || anime;
  
  // Safely extract image URL with fallbacks
  let imageUrl = 'https://via.placeholder.com/150x200?text=No+Image';
  try {
    // Handle AniList API structure
    if (anime?.coverImage?.large || anime?.coverImage?.medium) {
      imageUrl = anime.coverImage.large || anime.coverImage.medium;
    }
    // Handle Jikan API structure
    else if (anime?.images?.jpg?.image_url) {
      imageUrl = anime.images.jpg.image_url;
    } else if (entry?.images?.jpg?.image_url) {
      imageUrl = entry.images.jpg.image_url;
    } else if (anime?.image_url) {
      // Some older API responses might have direct image_url
      imageUrl = anime.image_url;
    } else if (entry?.image_url) {
      imageUrl = entry.image_url;
    }
  } catch (error) {
    console.warn('Error extracting image URL:', error);
    // Keep the default placeholder image
  }
  
  // Get title from either AniList or Jikan API structure with fallback
  let title = 'Unknown Title';
  try {
    // AniList title structure
    if (anime?.title?.romaji || anime?.title?.english || anime?.title?.native) {
      title = anime.title.romaji || anime.title.english || anime.title.native;
    }
    // Jikan title structure
    else if (anime.title || entry.title) {
      title = anime.title || entry.title;
    }
  } catch (error) {
    console.warn('Error extracting title:', error);
    // Keep the default title
  }
  
  // Safely extract score with fallback
  let score = null;
  let formattedScore = null;
  try {
    // AniList score structure (out of 100)
    if (anime?.averageScore) {
      score = anime.averageScore / 10; // Convert to scale of 10
    }
    // Jikan score structure (already out of 10)
    else if (anime.score || entry.score) {
      score = anime.score || entry.score;
    }
    
    if (score && typeof score === 'number') {
      formattedScore = score.toFixed(1);
    }
  } catch (error) {
    console.warn('Error formatting score:', error);
    // Keep score as null
  }
  
  return (
    <TouchableOpacity 
      style={[styles.animeCard, { backgroundColor: colors.card }]} 
      onPress={onPress}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.animeImage}
        // We can't use defaultSource with SVG, so we'll handle errors in the source URI
        onError={() => {
          console.log('Image failed to load, using placeholder');
          // The placeholder is already set as fallback in the imageUrl
        }}
      />
      <View style={styles.cardContent}>
        <Text style={[styles.animeTitle, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        {formattedScore && (
          <View style={styles.scoreContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={[styles.scoreText, { color: colors.secondaryText }]}>{formattedScore}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const SuggestionsScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { items } = useWatchlist();
  const { getAnimeStatus } = useWatchlist();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);

  // Get a random watched anime ID for recommendations
  const randomWatchedAnimeId = useMemo(() => {
    const watchedItems = items.filter(item => item.status === 'Completed');
    if (watchedItems.length === 0) return null;
    return watchedItems[Math.floor(Math.random() * watchedItems.length)].animeId;
  }, [items]);

  // Common query options for all anime fetching queries
  const commonQueryOptions = {
    retry: 3,           // Retry failed requests 3 times
    retryDelay: 1000,   // Wait 1 second between retries
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  };
  
  // Stagger initial data loading to prevent rate limiting
  const [loadPriority1, setLoadPriority1] = React.useState(true);
  const [loadPriority2, setLoadPriority2] = React.useState(false);
  const [loadPriority3, setLoadPriority3] = React.useState(false);
  
  // Enable subsequent query groups after delays
  React.useEffect(() => {
    // Enable priority 2 queries after a delay
    const timer1 = setTimeout(() => setLoadPriority2(true), 1000);
    // Enable priority 3 queries after a longer delay
    const timer2 = setTimeout(() => setLoadPriority3(true), 2000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Priority 1 queries (load immediately)
  // Fetch seasonal anime
  const { 
    data: seasonalAnime, 
    isLoading: loadingSeasonal,
    refetch: refetchSeasonal,
    error: seasonalError
  } = useQuery({
    queryKey: ['seasonal'],
    queryFn: () => fetchSeasonalAnime(1, 10),
    enabled: loadPriority1,
    ...commonQueryOptions,
  });

  // Fetch top rated anime
  const { 
    data: topAnime, 
    isLoading: loadingTop,
    refetch: refetchTop,
    error: topError
  } = useQuery({
    queryKey: ['top-anime'],
    queryFn: () => fetchTopAnime(1, 10),
    enabled: loadPriority1,
    ...commonQueryOptions,
  });

  // Priority 2 queries (load after a delay)
  // Fetch recommendations based on a watched anime from AniList
  const { 
    data: recommendations,
    isLoading: loadingRecommendations,
    refetch: refetchRecommendations,
    error: recommendationsError
  } = useQuery({
    queryKey: ['recommendations-anilist', randomWatchedAnimeId],
    queryFn: async () => {
      if (!randomWatchedAnimeId) {
        return { data: { Page: { media: [] } } };
      }
      
      try {
        // First, we need to search for the anime in AniList to get its AniList ID
        const searchResult = await searchAnime(items.find(item => item.animeId === randomWatchedAnimeId)?.title || '', 1, 1);
        
        if (searchResult?.data?.Page?.media && searchResult.data.Page.media.length > 0) {
          // Found matching anime in AniList
          const anilistId = searchResult.data.Page.media[0].id;
          console.log(`Found AniList ID ${anilistId} for watched anime ID ${randomWatchedAnimeId}`);
          
          // Now fetch recommendations using the AniList ID
          const result = await fetchAnimeRecommendations(anilistId, 10);
          
          // Log the structure of the first item for debugging
          if (result.data?.Page?.media && result.data.Page.media.length > 0) {
            console.log('Recommendation data structure sample:', 
              JSON.stringify(result.data.Page.media[0], null, 2));
          }
          
          return result;
        } else {
          console.warn(`Could not find AniList ID for watched anime ID ${randomWatchedAnimeId}`);
          return { data: { Page: { media: [] } } };
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        // Return empty data instead of throwing to prevent app crashes
        return { data: { Page: { media: [] } } };
      }
    },
    enabled: !!randomWatchedAnimeId && loadPriority2,
    ...commonQueryOptions,
  });

  // Fetch upcoming anime from AniList
  const {
    data: upcomingAnime,
    isLoading: loadingUpcoming,
    refetch: refetchUpcoming,
    error: upcomingError
  } = useQuery({
    queryKey: ['upcoming-anime-anilist'],
    queryFn: () => fetchUpcomingAnime(1, 10),
    enabled: loadPriority2,
    ...commonQueryOptions,
  });

  // Priority 3 queries (load after a longer delay)
  // Fetch currently airing anime from AniList
  const {
    data: airingAnime,
    isLoading: loadingAiring,
    refetch: refetchAiring,
    error: airingError
  } = useQuery({
    queryKey: ['airing-anime-anilist'],
    queryFn: () => fetchAiringAnime(1, 10),
    enabled: loadPriority3,
    ...commonQueryOptions,
  });

  // Fetch popular anime from AniList (priority 2)
  const {
    data: popularAnime,
    isLoading: loadingPopular,
    refetch: refetchPopular,
    error: popularError
  } = useQuery({
    queryKey: ['popular-anime-anilist'],
    queryFn: () => fetchPopularAnime(1, 10),
    enabled: loadPriority2,
    ...commonQueryOptions,
  });

  // Fetch action anime (genre ID 1) (priority 3)
  const {
    data: actionAnime,
    isLoading: loadingAction,
    refetch: refetchAction,
    error: actionError
  } = useQuery({
    queryKey: ['action-anime'],
    queryFn: () => fetchAnimeByGenre(1, 1, 10), // Action genre ID is 1
    enabled: loadPriority3,
    ...commonQueryOptions,
  });

  // Fetch romance anime (genre ID 22) (priority 3)
  const {
    data: romanceAnime,
    isLoading: loadingRomance,
    refetch: refetchRomance,
    error: romanceError
  } = useQuery({
    queryKey: ['romance-anime'],
    queryFn: () => fetchAnimeByGenre(22, 1, 10), // Romance genre ID is 22
    enabled: loadPriority3,
    ...commonQueryOptions,
  });

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Define all queries to be refreshed
      const queries = [
        { name: 'seasonal', refetch: refetchSeasonal },
        { name: 'top', refetch: refetchTop },
        ...(randomWatchedAnimeId ? [{ name: 'recommendations', refetch: refetchRecommendations }] : []),
        { name: 'upcoming', refetch: refetchUpcoming },
        { name: 'airing', refetch: refetchAiring },
        { name: 'popular', refetch: refetchPopular },
        { name: 'action', refetch: refetchAction },
        { name: 'romance', refetch: refetchRomance }
      ];
      
      // Refresh queries sequentially to avoid rate limiting
      for (const query of queries) {
        try {
          await query.refetch();
          // Small delay between requests to help prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error refreshing ${query.name} data:`, error);
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [
    refetchSeasonal, 
    refetchTop, 
    refetchRecommendations, 
    randomWatchedAnimeId,
    refetchUpcoming,
    refetchAiring,
    refetchPopular,
    refetchAction,
    refetchRomance
  ]);

  const handleAnimePress = async (animeId: number, animeTitle: string, isAniList: boolean = false) => {
    console.log(`Handling press for anime with ID: ${animeId}, title: ${animeTitle}, isAniList: ${isAniList}`);
    
    // First check if this anime is in the watchlist
    const status = getAnimeStatus(animeId);
    if (status) {
      console.log(`Anime is in watchlist with status: ${status}`);
      navigation.navigate('Main', { screen: 'Watchlist', params: { initialTab: status } });
      return;
    }
    
    try {
      // If it's already an AniList ID, use it directly
      if (isAniList) {
        console.log(`Using direct AniList ID: ${animeId}`);
        navigation.navigate('AnimeDetail', { animeId });
        return;
      }
      
      // Otherwise, we need to convert the MAL ID to an AniList ID by searching for the anime by title
      console.log(`Searching for anime in AniList by title: ${animeTitle}`);
      
      // Search for the anime by title in AniList
      const searchResult = await searchAnime(animeTitle, 1, 5);
      
      if (searchResult?.data?.Page?.media && searchResult.data.Page.media.length > 0) {
        // Found matching anime in AniList
        const anilistAnime = searchResult.data.Page.media[0]; // Take the first match
        const anilistId = anilistAnime.id;
        
        console.log(`Found matching anime in AniList: ID=${anilistId}, Title=${anilistAnime.title.romaji || anilistAnime.title.english}`);
        
        // Navigate to anime detail with the AniList ID
        navigation.navigate('AnimeDetail', { animeId: anilistId });
      } else {
        // No matching anime found in AniList, fallback to using MAL ID
        console.warn(`No matching anime found in AniList for "${animeTitle}". Using ID ${animeId} as fallback.`);
        navigation.navigate('AnimeDetail', { animeId });
      }
    } catch (error) {
      console.error('Error navigating to anime details:', error);
      
      // Fallback to using the original ID directly
      console.warn(`Error searching AniList. Using ID ${animeId} as fallback.`);
      navigation.navigate('AnimeDetail', { animeId });
      
      // Show error alert only if navigation fails
      Alert.alert(
        'Warning',
        'Some anime details may not load correctly. We are working on a fix.',
        [{ text: 'OK' }]
      );
    }
  };

  // Log errors for debugging purposes
  React.useEffect(() => {
    const errors = {
      seasonal: seasonalError,
      top: topError,
      recommendations: recommendationsError,
      upcoming: upcomingError,
      airing: airingError,
      popular: popularError,
      action: actionError,
      romance: romanceError
    };
    
    // Log any errors that exist
    Object.entries(errors).forEach(([category, error]) => {
      if (error) {
        console.error(`Error in ${category} category:`, error);
      }
    });
  }, [
    seasonalError, topError, recommendationsError,
    upcomingError, airingError, popularError,
    actionError, romanceError
  ]);

  // Check if we have any data to display
  const hasAnyData = (
    (seasonalAnime?.data && seasonalAnime.data.length > 0) ||
    (recommendations?.data?.Page?.media && recommendations.data.Page.media.length > 0) ||
    (topAnime?.data && topAnime.data.length > 0) ||
    (upcomingAnime?.data?.Page?.media && upcomingAnime.data.Page.media.length > 0) ||
    (airingAnime?.data?.Page?.media && airingAnime.data.Page.media.length > 0) ||
    (popularAnime?.data?.Page?.media && popularAnime.data.Page.media.length > 0) ||
    (actionAnime?.data && actionAnime.data.length > 0) ||
    (romanceAnime?.data && romanceAnime.data.length > 0)
  );

  // Check if all queries are in error state
  const allErrors = (
    seasonalError && topError && recommendationsError && 
    upcomingError && airingError && popularError && 
    actionError && romanceError
  );

  // Count how many categories failed to load
  const errorCount = [
    seasonalError, topError, recommendationsError,
    upcomingError, airingError, popularError,
    actionError, romanceError
  ].filter(Boolean).length;

  // Calculate loading state based on which priority group is currently loading
  const priority1Loading = loadPriority1 && (loadingSeasonal || loadingTop);
  const priority2Loading = loadPriority2 && (loadingRecommendations || loadingUpcoming || loadingPopular);
  const priority3Loading = loadPriority3 && (loadingAiring || loadingAction || loadingRomance);
  
  // Determine overall loading state and message
  const isLoading = priority1Loading || priority2Loading || priority3Loading;
  let loadingMessage = "Loading recommendations...";
  
  if (priority1Loading) {
    loadingMessage = "Loading essential anime data...";
  } else if (priority2Loading) {
    loadingMessage = "Loading additional recommendations...";
  } else if (priority3Loading) {
    loadingMessage = "Loading genre-specific anime...";
  }
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>{loadingMessage}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {!hasAnyData && (
        <View style={[styles.emptyStateContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="cloud-offline" size={50} color={colors.secondaryText} />
          {allErrors ? (
            <>
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Connection Error</Text>
              <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>
                Unable to connect to the anime database. Please check your internet connection and try again.
              </Text>
            </>
          ) : errorCount > 0 ? (
            <>
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Some Content Unavailable</Text>
              <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>
                {errorCount} out of 8 categories couldn't be loaded. This might be due to temporary API limitations or network issues.
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Anime Available</Text>
              <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>
                We couldn't load any anime at the moment. Please check your internet connection and try again.
              </Text>
            </>
          )}
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]} 
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
      {seasonalAnime?.data && seasonalAnime.data.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Picks This Season</Text>
            <Ionicons name="flame" size={24} color={colors.primary} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {seasonalAnime.data.map((anime, index) => (
              <AnimeCard
                key={`seasonal-${index}-${anime.mal_id}`}
                anime={anime}
                onPress={() => handleAnimePress(anime.mal_id, anime.title)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {recommendations?.data?.Page?.media && recommendations.data.Page.media.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Because You Watched</Text>
            <Ionicons name="heart" size={24} color={colors.primary} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recommendations.data.Page.media.map((anime, index) => (
              <AnimeCard
                key={`recommendation-${index}-${anime.id}`}
                anime={anime}
                onPress={() => handleAnimePress(anime.id, anime.title?.romaji || anime.title?.english || '', true)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {topAnime?.data && topAnime.data.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>All-Time Favorites</Text>
            <Ionicons name="star" size={24} color={colors.primary} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {topAnime.data.map((anime, index) => (
              <AnimeCard
                key={`top-${index}-${anime.mal_id}`}
                anime={anime}
                onPress={() => handleAnimePress(anime.mal_id, anime.title)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {upcomingAnime?.data?.Page?.media && upcomingAnime.data.Page.media.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Coming Soon</Text>
            <Ionicons name="calendar" size={24} color={colors.primary} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {upcomingAnime.data.Page.media.map((anime, index) => (
              <AnimeCard
                key={`upcoming-${index}-${anime.id}`}
                anime={anime}
                onPress={() => handleAnimePress(anime.id, anime.title?.romaji || anime.title?.english || '', true)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {airingAnime?.data?.Page?.media && airingAnime.data.Page.media.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Currently Airing</Text>
            <Ionicons name="play" size={24} color={colors.primary} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {airingAnime.data.Page.media.map((anime, index) => (
              <AnimeCard
                key={`airing-${index}-${anime.id}`}
                anime={anime}
                onPress={() => handleAnimePress(anime.id, anime.title?.romaji || anime.title?.english || '', true)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {popularAnime?.data?.Page?.media && popularAnime.data.Page.media.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Most Popular</Text>
            <Ionicons name="trending-up" size={24} color={colors.primary} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {popularAnime.data.Page.media.map((anime, index) => (
              <AnimeCard
                key={`popular-${index}-${anime.id}`}
                anime={anime}
                onPress={() => handleAnimePress(anime.id, anime.title?.romaji || anime.title?.english || '', true)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {actionAnime?.data && actionAnime.data.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Action Anime</Text>
            <Ionicons name="flash" size={24} color={colors.primary} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {actionAnime.data.map((anime, index) => (
              <AnimeCard
                key={`action-${index}-${anime.mal_id}`}
                anime={anime}
                onPress={() => handleAnimePress(anime.mal_id, anime.title)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {romanceAnime?.data && romanceAnime.data.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Romance Anime</Text>
            <Ionicons name="heart-circle" size={24} color={colors.primary} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {romanceAnime.data.map((anime, index) => (
              <AnimeCard
                key={`romance-${index}-${anime.mal_id}`}
                anime={anime}
                onPress={() => handleAnimePress(anime.mal_id, anime.title)}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor is now applied dynamically
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
    // color is now applied dynamically
  },
  animeCard: {
    width: 150,
    marginRight: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // backgroundColor is now applied dynamically
  },
  animeImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cardContent: {
    padding: 8,
  },
  animeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    // color is now applied dynamically
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    marginLeft: 4,
    fontSize: 12,
    // color is now applied dynamically
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 8,
    // backgroundColor is now applied dynamically
  },
  emptyText: {
    textAlign: 'center',
    // color is now applied dynamically
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    marginHorizontal: 20,
    borderRadius: 12,
    elevation: 1,
    // backgroundColor is now applied dynamically
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    // color is now applied dynamically
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    // color is now applied dynamically
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 2,
    // backgroundColor is now applied dynamically
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SuggestionsScreen;
