import React from 'react';
import { View } from 'react-native';
import tw from 'twrnc';
import LogoWhite from '../assets/logo/primary.svg';

export default function TopBar() {
  return (
    <View style={tw`items-center w-full`}>
      <LogoWhite width={100} height={80} />
    </View>
  );
}
