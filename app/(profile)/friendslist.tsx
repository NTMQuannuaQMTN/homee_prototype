import { supabase } from '@/utils/supabase';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import { useUserStore } from '../store/userStore';

import Back from '../../assets/icons/back.svg';

export default function FriendsList() {
    const router = useRouter();
    const [friends, setFriends] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const { user } = useUserStore();
    const { user_id, relation } = useLocalSearchParams();

    React.useEffect(() => {
        // Fetch friends from supabase
        const fetchFriends = async () => {
            setLoading(true);
            try {
                const userId = user_id;
                if (!userId) {
                    setFriends([]);
                    setLoading(false);
                    return;
                }

                let friendRows, error;

                if (relation === 'Stranger') {
                    const { data: mutualCheck, error: mutualErr } = await supabase
                        .from('friends')
                        .select('friend')
                        .eq('user_id', userId);

                    console.log(mutualCheck);

                    if (mutualErr || !mutualCheck || mutualCheck.length === 0) {
                        Alert.alert('Hmm');
                        setFriends([]);
                    } else {
                        ({ data: friendRows, error } = await supabase
                            .from('friends')
                            .select('friend')
                            .eq('user_id', user.id)
                            .in('friend', mutualCheck?.map(a => a.friend)));

                        if (error || !friendRows || friendRows.length === 0) {
                            setFriends([]);
                        }
                    }
                } else {
                    ({ data: friendRows, error } = await supabase
                        .from('friends')
                        .select('friend')
                        .eq('user_id', userId));
                }
                if (error || !friendRows || friendRows.length === 0) {
                    setFriends([]);
                } else {
                    let otherUserIds = friendRows.map((row: any) => row.friend);
                    // Deduplicate
                    otherUserIds = Array.from(new Set(otherUserIds));
                    if (otherUserIds.length === 0) {
                        setFriends([]);
                    } else {
                        let { data: profiles, error: profileError } = await supabase
                            .from('users')
                            .select('id, username, firstname, lastname, profile_image')
                            .in('id', otherUserIds);
                        if (profileError || !profiles) {
                            setFriends([]);
                        } else {
                            setFriends(profiles.map((p: any) => (p)));
                        }
                    }
                }
            } catch (err) {
                setFriends([]);
            }
            setLoading(false);
        };
        fetchFriends();
    }, []);

    return (
        <LinearGradient
            colors={["#080B32", "#0E1241", "#291C56", "#392465", "#51286A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
        >
            <View style={tw`relative flex-row items-center px-4 mt-10 pt-3 mb-1.5 h-10`}>
                {/* Back button - absolute left */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[tw`absolute left-3`, { zIndex: 2 }]}
                >
                    <Back />
                </TouchableOpacity>
                {/* Centered title */}
                <View style={tw`flex-1 items-center justify-center`}>
                    <Text style={[tw`text-white text-base`, { fontFamily: 'Nunito-ExtraBold' }]}>Friends</Text>
                    <Text style={[tw`text-gray-400 text-xs -mt-0.5`, { fontFamily: 'Nunito-Medium' }]}>
                        {friends.length} friend{friends.length === 1 ? '' : 's'}
                    </Text>
                </View>
            </View>

            {/* Friend List */}
            <View style={tw`flex-1 px-4 pt-2`}>
                {loading ? (
                    <Text style={[tw`text-white text-center mt-10`, { fontFamily: 'Nunito-ExtraBold' }]}>Loading...</Text>
                ) : friends.length === 0 ? (
                    <View style={tw`-mt-20 flex-1 justify-center items-center`}>
                        <Text style={[tw`text-white text-center text-[17px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Oops, no friends yet 😔</Text>
                        <Text style={[tw`text-white text-center text-[15px] mt-0.5`, { fontFamily: 'Nunito-Medium' }]}>Your friends might be on Sizzl. Let's explore!</Text>
                        <TouchableOpacity
                            style={tw`mt-5 bg-[#7A5CFA] items-center justify-center px-6 py-2 rounded-xl`}
                            activeOpacity={0.7}
                            onPress={() => router.replace('/(community)/explorefriends')}
                        >
                            <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Start exploring!</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    friends.map((friend) => (
                        <TouchableOpacity
                            key={friend.id}
                            style={tw`flex-row items-center mb-4 bg-white/10 rounded-xl p-3`}
                            activeOpacity={0.7}
                            onPress={() => router.replace({ pathname: '/(profile)/profile', params: { user_id: friend.id } })}
                        >
                            <Image
                                source={friend.profile_image || require('../../assets/images/pfp-default.png')}
                                style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
                            />
                            <View>
                                <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>
                                    {friend.firstname || ''} {friend.lastname || ''}
                                </Text>
                                <Text style={[tw`text-gray-400 text-[13px] -mt-0.5`, { fontFamily: 'Nunito-Medium' }]}>
                                    @{friend.username || 'Unknown'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </LinearGradient>
    );
}
