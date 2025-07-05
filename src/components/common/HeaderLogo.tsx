import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const HeaderLogo = () => {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/logo/logo.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 5,
  },
  logo: {
    width: 30,
    height: 30,
  },
});

export default HeaderLogo;