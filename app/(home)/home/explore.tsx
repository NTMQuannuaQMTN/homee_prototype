import { supabase } from '@/utils/supabase';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import { useUserStore } from '../../store/userStore';
// Import new tab pages
import AllEvents from './explore/allevents';
import Feed from './explore/feed';
import FriendEvents from './explore/friendevents';

export default function Explore() {
    const { session, user } = useUserStore();
    const [users, setUsers] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const currentUserId = user?.id;

    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from('users')
            .select('id, username, firstname, lastname, profile_image')
            .neq('id', user.id);
        if (!error && data) {
            setUsers(data);
        } else {
            console.error('Error fetching users:', error.message);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUsers();
        setRefreshing(false);
    };

    useEffect(() => {
        console.log(currentUserId);
        fetchUsers();
    }, []);

    const [activeTab, setActiveTab] = useState<'events' | 'friendsEvents' | 'feed'>('events');
    const [eventsTabWidth, setEventsTabWidth] = useState(0);
    const [friendsEventsTabWidth, setFriendsEventsTabWidth] = useState(0);
    const [feedTabWidth, setFeedTabWidth] = useState(0);
    return (
        <View style={tw`flex-1`}>
            {/* Events / Friends' Events / Feed tabs */}
            <View style={tw`flex-row mt-2 mb-3.5 px-0.5`}>
                <TouchableOpacity onPress={() => setActiveTab('events')} style={tw`items-center mr-6`}>
                    <Text
                        style={{
                            ...(activeTab === 'events' ? tw`text-white` : tw`text-gray-400`),
                            fontFamily: activeTab === 'events' ? 'Nunito-ExtraBold' : 'Nunito-Medium',
                        }}
                        onLayout={e => setEventsTabWidth(e.nativeEvent.layout.width)}
                    >
                        All events
                    </Text>
                    {activeTab === 'events' && (
                        <View style={{
                            height: 2.5,
                            width: eventsTabWidth,
                            backgroundColor: '#fff',
                            borderRadius: 999,
                            marginTop: 4,
                        }} />
                    )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('friendsEvents')} style={tw`items-center mr-6`}>
                    <Text
                        style={{
                            ...(activeTab === 'friendsEvents' ? tw`text-white` : tw`text-gray-400`),
                            fontFamily: activeTab === 'friendsEvents' ? 'Nunito-ExtraBold' : 'Nunito-Medium',
                        }}
                        onLayout={e => setFriendsEventsTabWidth(e.nativeEvent.layout.width)}
                    >
                        Friend's events
                    </Text>
                    {activeTab === 'friendsEvents' && (
                        <View style={{
                            height: 2.5,
                            width: friendsEventsTabWidth,
                            backgroundColor: '#fff',
                            borderRadius: 999,
                            marginTop: 4,
                        }} />
                    )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('feed')} style={tw`items-center`}>
                    <Text
                        style={{
                            ...(activeTab === 'feed' ? tw`text-white` : tw`text-gray-400`),
                            fontFamily: activeTab === 'feed' ? 'Nunito-ExtraBold' : 'Nunito-Medium',
                        }}
                        onLayout={e => setFeedTabWidth(e.nativeEvent.layout.width)}
                    >
                        Feed
                    </Text>
                    {activeTab === 'feed' && (
                        <View style={{
                            height: 2.5,
                            width: feedTabWidth,
                            backgroundColor: '#fff',
                            borderRadius: 999,
                            marginTop: 4,
                        }} />
                    )}
                </TouchableOpacity>
            </View>

            {activeTab === 'events' ? (
                <AllEvents />
            ) : activeTab === 'friendsEvents' ? (
                <FriendEvents />
            ) : (
                <Feed />
            )}
        </View>
    );
}