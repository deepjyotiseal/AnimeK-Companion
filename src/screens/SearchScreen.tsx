import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Keyboard,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { searchAnime, AniListAnime } from '../api/anilistApi';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import debounce from 'lodash/debounce';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { useWatchlist } from '../hooks/useWatchlist';
import { useTheme } from '../contexts/ThemeContext';
import { getSearchHistory, addToSearchHistory, removeFromSearchHistory, clearSearchHistory } from '../utils/searchHistoryStorage';
import { isSearchHistoryEnabled } from '../utils/userSettingsStorage';

// AniList uses different format types and status values
type AnimeFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';
type AnimeStatus = 'RELEASING' | 'FINISHED' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';

interface Filters {
  format?: AnimeFormat;
  status?: AnimeStatus;
  sort?: 'TITLE' | 'START_DATE' | 'SCORE' | 'POPULARITY';
  sortDirection?: 'DESC' | 'ASC';
}

const SearchScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { getAnimeStatus } = useWatchlist();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['animeSearch', searchQuery, page, filters],
    queryFn: () => searchAnime(searchQuery, page, 25, filters),
    enabled: searchQuery.length >= 3,
  });

  // Load search history when component mounts if enabled
  useEffect(() => {
    const loadSearchHistory = async () => {
      const historyEnabled = await isSearchHistoryEnabled();
      if (historyEnabled) {
        const history = await getSearchHistory();
        setSearchHistory(history);
      } else {
        setSearchHistory([]);
      }
    };
    loadSearchHistory();
  }, []);

  const debouncedSearch = useCallback(
    debounce((text: string) => {
      // Don't convert to lowercase as AniList API handles case-insensitivity
      setSearchQuery(text);
      setPage(1);
      // We'll add to search history only when user submits the search, not while typing
    }, 500),
    []
  );
  
  const handleClearInput = () => {
    setInputValue('');
    setSearchQuery('');
    // Keep showing search history when input is cleared
    if (searchHistory.length > 0) {
      setShowHistory(true);
    }
  };
  
  const handleHistoryItemPress = async (item: string) => {
    setInputValue(item);
    // Don't convert to lowercase as AniList API handles case-insensitivity
    setSearchQuery(item);
    setShowHistory(false);
    Keyboard.dismiss();
    
    // Add to search history when selecting from history if enabled
    if (item.trim().length >= 3) {
      const historyEnabled = await isSearchHistoryEnabled();
      if (historyEnabled) {
        await addToSearchHistory(item);
        // Update local state after adding to storage
        const history = await getSearchHistory();
        setSearchHistory(history);
      }
    }
  };
  
  const handleSearchSubmit = async () => {
    // Add to search history only when user submits the search if enabled
    if (inputValue.trim().length >= 3) {
      const historyEnabled = await isSearchHistoryEnabled();
      if (historyEnabled) {
        await addToSearchHistory(inputValue);
        // Update local state after adding to storage
        const history = await getSearchHistory();
        setSearchHistory(history);
      }
      setShowHistory(false);
      Keyboard.dismiss();
    }
  };
  
  const handleRemoveHistoryItem = async (item: string) => {
    await removeFromSearchHistory(item);
    setSearchHistory(prev => prev.filter(i => i !== item));
  };
  
  const handleClearAllHistory = async () => {
    await clearSearchHistory();
    setSearchHistory([]);
  };

  const handleLoadMore = () => {
    if (data?.data?.Page?.pageInfo?.hasNextPage && !isFetching) {
      setPage((prev) => prev + 1);
    }
  };

  const handleAnimePress = async (animeId: number, animeTitle?: string) => {
    // If animeTitle is provided, add it to search history
    if (animeTitle && animeTitle.trim().length >= 3) {
      const historyEnabled = await isSearchHistoryEnabled();
      if (historyEnabled) {
        await addToSearchHistory(animeTitle);
        // Update local state after adding to storage
        const history = await getSearchHistory();
        setSearchHistory(history);
      }
    }
    
    const status = getAnimeStatus(animeId);
    if (status) {
      navigation.navigate('Main' as any, { screen: 'Watchlist', params: { initialTab: status } });
    } else {
      navigation.navigate('AnimeDetail', { animeId });
    }
  };

  const renderAnimeItem = ({ item }: { item: AniListAnime }) => (
    <Animated.View
      entering={FadeIn}
      layout={Layout.springify()}
      style={[styles.animeCard, { backgroundColor: colors.card }]}
    >
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => handleAnimePress(item.id, item.title.english || item.title.romaji)}
      >
        <Image
          source={{ uri: item.coverImage.medium }}
          style={styles.animeImage}
        />
        <View style={styles.animeInfo}>
          <Text style={[styles.animeTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title.english || item.title.romaji}
          </Text>
          <Text style={[styles.animeType, { color: colors.secondaryText }]}>
            {item.format} • {item.status}
          </Text>
          {item.averageScore && (
            <View style={styles.scoreContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.scoreText, { color: colors.secondaryText }]}>{(item.averageScore / 10).toFixed(1)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const handleCloseFilters = useCallback(() => {
    setShowFilters(false);
  }, []);
  
  const handleApplyFilters = useCallback(() => {
    setShowFilters(false);
    setPage(1);
    refetch();
  }, [refetch]);
  
  const handleResetFilters = useCallback(() => {
    setFilters({});
    setPage(1);
    refetch();
  }, [refetch]);

  const FiltersModal = useMemo(() => {
    return () => (
      <Modal
        visible={showFilters}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCloseFilters}
      >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Filters</Text>
            <TouchableOpacity
              onPress={handleCloseFilters}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Format</Text>
          <View style={styles.filterOptions}>
            {[
              { key: 'TV', label: 'TV' },
              { key: 'MOVIE', label: 'Movie' },
              { key: 'OVA', label: 'OVA' },
              { key: 'SPECIAL', label: 'Special' },
              { key: 'ONA', label: 'ONA' }
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  filters.format === key && styles.filterChipActive,
                ]}
                onPress={() =>
                  setFilters((prev) => ({
                    ...prev,
                    format: prev.format === key ? undefined : (key as AnimeFormat),
                  }))
                }
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.format === key && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Status</Text>
          <View style={styles.filterOptions}>
            {[
              { key: 'RELEASING', label: 'Airing' },
              { key: 'FINISHED', label: 'Completed' },
              { key: 'NOT_YET_RELEASED', label: 'Upcoming' }
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  filters.status === key && styles.filterChipActive,
                ]}
                onPress={() =>
                  setFilters((prev) => ({
                    ...prev,
                    status: prev.status === key
                      ? undefined
                      : (key as AnimeStatus),
                  }))
                }
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.status === key && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Sort By</Text>
          <View style={styles.filterOptions}>
            {[
              { key: 'TITLE', label: 'Title' },
              { key: 'SCORE', label: 'Rating' },
              { key: 'START_DATE', label: 'Date' },
              { key: 'POPULARITY', label: 'Popularity' },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  filters.sort === key && styles.filterChipActive,
                ]}
                onPress={() =>
                  setFilters((prev) => ({
                    ...prev,
                    sort: prev.sort === key ? undefined : key as any,
                    sortDirection: prev.sort === key && prev.sortDirection === 'ASC' ? 'DESC' : 'ASC',
                  }))
                }
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.sort === key && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                  {filters.sort === key && (
                    <Ionicons
                      name={filters.sortDirection === 'ASC' ? 'arrow-up' : 'arrow-down'}
                      size={12}
                      color={filters.sort === key ? '#fff' : '#666'}
                    />
                  )}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: colors.card }]}
              onPress={handleResetFilters}
            >
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApplyFilters}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    );
  }, [showFilters, colors, filters, handleCloseFilters, handleResetFilters, handleApplyFilters]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchHeader, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.secondaryText} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search anime..."
            placeholderTextColor={colors.secondaryText}
            value={inputValue}
            onChangeText={(text) => {
              setInputValue(text);
              debouncedSearch(text);
              setShowHistory(text.length > 0);
            }}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
            onFocus={() => {
              // Show search history when input is focused, regardless of whether there's text
              if (searchHistory.length > 0) {
                setShowHistory(true);
              }
            }}
          />
          {inputValue.length > 0 && (
            <TouchableOpacity onPress={handleClearInput} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color={colors.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="filter"
            size={24}
            color={Object.keys(filters).length > 0 ? colors.primary : colors.secondaryText}
          />
        </TouchableOpacity>
      </View>
      
      {showHistory && searchHistory.length > 0 && (
        <View style={[styles.historyContainer, { backgroundColor: colors.card }]}>
          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, { color: colors.text }]}>Recent Searches</Text>
            <TouchableOpacity onPress={handleClearAllHistory}>
              <Text style={[styles.clearHistoryText, { color: colors.primary }]}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={searchHistory}
            keyExtractor={(item, index) => `history-${index}`}
            renderItem={({ item }) => (
              <View style={[styles.historyItem, { borderBottomColor: colors.border }]}>
                <TouchableOpacity 
                  style={styles.historyItemContent}
                  onPress={() => handleHistoryItemPress(item)}
                >
                  <Ionicons name="time-outline" size={16} color={colors.secondaryText} style={styles.historyIcon} />
                  <Text style={[styles.historyText, { color: colors.text }]} numberOfLines={1}>{item}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveHistoryItem(item)}>
                  <Ionicons name="close" size={18} color={colors.secondaryText} />
                </TouchableOpacity>
              </View>
            )}
            style={styles.historyList}
          />
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : !searchQuery ? (
        <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
          <Ionicons name="search" size={48} color={colors.secondaryText} />
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Search for your favorite anime
          </Text>
        </View>
      ) : data?.data?.Page?.media?.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.secondaryText} />
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            No results found
          </Text>
        </View>
      ) : (
        <FlatList
          data={data?.data?.Page?.media}
          renderItem={renderAnimeItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetching ? (
              <ActivityIndicator style={styles.footerLoader} color={colors.primary} />
            ) : null
          }
        />
      )}

      <FiltersModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor is now applied dynamically
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    // borderBottomColor is now applied dynamically
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    padding: 8,
  },
  historyContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    maxHeight: 250,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  clearHistoryText: {
    fontSize: 14,
    color: '#FF0000',
  },
  historyList: {
    maxHeight: 200,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  historyItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    marginRight: 8,
  },
  historyText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  list: {
    padding: 12,
  },
  animeCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  animeImage: {
    width: 100,
    height: 150,
    borderRadius: 4,
  },
  animeInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  animeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  animeType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
    position: 'relative',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  filterChip: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: '#FF0000',
  },
  filterChipText: {
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  resetButton: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  resetButtonText: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
  applyButton: {
    padding: 16,
    backgroundColor: '#FF0000',
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default SearchScreen;