import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import TabPager from '../components/common/TabPager';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useWatchlist } from '../hooks/useWatchlist';
import { useWatchlistTabs } from '../hooks/useWatchlistTabs';
import { useWatchlistActions } from '../hooks/useWatchlistActions';
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
  const { items, isLoading } = useWatchlist();
  const { showToast, showDialog } = useNotification();
  // Use the custom hook for watchlist actions
  const { handleAnimePress, handleStatusChange, handleRemove, handleProgressUpdate } = useWatchlistActions();
  const { colors } = useTheme();
  // Use the custom hook for tab management
  const { activeTab, handleTabChange, updateActiveTab } = useWatchlistTabs(
    // @ts-ignore - route.params might exist
    route.params?.initialTab || 'Watching'
  );
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
  const [episodeInput, setEpisodeInput] = useState('');

  // Update active tab when navigation params change
  useEffect(() => {
    // @ts-ignore - route.params might exist
    if (route.params?.initialTab) {
      // @ts-ignore - route.params exists
      updateActiveTab(route.params.initialTab);
      // Clear the params to prevent unwanted tab switches
      navigation.setParams({ initialTab: undefined });
    }
  }, [route.params, updateActiveTab, navigation]);
  
  // Using handleTabChange from the custom hook

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

  // Using action handlers from the useWatchlistActions hook
  // We need to modify handleStatusChange to use our updateActiveTab function
  const handleStatusChangeWithTabUpdate = useCallback(
    (item: WatchlistItem, newStatus: WatchStatus) => {
      handleStatusChange(item, newStatus, updateActiveTab);
    },
    [handleStatusChange, updateActiveTab]
  );

  const openEpisodeModal = (item: WatchlistItem) => {
    setSelectedItem(item);
    setEpisodeInput(item.progress.toString());
    setModalVisible(true);
  };

  const handleEpisodeInputSubmit = async () => {
    if (!selectedItem) return;
    
    try {
      const newProgress = Math.max(0, parseInt(episodeInput, 10) || 0);
      // Calculate the difference between new and current progress
      const progressDiff = newProgress - selectedItem.progress;
      // Use handleProgressUpdate from useWatchlistActions hook
      await handleProgressUpdate(selectedItem, progressDiff);
      setModalVisible(false);
    } catch (error) {
      console.error('Error updating progress:', error);
      showToast({
        message: 'Failed to update progress',
        type: 'error',
        duration: 3000,
      });
    }
  };

  const renderWatchlistItem = useCallback((item: WatchlistItem) => (
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
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: colors.secondaryText }]}>
              Progress: {item.progress} episodes
            </Text>
            <View style={styles.episodeControls}>
              <TouchableOpacity 
                style={styles.episodeButton}
                onPress={() => handleProgressUpdate(item, -1)}
              >
                <Ionicons name="remove-circle" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.episodeButton}
                onPress={() => openEpisodeModal(item)}
              >
                <Ionicons name="create-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.episodeButton}
                onPress={() => handleProgressUpdate(item, 1)}
              >
                <Ionicons name="add-circle" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
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
            onPress={() =>{
              const currentIndex = WATCH_STATUSES.indexOf(item.status);
              // Calculate previous status (with wrap-around)
              const prevIndex = (currentIndex - 1 + WATCH_STATUSES.length) % WATCH_STATUSES.length;
              const prevStatus = WATCH_STATUSES[prevIndex];
              handleStatusChangeWithTabUpdate(item, prevStatus);
            }}
          >
            <Ionicons name="arrow-back-circle" size={24} color={colors.secondaryText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              const currentIndex = WATCH_STATUSES.indexOf(item.status);
              const nextStatus = WATCH_STATUSES[(currentIndex + 1) % WATCH_STATUSES.length];
              handleStatusChangeWithTabUpdate(item, nextStatus);
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
  ), [colors, handleAnimePress, handleProgressUpdate, handleStatusChangeWithTabUpdate, handleRemove, openEpisodeModal, WATCH_STATUSES]);

  // Render the tab bar for the TabPager component
  const renderTabBar = ({ tabs, activeTab, onTabPress, tabBarRef, measureTab }: {
    tabs: string[];
    activeTab: string;
    onTabPress: (tab: string) => void;
    tabBarRef: React.RefObject<ScrollView>;
    measureTab: (tab: string, x: number, width: number) => void;
  }) => (
    <ScrollView
      ref={tabBarRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEnabled={true} /* Allow scrolling for tab selection but not swiping gestures */
      directionalLockEnabled={true} /* Lock scrolling to horizontal direction only */
      style={[styles.tabsContainer, { borderBottomColor: colors.border }]}
    >
      {tabs.map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.tab,
            { backgroundColor: colors.card },
            activeTab === status && [styles.activeTab, { backgroundColor: colors.primary }],
          ]}
          onPress={() => onTabPress(status)}
          onLayout={(event) => {
            // Measure this tab's position and width
            const { x, width } = event.nativeEvent.layout;
            measureTab(status, x, width);
          }}
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
  );
  
  // Render the content for the active tab
  const renderTabContent = (tab: string) => {
    const filteredItems = items.filter((item) => item.status === tab);
    
    if (isLoading) {
      return <ActivityIndicator style={styles.loader} color={colors.primary} />;
    }
    
    if (filteredItems.length === 0) {
      return (
        <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
          <Ionicons name="list" size={48} color={colors.secondaryText} />
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            No anime in {tab.toLowerCase()}
          </Text>
        </View>
      );
    }
    
    return (
      <ScrollView
        style={[styles.content, { backgroundColor: colors.background }]}
        horizontal={false} /* Explicitly disable horizontal scrolling */
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
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Update Episode Progress
            </Text>
            {selectedItem && (
              <Text style={[styles.modalSubtitle, { color: colors.secondaryText }]}>
                {selectedItem.title}
              </Text>
            )}
            <TextInput
              style={[styles.episodeInput, { borderColor: colors.border, color: colors.text }]}
              value={episodeInput}
              onChangeText={setEpisodeInput}
              keyboardType="number-pad"
              placeholder="Enter episode number"
              placeholderTextColor={colors.secondaryText}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleEpisodeInputSubmit}
              >
                <Text style={{ color: '#fff' }}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TabPager
          tabs={WATCH_STATUSES}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          renderTabBar={renderTabBar}
          renderContent={renderTabContent}
        />
      </View>
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
  progressContainer: {
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  episodeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  episodeButton: {
    marginRight: 8,
    padding: 2,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  episodeInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
});

export default WatchlistScreen;
