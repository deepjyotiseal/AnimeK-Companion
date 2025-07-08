import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AboutScreen = () => {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>About AnimeK Companion</Text>
      <Text style={styles.text}>
        AnimeK Companion is your personal anime tracking companion. Keep track of your favorite anime, manage your watchlist, and discover new series.
      </Text>
      <Text style={styles.subtitle}>Developer</Text>
      <Text style={styles.text}>Deepjyoti Seal</Text>
      <TouchableOpacity style={styles.linkContainer} onPress={() => openLink('https://github.com/deepjyotiseal')}>
        <Ionicons name="logo-github" size={24} color="#333" />
        <Text style={styles.link}>github.com/deepjyotiseal</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  link: {
    fontSize: 16,
    color: '#007BFF',
    marginLeft: 10,
  },
});

export default AboutScreen;