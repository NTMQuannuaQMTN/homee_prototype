import React from 'react';
import { Text, View } from 'react-native';
import tw from 'twrnc';

export default function Feed() {
    return (
        <View style={tw`flex-1 justify-center items-center`}>
            <Text style={tw`text-white text-2xl font-bold`}>Hello</Text>
        </View>
    );
}
