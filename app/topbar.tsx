
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import FriendsIcon from '../assets/icons/friends-icon.svg';
import NewNoti from '../assets/icons/newnoti.svg';
import NotiIcon from '../assets/icons/noti_icon.svg';

export default function TopBar() {
  const router = useRouter();
  return (
    <View style={tw`flex-row items-start justify-between mt-3 mb-2`}>
      <View>
        <Text style={[tw`text-white text-2xl mt-1`, { fontFamily: 'Nunito-ExtraBold' }]}>sizzl</Text>
        <Text style={[tw`text-white text-xs mt-1`, { fontFamily: 'Nunito-Medium' }]}>Eyy what's good what's good!</Text>
      </View>
      <View style={tw`flex-row items-center`}>
        <TouchableOpacity
          style={tw`py-2 mr-5 -mt-0.5`}
          onPress={() => router.replace('/(community)/explorefriends')}
        >
          <FriendsIcon width={24} height={24} />
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`py-2`}
          onPress={() => router.replace('/(noti)/notification')}
        >
          <NotiIcon width={24} height={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
