import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/common/Button';
import { TextInput as RNTextInput, StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Alert, StyleProp, TextStyle } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../contexts/NotificationContext';
import { getErrorMessage } from '../utils/errorHandlers';
// No need to import updateProfile directly as we'll use the context function

// Define profile images
const profileImages = [
  { id: 1, source: require('../assets/profile_images/profile1.png') },
  { id: 2, source: require('../assets/profile_images/profile2.png') },
  { id: 3, source: require('../assets/profile_images/profile3.png') },
  { id: 4, source: require('../assets/profile_images/profile4.png') },
  { id: 5, source: require('../assets/profile_images/profile5.png') },
  { id: 6, source: require('../assets/profile_images/profil6.png') },
  { id: 7, source: require('../assets/profile_images/profile7.png') },
  { id: 8, source: require('../assets/profile_images/profile8.png') },
  { id: 9, source: require('../assets/profile_images/profile9.png') },
  { id: 10, source: require('../assets/profile_images/profile10.png') },
  { id: 11, source: require('../assets/profile_images/profile11.png') },
  { id: 12, source: null }, // No image option
];

// Custom TextInput component
const TextInput = ({ 
  value, 
  onChangeText, 
  placeholder, 
  autoCapitalize,
  secureTextEntry,
  style,
}: { 
  value: string; 
  onChangeText: (text: string) => void; 
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  style?: StyleProp<TextStyle>;
}) => {
  return (
    <View style={styles.inputContainer}>
      <RNTextInput
        style={[styles.input, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        placeholderTextColor="#999"
      />
    </View>
  );
};

const EditProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, updateUserProfile } = useAuth();
  const { showToast } = useNotification();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get the current photoURL from user and extract the image ID if it exists
  useEffect(() => {
    if (user?.photoURL) {
      const match = user.photoURL.match(/profile(\d+)/);
      if (match && match[1]) {
        setSelectedImageId(parseInt(match[1], 10));
      }
    }
  }, [user]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      showToast({
        message: 'Please enter a display name',
        type: 'error',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare the photoURL based on selected image
      let photoURL = user?.photoURL || '';
      if (selectedImageId) {
        if (selectedImageId === 12) {
          // No image selected
          photoURL = '';
        } else {
          // This is a simple way to store which profile image was selected
          // In a real app, you might want to use a full URL or a path to the image
          photoURL = `profile${selectedImageId}`;
        }
      }

      await updateUserProfile(displayName.trim(), photoURL);

      showToast({
        message: 'Profile updated successfully',
        type: 'success',
      });

      navigation.goBack();
    } catch (error) {
      showToast({
        message: getErrorMessage(error),
        type: 'error',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Edit Profile</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Display Name</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Enter your display name"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Profile Picture</Text>
        <View style={styles.imagesGrid}>
          {profileImages.map((image) => (
            <TouchableOpacity
              key={image.id}
              style={[
                styles.imageContainer,
                selectedImageId === image.id && styles.selectedImageContainer,
              ]}
              onPress={() => setSelectedImageId(image.id)}
            >
              {image.source ? (
                <Image source={image.source} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.noImageContainer]}>
                  <Ionicons name="person-outline" size={40} color="#999" />
                  <Text style={styles.noImageText}>No Image</Text>
                </View>
              )}
              {selectedImageId === image.id && (
                <View style={styles.checkmarkOverlay}>
                  <Ionicons name="checkmark-circle" size={24} color="#FF0000" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          variant="outline"
          size="medium"
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Cancel
        </Button>
        <Button
          variant="solid"
          size="medium"
          onPress={handleSave}
          isLoading={isLoading}
          style={styles.button}
        >
          Save Changes
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  input: {
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: '30%',
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedImageContainer: {
    borderColor: '#FF0000',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImageContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  checkmarkOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 0.48,
  },
});

export default EditProfileScreen;