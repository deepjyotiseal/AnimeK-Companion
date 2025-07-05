import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPopularAnime, fetchCurrentSeasonAnime } from '../api/anilistApi';
import { AniListAnime } from '../api/anilistApi';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useWatchlist } from '../hooks/useWatchlist';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type AnimeCardProps = {
  id: number;
  title: string;
  imageUrl: string;
  score: number | null;
  type?: string;
  episodes?: number | null;
  onPress: () => void;
};

const AnimeCard = ({ id, title, imageUrl, score, type, episodes, onPress }: AnimeCardProps) => {
  const { colors } = useTheme();
  const handlePress = () => {
    console.log('AnimeCard pressed, anime ID:', id);
    onPress();
  };

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={handlePress}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.cardMetaContainer}>
          {score && (
            <View style={styles.scoreContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[styles.scoreText, { color: colors.secondaryText }]}>{score.toFixed(1)}</Text>
            </View>
          )}
          {type && (
            <View style={styles.typeContainer}>
              <Text style={[styles.typeText, { color: colors.secondaryText }]}>{type}</Text>
            </View>
          )}
          {episodes && (
            <View style={styles.episodesContainer}>
              <Text style={[styles.episodesText, { color: colors.secondaryText }]}>{episodes} eps</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface SpotlightCarouselProps {
  data: AniListAnime[] | undefined;
  onAnimePress: (animeId: number) => void;
}

const SpotlightCarousel = ({ data, onAnimePress }: SpotlightCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<Animated.FlatList<AniListAnime> | null>(null);
  const { width } = Dimensions.get('window');
  const { colors } = useTheme();
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    const maxIndex = Math.min(data.length, 9) - 1;
    let autoScrollTimer: ReturnType<typeof setTimeout>;
    
    // Function to handle auto-scrolling
    const autoScroll = () => {
      // Always move forward, but loop back to the beginning after the last slide
      const nextIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
      
      if (flatListRef.current) {
        try {
          flatListRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
            viewPosition: 0
          });
          // Update the index after a small delay to ensure the scroll has started
          setTimeout(() => setCurrentIndex(nextIndex), 50);
        } catch (error) {
          console.error('Error scrolling to index:', error);
        }
      }
      
      // Schedule the next scroll
      autoScrollTimer = setTimeout(autoScroll, 3000);
    };
    
    // Start the auto-scroll after a delay
    autoScrollTimer = setTimeout(autoScroll, 3000);
    
    return () => {
      if (autoScrollTimer) clearTimeout(autoScrollTimer);
    };
  }, [currentIndex, data]);
  
  if (!data || data.length === 0) return null;
  
  return (
    <View style={styles.spotlightContainer}>
      <Animated.FlatList
        ref={flatListRef}
        data={data.slice(0, 9)} // Show only top 9 anime
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            // Attempt to scroll again but with a timeout
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true
            });
          });
        }}
        onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { 
              useNativeDriver: true,
              listener: (event: { nativeEvent: { contentOffset: { x: number } } }) => {
                const offset = event.nativeEvent.contentOffset.x;
                const maxIndex = Math.min(data.length, 9) - 1;
                const newIndex = Math.round(offset / width);
                
                // Simple index update with bounds checking
                if (newIndex !== currentIndex && newIndex >= 0 && newIndex <= maxIndex) {
                  setCurrentIndex(newIndex);
                }
              }
            }
          )}
        onMomentumScrollEnd={(event: { nativeEvent: { contentOffset: { x: number } } }) => {
            const offset = event.nativeEvent.contentOffset.x;
            const newIndex = Math.round(offset / width);
            const maxIndex = Math.min(data.length, 9) - 1;
            
            if (newIndex >= 0 && newIndex <= maxIndex) {
              setCurrentIndex(newIndex);
            }
          }}
        keyExtractor={(item: AniListAnime) => `spotlight_${item.id}`}
        renderItem={({ item, index }: { item: AniListAnime; index: number }) => {
          // Ensure item.id is a valid number
          const animeId = typeof item.id === 'number' ? item.id : parseInt(String(item.id), 10);
          console.log(`Rendering spotlight item for ID: ${animeId}, original ID: ${item.id}, type: ${typeof item.id}`);
          
          return (
            <View style={[styles.spotlightSlide, { width }]}>
              <Image 
                source={{ uri: item.coverImage.large }} 
                style={styles.spotlightImage} 
                resizeMode="cover"
              />
              <View style={styles.spotlightOverlay}>
                <View style={styles.spotlightContent}>
                  <Text style={[styles.spotlightLabel, { color: colors.primary }]}>#{index + 1} Top Anime</Text>
                  <Text style={styles.spotlightTitle}>{item.title.english || item.title.romaji}</Text>
                  <View style={styles.spotlightButtonContainer}>
                    <TouchableOpacity 
                      style={[styles.spotlightButton, { backgroundColor: colors.primary }]} 
                      onPress={() => {
                        console.log('Spotlight Add to watchlist pressed, anime ID:', animeId);
                        onAnimePress(animeId);
                      }}
                    >
                      <Text style={styles.spotlightButtonText}>Add to watchlist</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.spotlightButton, styles.detailButton]} 
                      onPress={() => {
                        console.log('Spotlight View Details pressed, anime ID:', animeId);
                        onAnimePress(animeId);
                      }}
                    >
                      <Text style={styles.detailButtonText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />
      
      {/* Pagination dots */}
      <View style={styles.paginationContainer}>
        {Array.from({ length: Math.min(data.length, 9) }).map((_, index) => {
          // Simple animation based on current index
          const isActive = index === currentIndex;
          
          return (
            <TouchableOpacity
              key={index}
              onPress={() => {
                if (flatListRef.current) {
                  flatListRef.current.scrollToIndex({
                    index,
                    animated: true
                  });
                  setCurrentIndex(index);
                }
              }}
              style={{ padding: 5 }} // Add padding for better touch target
            >
              <Animated.View
                style={[
                  styles.paginationDot,
                  isActive ? [styles.activeDot, { backgroundColor: colors.primary }] : styles.inactiveDot
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const HomeScreen = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { getAnimeStatus } = useWatchlist();
  const { colors } = useTheme();

  // Fetch current season anime for spotlight
  const {
    data: currentSeasonData,
    isLoading: isCurrentSeasonLoading,
    isError: isCurrentSeasonError,
    error: currentSeasonError,
    refetch: refetchCurrentSeason
  } = useQuery({
    queryKey: ['currentSeasonAnimeSpotlight'],
    queryFn: () => fetchCurrentSeasonAnime(1, 9),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch popular anime
  const { 
    data: popularAnimeData, 
    isLoading: isPopularLoading, 
    isError: isPopularError, 
    error: popularError, 
    refetch: refetchPopular 
  } = useQuery({
    queryKey: ['popularAnime'],
    queryFn: () => fetchPopularAnime(1, 10),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  });

  // We don't need handleLoadMore since we're showing fixed sections

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchCurrentSeason(),
        refetchPopular()
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchCurrentSeason, refetchPopular]);

  const handleAnimePress = useCallback((animeId: number) => {
    console.log('Navigating to anime with ID:', animeId);
    const status = getAnimeStatus(animeId);
    if (status) {
      // Use type assertion to tell TypeScript this is a valid navigation
      navigation.navigate('Main' as any, { screen: 'Watchlist', params: { initialTab: status } });
    } else {
      // Ensure animeId is a valid number before navigation
      if (typeof animeId === 'number' && !isNaN(animeId)) {
        console.log('Valid animeId, navigating to AnimeDetail:', animeId);
        navigation.navigate('AnimeDetail', { animeId });
      } else {
        console.error('Invalid animeId:', animeId);
        // Show an error message to the user
        Alert.alert('Error', 'Unable to load anime details. Invalid anime ID.');
      }
    }
  }, [getAnimeStatus, navigation]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.sectionTitle}>Popular Anime</Text>
    </View>
  );

  const renderSectionTitle = (title: string) => (
    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
  );

  const renderAnimeSection = (
    data: AniListAnime[] | undefined, 
    isLoading: boolean, 
    isError: boolean, 
    error: unknown, 
    title: string
  ) => {
    if (isLoading) {
      return (
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading {title.toLowerCase()}...</Text>
        </View>
      );
    }

    if (isError) {
      console.log(`Error in ${title}:`, error);
      return (
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <Ionicons name="alert-circle-outline" size={50} color={colors.primary} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Oops!</Text>
          <Text style={[styles.errorText, { color: colors.secondaryText }]}>
            {error instanceof Error ? error.message : `Failed to load ${title.toLowerCase()}`}
          </Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={handleRefresh}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!data || data.length === 0) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="alert-circle-outline" size={50} color={colors.secondaryText} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Anime Found</Text>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>Pull down to refresh and try again.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={data}
        renderItem={({ item }: { item: AniListAnime }) => {
          // Ensure item.id is a valid number
          const animeId = typeof item.id === 'number' ? item.id : parseInt(String(item.id), 10);
          console.log(`Rendering anime card for ID: ${animeId}, original ID: ${item.id}, type: ${typeof item.id}`);
          
          return (
            <AnimeCard
              id={animeId}
              title={item.title.english || item.title.romaji}
              imageUrl={item.coverImage.medium}
              score={item.averageScore ? item.averageScore / 10 : null}
              type={item.format || undefined}
              episodes={item.episodes}
              onPress={() => handleAnimePress(animeId)}
            />
          );
        }}
        keyExtractor={(item: AniListAnime) => `${title.replace(/\s+/g, '')}_${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <ScrollView 
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Current Season Anime Spotlight Carousel */}
        <SpotlightCarousel 
          data={currentSeasonData?.data?.Page?.media} 
          onAnimePress={handleAnimePress} 
        />
        
        {/* Popular Anime Section */}
        {renderSectionTitle('Popular Anime')}
        {renderAnimeSection(popularAnimeData?.data?.Page?.media, isPopularLoading, isPopularError, popularError, 'Popular Anime')}
        
        {/* Current Season Anime Section */}
        {renderSectionTitle('Current Season Anime')}
        {renderAnimeSection(currentSeasonData?.data?.Page?.media, isCurrentSeasonLoading, isCurrentSeasonError, currentSeasonError, 'Current Season Anime')}
      </ScrollView>
    </View>
  );
};

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - CARD_MARGIN * 6) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  spotlightContainer: {
    height: 400,
    position: 'relative',
    marginBottom: 16,
  },
  spotlightSlide: {
    height: 400,
    position: 'relative',
  },
  spotlightImage: {
    width: '100%',
    height: '100%',
  },
  spotlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  spotlightContent: {
    padding: 20,
    paddingBottom: 40,
  },
  spotlightLabel: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  spotlightTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  spotlightButtonContainer: {
    flexDirection: 'row',
  },
  spotlightButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginRight: 12,
  },
  spotlightButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  detailButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'white',
  },
  detailButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 10,
    right: 16,
    flexDirection: 'row',
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#FF0000',
    width: 10,
    height: 10,
    borderRadius: 5,
    transform: [{ scale: 1.1 }],
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    opacity: 0.7,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  list: {
    padding: CARD_MARGIN,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: CARD_WIDTH * 1.5,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  cardMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 2,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  scoreText: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  typeContainer: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  typeText: {
    fontSize: 10,
    color: '#666',
  },
  episodesContainer: {
    marginTop: 2,
  },
  episodesText: {
    fontSize: 10,
    color: '#888',
  },
  footer: {
    paddingVertical: 20,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FF0000',
    borderRadius: 25,
    elevation: 2,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});

export default HomeScreen;