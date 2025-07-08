import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Modal,
  Switch,
  Clipboard,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useWatchlist } from '../hooks/useWatchlist';
import { Button } from '../components/common/Button';
import { Ionicons } from '@expo/vector-icons';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { getErrorMessage } from '../utils/errorHandlers';
import { getUserSettings, toggleSearchHistory } from '../utils/userSettingsStorage';

// Profile images are loaded dynamically using require()

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuth();
  const { items } = useWatchlist();
  const { showToast, showDialog } = useNotification();
  const { theme, toggleTheme, isDarkMode, colors } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchHistoryEnabled, setSearchHistoryEnabled] = useState(true);

  const watchingCount = items.filter(item => item.status === 'Watching').length;
  const completedCount = items.filter(item => item.status === 'Completed').length;
  const plannedCount = items.filter(item => item.status === 'Plan to Watch').length;

  // Load user settings when component mounts
  useEffect(() => {
    const loadUserSettings = async () => {
      const settings = await getUserSettings();
      setSearchHistoryEnabled(settings.enableSearchHistory);
    };
    loadUserSettings();
  }, []);

  const handleToggleSearchHistory = async () => {
    const newValue = await toggleSearchHistory();
    setSearchHistoryEnabled(newValue);
  };

  const handleLogout = async () => {
    showDialog({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      type: 'warning',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          setIsLoggingOut(true);
          await logout();
          showToast({
            message: 'You have been signed out successfully',
            type: 'success',
          });
        } catch (error) {
          showToast({
            message: getErrorMessage(error),
            type: 'error',
            duration: 4000,
          });
        } finally {
          setIsLoggingOut(false);
        }
      },
    });
  };

  const StatCard = ({ title, value, iconName }: { title: string; value: number; iconName: keyof typeof Ionicons.glyphMap }) => (
    <View style={[styles.statCard, { backgroundColor: colors.cardLight }]}>
      <Ionicons name={iconName} size={24} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.secondaryText }]}>{title}</Text>
    </View>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.photoURL && user.photoURL.startsWith('profile') ? (
            getProfileImage(user.photoURL) ? (
              <Image 
                source={getProfileImage(user.photoURL)}
                style={styles.avatar}
              />
            ) : (
            <Ionicons name="person-circle" size={80} color={colors.primary} />
            )
          ) : (
            <Ionicons name="person-circle" size={80} color={colors.primary} />
          )}
        </View>
        <Text style={[styles.displayName, { color: colors.text }]}>{user?.displayName}</Text>
        <Text style={[styles.email, { color: colors.secondaryText }]}>{user?.email}</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          title="Watching"
          value={watchingCount}
          iconName="play-circle"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          iconName="checkmark-circle"
        />
        <StatCard
          title="Planned"
          value={plannedCount}
          iconName="time"
        />
      </View>

      <View style={styles.settingsSection}>
        <TouchableOpacity 
          style={[styles.settingsRow, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="person-outline" size={24} color={colors.text} />
          <Text style={[styles.settingsText, { color: colors.text }]}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.settingsRow, { borderBottomColor: colors.border }]}
          onPress={() => setShowQRCode(true)}
        >
          <Ionicons name="share-social-outline" size={24} color={colors.text} />
          <Text style={[styles.settingsText, { color: colors.text }]}>Share App</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.settingsRow, { borderBottomColor: colors.border }]}
          onPress={() => setShowSettings(true)}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
          <Text style={[styles.settingsText, { color: colors.text }]}>Settings</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingsRow, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('About')}>
          <Ionicons name="information-circle-outline" size={24} color={colors.text} />
          <Text style={[styles.settingsText, { color: colors.text }]}>About</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingsRow, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Support')}>
          <Ionicons name="heart-outline" size={24} color={colors.text} />
          <Text style={[styles.settingsText, { color: colors.text }]}>Support Development</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>



      <Button
        variant="outline"
        size="large"
        onPress={handleLogout}
        isLoading={isLoggingOut}
        iconName="log-out-outline"
        style={styles.logoutButton}
      >
        Sign Out
      </Button>

      <Text style={[styles.version, { color: colors.secondaryText }]}>Version 1.0.0</Text>
      
      {/* QR Code Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showQRCode}
        onRequestClose={() => setShowQRCode(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Share App</Text>
              <TouchableOpacity onPress={() => setShowQRCode(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <Image 
              source={require('../assets/share app/share app.png')} 
              style={styles.qrCode} 
              resizeMode="contain"
            />
            
            <Text style={[styles.shareText, { color: colors.secondaryText }]}>Scan this QR code or use the link below to download the app</Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.linkButton, { backgroundColor: colors.primary }]}
                onPress={() => Linking.openURL('https://drive.google.com/drive/folders/1NDLw2VTa6A8Uvbh0vxnzfeoTeAMZAq9V')}
              >
                <Text style={[styles.linkButtonText, { color: colors.buttonText }]}>Open Download Link</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.linkButton, { backgroundColor: colors.cardLight, marginTop: 10 }]}
                onPress={() => {
                  Clipboard.setString('https://drive.google.com/drive/folders/1NDLw2VTa6A8Uvbh0vxnzfeoTeAMZAq9V');
                  showToast({
                    message: 'Link copied to clipboard!',
                    type: 'success',
                  });
                }}
              >
                <Text style={[styles.linkButtonText, { color: colors.text }]}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Settings Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSettings}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="moon-outline" size={24} color={colors.text} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleTheme}
                value={isDarkMode}
              />
            </View>
            
            <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
              {isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            </Text>

            <View style={[styles.settingItem, { marginTop: 20 }]}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="search-outline" size={24} color={colors.text} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Search History</Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={searchHistoryEnabled ? '#ffffff' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={handleToggleSearchHistory}
                value={searchHistoryEnabled}
              />
            </View>
            
            <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
              {searchHistoryEnabled ? 'Disable search history' : 'Enable search history'}
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Helper function to get the profile image based on the photoURL
const getProfileImage = (photoURL: string) => {
  const profileNumber = photoURL.match(/profile(\d+)/);
  if (!profileNumber) return require('../assets/profile_images/profile1.png');
  
  switch (profileNumber[1]) {
    case '1': return require('../assets/profile_images/profile1.png');
    case '2': return require('../assets/profile_images/profile2.png');
    case '3': return require('../assets/profile_images/profile3.png');
    case '4': return require('../assets/profile_images/profile4.png');
    case '5': return require('../assets/profile_images/profile5.png');
    case '6': return require('../assets/profile_images/profil6.png');
    case '7': return require('../assets/profile_images/profile7.png');
    case '8': return require('../assets/profile_images/profile8.png');
    case '9': return require('../assets/profile_images/profile9.png');
    case '10': return require('../assets/profile_images/profile10.png');
    case '11': return require('../assets/profile_images/profile11.png');
    case '12': return null; // No image option
    default: return require('../assets/profile_images/profile1.png');
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  qrCode: {
    width: 200,
    height: 200,
    marginVertical: 20,
  },
  shareText: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  linkButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
    width: '80%',
  },
  linkButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
  },
  settingsSection: {
    marginBottom: 32,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    width: '100%',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 16,
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 8,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  settingsText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
  },
  logoutButton: {
    marginBottom: 16,
  },
  version: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 20,
  },
});

export default ProfileScreen;