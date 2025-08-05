import TopBar from '@/app/topbar';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import Explore from './explore';
import YourEvents from './yourevents';

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
            {/* Tab Switcher */}
            <View style={tw`flex-row justify-around mt-4 mb-2`}>
                <TouchableOpacity
                    style={tw`flex-1 items-center py-2 ${activeTab === 'explore' ? 'bg-[#7A5CFA] rounded-full' : ''}`}
                    onPress={() => setActiveTab('explore')}
                >
                    <Text style={[tw`text-[15px] text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Explore</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={tw`flex-1 items-center py-2 ${activeTab === 'yourevents' ? 'bg-[#7A5CFA] rounded-full' : ''}`}
                    onPress={() => setActiveTab('yourevents')}
                >
                    <Text style={[tw`text-[15px] text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Your events</Text>
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <View style={tw`flex-1 h-full`}>
                {activeTab === 'explore' ? <Explore /> : <YourEvents />}
            </View>
        </LinearGradient>
    );
}