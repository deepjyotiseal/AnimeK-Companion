import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { GestureHandlerRootView, Directions, FlingGestureHandler, State } from 'react-native-gesture-handler';

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

const TabPager: React.FC<TabPagerProps> = ({
  tabs,
  activeTab,
  onTabChange,
  renderTabBar,
  renderContent,
}) => {
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const scrollX = useSharedValue(0);
  const contentRef = useRef<ScrollView>(null);
  const tabBarRef = useRef<ScrollView>(null);
  
  // Calculate the active index
  const activeIndex = tabs.indexOf(activeTab);

  // Store tab measurements for more accurate scrolling
  const [tabMeasurements, setTabMeasurements] = useState<{[key: string]: {x: number, width: number}}>({});
  
  // Function to measure and store tab positions
  const measureTab = (tab: string, x: number, width: number) => {
    setTabMeasurements(prev => ({
      ...prev,
      [tab]: { x, width }
    }));
  };
  
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
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  // Handle scroll events
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: (event) => {
      const newIndex = Math.round(event.contentOffset.x / containerWidth);
      if (newIndex >= 0 && newIndex < tabs.length && tabs[newIndex] !== activeTab) {
        // Update the active tab when scrolling ends
        onTabChange(tabs[newIndex]);
      }
    },
  });

  // Handle swipe left (next tab)
  const handleSwipeLeft = () => {
    if (activeIndex < tabs.length - 1) {
      const nextTab = tabs[activeIndex + 1];
      onTabChange(nextTab);
    }
  };

  // Handle swipe right (previous tab)
  const handleSwipeRight = () => {
    if (activeIndex > 0) {
      const prevTab = tabs[activeIndex - 1];
      onTabChange(prevTab);
    }
  };

  // Handle tab press
  const handleTabPress = (tab: string) => {
    onTabChange(tab);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <FlingGestureHandler
        direction={Directions.LEFT}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.END) {
            handleSwipeLeft();
          }
        }}
      >
        <FlingGestureHandler
          direction={Directions.RIGHT}
          onHandlerStateChange={({ nativeEvent }) => {
            if (nativeEvent.state === State.END) {
              handleSwipeRight();
            }
          }}
        >
          <View style={styles.container} onLayout={handleLayout}>
            {/* Tab Bar */}
            {renderTabBar({
              tabs,
              activeTab,
              onTabPress: handleTabPress,
              tabBarRef,
              measureTab, // Pass the measurement function to the tab bar renderer
            })}

            {/* Content */}
            <Animated.ScrollView
              ref={contentRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={scrollHandler}
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
        </FlingGestureHandler>
      </FlingGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});

export default TabPager;