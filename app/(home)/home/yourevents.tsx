import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import Attended from './yourevents/attended';
import Hosting from './yourevents/hosting';
import Planning from './yourevents/planning';
import Upcoming from './yourevents/upcoming';

export default function YourEvents() {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'hosting' | 'attended' | 'planning'>('upcoming');
    const [tabWidths, setTabWidths] = useState({
        upcoming: 0,
        hosting: 0,
        attended: 0,
        planning: 0,
    });

    const tabList = [
        { key: 'upcoming', label: 'Upcoming' },
        { key: 'hosting', label: 'Hosting' },
        { key: 'attended', label: 'Attended' },
        { key: 'planning', label: 'Still planning' },
    ];

    return (
        <View style={tw`flex-1`}>
            {/* Tabs */}
            <View style={tw`flex-row mt-2 mb-3.5 px-0.5`}>
                {tabList.map((tab, idx) => (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => setActiveTab(tab.key as typeof activeTab)}
                        style={tw`items-center ${idx < tabList.length - 1 ? 'mr-4.5' : ''}`}
                    >
                        <Text
                            style={{
                                ...(activeTab === tab.key ? tw`text-white` : tw`text-gray-400`),
                                fontFamily: activeTab === tab.key ? 'Nunito-ExtraBold' : 'Nunito-Medium',
                            }}
                            onLayout={e => {
                                const layout = e?.nativeEvent?.layout;
                                if (layout && typeof layout.width === 'number') {
                                    setTabWidths(w => ({ ...w, [tab.key]: layout.width }));
                                }
                            }}
                        >
                            {tab.label}
                        </Text>
                        {activeTab === tab.key && (
                            <View style={{
                                height: 2.5,
                                width: tabWidths[tab.key],
                                backgroundColor: '#fff',
                                borderRadius: 999,
                                marginTop: 4,
                            }} />
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            {activeTab === 'upcoming' && (
                <Upcoming />
            )}
            {activeTab === 'hosting' && (
                <Hosting />
            )}
            {activeTab === 'attended' && (
                <Attended />
            )}
            {activeTab === 'planning' && (
                <Planning />
            )}
        </View>
    );
}
