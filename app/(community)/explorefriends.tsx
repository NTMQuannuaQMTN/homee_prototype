

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import BackIcon from '../../assets/icons/back.svg';

export default function ExploreFriends() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity
        style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }}
        onPress={() => router.replace('/(home)/home/homepage')}
      >
        <BackIcon width={32} height={32} />
      </TouchableOpacity>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>ahihi do cho</Text>
      <Image
        source={require('../../assets/gifs/rickroll.gif')}
        style={{ width: 300, height: 200 }}
        resizeMode="contain"
      />
    </View>
  );
}
