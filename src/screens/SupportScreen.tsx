import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SupportScreen = () => {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Support Development</Text>
      <Text style={styles.text}>
        If you find this app useful, please consider supporting its development. Your support helps in maintaining and improving the app.
      </Text>
      <Text style={styles.subtitle}>Donate via PayPal</Text>
      <TouchableOpacity style={styles.linkContainer} onPress={() => openLink('https://paypal.me/DeepjyotiSeal')}>
        <Ionicons name="logo-paypal" size={24} color="#00457C" />
        <Text style={styles.link}>paypal.me/DeepjyotiSeal</Text>
      </TouchableOpacity>
      <Text style={styles.subtitle}>Or Scan UPI QR Code</Text>
      <Image source={require('../assets/images/upi.jpg')} style={styles.qrCode} />
    </View>
  );
};

const styles = StyleSheet.create({
  qrCode: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginTop: 20,
  },
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
    marginBottom: 10,
  },
  link: {
    fontSize: 16,
    color: '#007BFF',
    marginLeft: 10,
  },
});

export default SupportScreen;