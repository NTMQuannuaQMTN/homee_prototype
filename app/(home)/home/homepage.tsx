import TopBar from '@/app/topbar';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

export default function Homepage() {
    const [activeTab, setActiveTab] = useState<'explore' | 'yourevents'>('explore');

    return (
        <LinearGradient
            colors={['#080B32', '#0E1241', '#291C56', '#392465', '#51286A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[{ flex: 1 }, tw`px-4 pt-8`]}
        >
            <TopBar />
            <Text>Homepage</Text>
        </LinearGradient>
    );
}