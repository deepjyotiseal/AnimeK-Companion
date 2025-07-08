import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchAnimeDetails } from '../api/anilistApi';
import { fetchAnimeReviews } from '../api/jikanApi';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { getErrorMessage } from '../utils/errorHandlers';
import { stripHtmlTags } from '../utils/textFormatters';
import type { WatchStatus } from '../contexts/WatchlistContext';

type AnimeDetailRouteProp = RouteProp<RootStackParamList, 'AnimeDetail'>;
type AnimeDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// No longer using Jikan API reviews, will use AniList data instead

const WATCH_STATUSES: WatchStatus[] = [
  'Watching',
  'Plan to Watch',
  'Completed',
  'On Hold',
  'Dropped',
  'Favorite',
];

const AnimeDetailScreen = () => {
  const navigation = useNavigation<AnimeDetailScreenNavigationProp>();
  const route = useRoute<AnimeDetailRouteProp>();
  const { animeId, initialTab } = route.params || {};
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>(initialTab === 'reviews' ? 'reviews' : 'info');
  const { user } = useAuth();
  const { addToWatchlist, updateWatchlistItem, removeFromWatchlist, getAnimeStatus, getItemByAnimeId, items } = useWatchlist();
  const { showToast, showDialog } = useNotification();
  const { colors } = useTheme();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<WatchStatus | null>(null);

  const { data: anime, isLoading: isLoadingInfo, isError } = useQuery({
    queryKey: ['animeDetail', animeId],
    queryFn: () => fetchAnimeDetails(animeId),
    enabled: !!animeId,
  });
  
  // Fetch reviews from Jikan API
  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['animeReviews', animeId],
    queryFn: () => fetchAnimeReviews(animeId),
    enabled: !!animeId && activeTab === 'reviews',
  });

  // Update currentStatus whenever anime data or watchlist items change
  useEffect(() => {
    if (anime && anime.id) {
      const status = getAnimeStatus(anime.id);
      setCurrentStatus(status);
    }
  }, [anime, items, getAnimeStatus]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${anime?.title?.english || anime?.title?.romaji} on AniList!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleStatusSelect = async (status: WatchStatus) => {
    if (!user) {
      showDialog({
        title: 'Login Required',
        message: 'Please login to manage your watchlist',
        type: 'info',
        confirmText: 'OK',
      });
      return;
    }
    if (!anime) return;

    setUpdating(true);
    try {
      const watchlistItem = getItemByAnimeId(anime.id);
      const imageUrl = anime.coverImage?.medium || 
                      anime.coverImage?.large || 
                      ''; // Fallback to empty string if no image available

      if (currentStatus && watchlistItem) {
        if (status === currentStatus) {
          await removeFromWatchlist(watchlistItem.id);
          showToast({
            message: `Removed ${anime.title.english || anime.title.romaji} from your watchlist`,
            type: 'success',
          });
        } else {
          await updateWatchlistItem(watchlistItem.id, { status: status });
          showToast({
            message: `Updated ${anime.title.english || anime.title.romaji} to ${status}`,
            type: 'success',
          });
        }
      } else if (!currentStatus) {
        await addToWatchlist(
          anime.id,
          anime.title.english || anime.title.romaji,
          imageUrl,
          status
        );
        showToast({
          message: `Added ${anime.title.english || anime.title.romaji} to your ${status} list`,
          type: 'success',
        });
      }
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating watchlist:', error);
      showToast({
        message: getErrorMessage(error) || 'Failed to update watchlist',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setUpdating(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'reviews':
        return (
          <View style={[styles.tabContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Reviews</Text>
            {isLoadingReviews ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.loadingIndicator} />
            ) : !reviewsData?.data || reviewsData.data.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
                <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No reviews available yet</Text>
              </View>
            ) : (
              <FlatList
                data={reviewsData.data}
                keyExtractor={(item, index) => `review-${item.mal_id || index}`}
                renderItem={({ item }) => (
                  <View style={[styles.reviewItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <View style={styles.reviewHeader}>
                      <Text style={[styles.reviewerName, { color: colors.text }]}>{item.user?.username || 'Anonymous'}</Text>
                      <Text style={[styles.reviewScore, { color: colors.primary }]}>★ {item.score || 'N/A'}</Text>
                    </View>
                    <Text style={[styles.reviewContent, { color: colors.secondaryText }]}>{stripHtmlTags(item.review)}</Text>
                  </View>
                )}
                contentContainerStyle={styles.reviewsList}
              />
            )}
          </View>
        );
      default:
        return (
          <View style={styles.content}>
            {anime ? (
              <>
                <Text style={[styles.title, { color: colors.text }]}>{anime.title.english || anime.title.romaji}</Text>
                {anime.title.native && (
                  <Text style={[styles.japaneseTitle, { color: colors.secondaryText }]}>{anime.title.native}</Text>
                )}

                <View style={styles.statsRow}>
                  {anime.averageScore && (
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.primary }]}>★ {(anime.averageScore / 10).toFixed(1)}</Text>
                      <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Rating</Text>
                    </View>
                  )}
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>{anime.status}</Text>
                    <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Status</Text>
                  </View>
                  {anime.episodes && (
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.primary }]}>{anime.episodes}</Text>
                      <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Episodes</Text>
                    </View>
                  )}
                </View>

                <View style={styles.actionButtons}>
                  {user ? (
                    <TouchableOpacity
                      style={[styles.button, styles.watchlistButton, { backgroundColor: colors.primary }]}
                      onPress={() => setShowStatusModal(true)}
                    >
                      <Ionicons
                        name={currentStatus ? 'checkmark-circle' : 'add-circle-outline'}
                        size={20}
                        color={colors.buttonText}
                      />
                      <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                        {currentStatus ? currentStatus : 'Add to Watchlist'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.button, styles.watchlistButton, { backgroundColor: colors.primary }]}
                      onPress={() => navigation.navigate('Auth')}
                    >
                      <Ionicons name="log-in" size={18} color={colors.buttonText} />
                      <Text style={[styles.buttonText, { color: colors.buttonText }]}>Login to Add</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.iconButtons}>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.shareButton, { borderColor: colors.primary }]}
                      onPress={handleShare}
                    >
                      <Ionicons name="share-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {anime.genres && anime.genres.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Genres</Text>
                    <View style={styles.genreContainer}>
                      {anime.genres.map((genre, index) => (
                        <View key={`genre-${index}`} style={[styles.genreTag, { backgroundColor: colors.cardLight }]}>
                          <Text style={[styles.genreText, { color: colors.primary }]}>{genre}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {anime.description && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Synopsis</Text>
                    <Text style={[styles.synopsis, { color: colors.text }]}>{stripHtmlTags(anime.description)}</Text>
                  </View>
                )}

                {anime.studios && anime.studios.nodes && anime.studios.nodes.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Studios</Text>
                    <Text style={[styles.studioText, { color: colors.text }]}>
                      {anime.studios.nodes.map(studio => studio.name).join(', ')}
                    </Text>
                  </View>
                )}
              </>
            ) : null}
          </View>
        );
    }
  };

  // Show a full-screen loading spinner when anime details are loading
  if (isLoadingInfo) {
    return (
      <View style={[styles.fullScreenLoading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading anime details...</Text>
      </View>
    );
  }
  
  // Show error state if there's an error or no anime data
  if (isError || !anime) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={50} color={colors.primary} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Oops!</Text>
        <Text style={[styles.errorText, { color: colors.secondaryText }]}>Failed to load anime details</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: anime?.coverImage?.large || anime?.coverImage?.medium }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        </View>
        
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, { color: colors.secondaryText }, activeTab === 'info' && { color: colors.primary, fontWeight: 'bold' }]}>Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, { color: colors.secondaryText }, activeTab === 'reviews' && { color: colors.primary, fontWeight: 'bold' }]}>Reviews</Text>
          </TouchableOpacity>
        </View>

        {renderTabContent()}
      </ScrollView>

      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Update Watch Status</Text>
            {WATCH_STATUSES.map((status, index) => (
              <TouchableOpacity
                key={`${status}-${index}`}
                style={[
                  styles.statusOption,
                  { backgroundColor: colors.cardLight },
                  currentStatus === status && [styles.statusOptionActive, { backgroundColor: colors.primary }],
                ]}
                onPress={() => handleStatusSelect(status)}
                disabled={updating}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: colors.text },
                    currentStatus === status && [styles.statusTextActive, { color: colors.buttonText }],
                  ]}
                >
                  {status}
                </Text>
                {currentStatus === status && (
                  <Ionicons name="checkmark" size={24} color={colors.buttonText} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.cardLight }]}
              onPress={() => setShowStatusModal(false)}
              disabled={updating}
            >
              <Text style={[styles.cancelText, { color: colors.secondaryText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0', // Light gray background for loading state
  },
  coverImage: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  japaneseTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  watchlistButton: {
    backgroundColor: '#FF0000',
    marginRight: 12,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  iconButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  shareButton: {
    borderColor: '#FF0000',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  synopsis: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    color: '#FF0000',
    fontSize: 12,
  },
  studioText: {
    fontSize: 14,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  statusOptionActive: {
    backgroundColor: '#FF0000',
  },
  statusText: {
    fontSize: 16,
    color: '#333',
  },
  statusTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  cancelText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF0000',
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
  tabContent: {
    padding: 16,
  },
  reviewsList: {
    paddingBottom: 20,
  },
  reviewItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewScore: {
    fontSize: 14,
    color: '#FF0000',
    fontWeight: 'bold',
  },
  reviewContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  loadingIndicator: {
    marginTop: 20,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default AnimeDetailScreen;