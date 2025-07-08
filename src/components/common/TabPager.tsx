import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

// Define the AnimatedScrollView type
type AnimatedScrollView = Animated.ScrollView;

interface TabPagerProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  renderTabBar: (props: {
    tabs: string[];
    activeTab: string;
    onTabPress: (tab: string) => void;
    tabBarRef: React.RefObject<ScrollView>;
    measureTab: (tab: string, x: number, width: number) => void;
  }) => React.ReactNode;
  renderContent: (activeTab: string) => React.ReactNode;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TabPager: React.FC<TabPagerProps> = memo(({
  tabs,
  activeTab,
  onTabChange,
  renderTabBar,
  renderContent,
}) => {
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const scrollX = useSharedValue(0);
  const contentRef = useRef<AnimatedScrollView>(null);
  const tabBarRef = useRef<ScrollView>(null);
  
  // Calculate the active index
  const activeIndex = tabs.indexOf(activeTab);

  // Store tab measurements for more accurate scrolling
  const [tabMeasurements, setTabMeasurements] = useState<{[key: string]: {x: number, width: number}}>({});
  
  // Function to measure and store tab positions
  const measureTab = useCallback((tab: string, x: number, width: number) => {
    setTabMeasurements(prev => ({
      ...prev,
      [tab]: { x, width }
    }));
  }, []);
  
  // Update scroll position when active tab changes
  useEffect(() => {
    if (contentRef.current && activeIndex !== -1) {
      contentRef.current.scrollTo({ x: activeIndex * containerWidth, animated: true });
    }
    
    // Scroll tab bar to make active tab visible
    if (tabBarRef.current && activeIndex !== -1) {
      const tabInfo = tabMeasurements[activeTab];
      
      if (tabInfo) {
        // Use the actual measured position and width of the tab
        const tabPosition = tabInfo.x;
        const tabWidth = tabInfo.width;
        const screenWidth = Dimensions.get('window').width;
        
        // Calculate a position that centers the tab if possible
        const scrollToPosition = Math.max(0, tabPosition - (screenWidth / 2) + (tabWidth / 2));
        
        // Scroll the tab bar
        tabBarRef.current.scrollTo({ x: scrollToPosition, animated: true });
      } else {
        // Fallback to approximation if measurements aren't available yet
        const approxTabWidth = 100; // Approximate width of a tab including padding
        const approxTabPosition = activeIndex * approxTabWidth;
        const screenWidth = Dimensions.get('window').width;
        
        // Calculate a position that centers the tab if possible
        const scrollToPosition = Math.max(0, approxTabPosition - (screenWidth / 2) + (approxTabWidth / 2));
        
        // Scroll the tab bar
        tabBarRef.current.scrollTo({ x: scrollToPosition, animated: true });
      }
    }
  }, [activeTab, activeIndex, containerWidth, tabMeasurements]);

  // Handle container layout changes
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  }, []);

  // Completely disabled scroll handler to prevent any swipe-related crashes
  const scrollHandler = useAnimatedScrollHandler(
    {
      // Only track scroll position but don't enable any interactive behavior
      onScroll: (event) => {
        scrollX.value = event.contentOffset.x;
      }
      // All other handlers removed to prevent any swipe-related functionality
    },
    []
  );

  // IMPORTANT: All swipe functionality has been completely removed to prevent app crashes
  // Do not re-enable horizontal scrolling or swipe gestures as they cause the app to crash

  // Handle tab press - memoized to prevent unnecessary re-renders
  const handleTabPress = useCallback((tab: string) => {
    onTabChange(tab);
  }, [onTabChange]);

  return (
    <View style={styles.container}>
      <View style={styles.container} onLayout={handleLayout}>
            {/* Tab Bar */}
            {renderTabBar({
              tabs,
              activeTab,
              onTabPress: handleTabPress,
              tabBarRef,
              measureTab, // Pass the measurement function to the tab bar renderer
            })}

            {/* Content - Scrolling disabled to prevent swipe crashes */}
            <Animated.ScrollView
              ref={contentRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={scrollHandler}
              scrollEnabled={false} /* Disable scrolling to prevent swipe gestures */
              contentContainerStyle={{ width: containerWidth * tabs.length }}
              style={{ width: containerWidth }}
            >
              {tabs.map((tab) => (
                <View key={tab} style={[styles.page, { width: containerWidth }]}>
                  {tab === activeTab && renderContent(tab)}
                </View>
              ))}
            </Animated.ScrollView>
          </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});


export default TabPager;