import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useWatchlist } from '../hooks/useWatchlist';
import { useNotification } from '../contexts/NotificationContext';
import { WatchStatus, WatchlistItem } from '../contexts/WatchlistContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  SlideInRight,
} from 'react-native-reanimated';

const WATCH_STATUSES: WatchStatus[] = [
  'Watching',
  'Plan to Watch',
  'Completed',
  'On Hold',
  'Dropped',
  'Favorite',
];

const WatchlistScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { items, isLoading, updateWatchlistItem, removeFromWatchlist } = useWatchlist();
  const { showToast, showDialog } = useNotification();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<WatchStatus>(
    // @ts-ignore - route.params might exist
    route.params?.initialTab || 'Watching'
  );
  const [refreshing, setRefreshing] = useState(false);

  // Update active tab when navigation params change
  useEffect(() => {
    // @ts-ignore - route.params might exist
    if (route.params?.initialTab) {
      // @ts-ignore - route.params exists
      setActiveTab(route.params.initialTab);
      // Clear the params to prevent unwanted tab switches
      navigation.setParams({ initialTab: undefined });
    }
  }, [route.params]);

  const filteredItems = items.filter((item) => item.status === activeTab);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Wait for a bit to simulate refresh
    setTimeout(() => {
      setRefreshing(false);
      showToast({
        message: 'Watchlist refreshed',
        type: 'success',
        duration: 2000,
      });
    }, 1000);
  }, [showToast]);

  const handleAnimePress = (animeId: number) => {
    navigation.navigate('AnimeDetail', { animeId });
  };

  const handleStatusChange = async (item: WatchlistItem, newStatus: WatchStatus) => {
    try {
      await updateWatchlistItem(item.id, { status: newStatus });
      showDialog({
        title: 'Status Updated',
        message: `"${item.title}" moved to ${newStatus}`,
        type: 'success',
        confirmText: 'View Now',
        cancelText: 'Stay Here',
        onConfirm: () => setActiveTab(newStatus),
      });
    } catch (error) {
      console.error('Error updating status:', error);
      showToast({
        message: 'Failed to update status',
        type: 'error',
        duration: 4000,
      });
    }
  };

  const handleRemove = async (item: WatchlistItem) => {
    showDialog({
      title: 'Remove Anime',
      message: `Are you sure you want to remove "${item.title}" from your watchlist?`,
      type: 'warning',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await removeFromWatchlist(item.id);
          showToast({
            message: `"${item.title}" removed from watchlist`,
            type: 'info',
            duration: 3000,
          });
        } catch (error) {
          console.error('Error removing item:', error);
          showToast({
            message: 'Failed to remove anime from watchlist',
            type: 'error',
          });
        }
      },
    });
  };

  const renderWatchlistItem = (item: WatchlistItem) => (
    <Animated.View
      entering={SlideInRight}
      exiting={FadeOut}
      layout={Layout.springify()}
      key={item.id}
      style={[styles.animeCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
    >
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => handleAnimePress(item.animeId)}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.animeImage} />
        <View style={styles.animeInfo}>
          <Text style={[styles.animeTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.progressText, { color: colors.secondaryText }]}>
            Progress: {item.progress} episodes
          </Text>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.ratingText, { color: colors.secondaryText }]}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              const currentIndex = WATCH_STATUSES.indexOf(item.status);
              // Calculate previous status (with wrap-around)
              const prevIndex = (currentIndex - 1 + WATCH_STATUSES.length) % WATCH_STATUSES.length;
              const prevStatus = WATCH_STATUSES[prevIndex];
              handleStatusChange(item, prevStatus);
            }}
          >
            <Ionicons name="arrow-back-circle" size={24} color={colors.secondaryText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              const currentIndex = WATCH_STATUSES.indexOf(item.status);
              const nextStatus = WATCH_STATUSES[(currentIndex + 1) % WATCH_STATUSES.length];
              handleStatusChange(item, nextStatus);
            }}
          >
            <Ionicons name="arrow-forward-circle" size={24} color={colors.secondaryText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRemove(item)}
          >
            <Ionicons name="trash-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { borderBottomColor: colors.border }]}
      >
        {WATCH_STATUSES.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.tab,
              { backgroundColor: colors.card },
              activeTab === status && [styles.activeTab, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setActiveTab(status)}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.secondaryText },
                activeTab === status && styles.activeTabText,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : filteredItems.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
          <Ionicons name="list" size={48} color={colors.secondaryText} />
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            No anime in {activeTab.toLowerCase()}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={[styles.content, { backgroundColor: colors.background }]}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <Animated.View
            entering={FadeIn}
            style={styles.listContainer}
          >
            {filteredItems.map(renderWatchlistItem)}
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabsContainer: {
    flexGrow: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#FF0000',
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
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
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  animeImage: {
    width: 80,
    height: 120,
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
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  actionButtons: {
    justifyContent: 'space-between',
    paddingLeft: 12,
  },
  actionButton: {
    padding: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default WatchlistScreen;
