import TopBar from '@/app/topbar';
import GradientBackground from '@/app/components/GradientBackground';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

export default function Homepage() {
    const [activeTab, setActiveTab] = useState<'explore' | 'yourevents'>('explore');

    return (
        <GradientBackground>
            <View style={tw`flex-1 px-4 pt-8`}>
                <TopBar />
                <Text style={tw`text-white`}>Homepage</Text>
            </View>
        </GradientBackground>
    );
}