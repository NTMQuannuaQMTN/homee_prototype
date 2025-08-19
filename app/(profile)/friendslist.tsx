import { supabase } from '@/utils/supabase';
import { Image } from 'expo-image';
import GradientBackground from '../components/GradientBackground';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Text, TouchableOpacity, View, Share } from 'react-native';
import tw from 'twrnc';
import { useUserStore } from '../store/userStore';

import Back from '../../assets/icons/back.svg';
import IconReverse from '../../assets/icons/icon-reverse.svg';

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
        <GradientBackground style={{ flex: 1 }}>
            <View style={tw`relative flex-row items-center px-4 mt-14 mb-1.5`}>
                {/* Back button - absolute left */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[tw`absolute left-3`, { zIndex: 2 }]}
                >
                    <Back />
                </TouchableOpacity>
                {/* Centered title */}
                <View style={tw`flex-1 items-center justify-center`}>
                    <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Friends</Text>
                    <Text style={[tw`text-gray-400 text-sm`, { fontFamily: 'Nunito-Medium' }]}>
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
                        <IconReverse width={80} height={80} style={tw`mb-2`} />
                        <Text style={[tw`text-white text-center text-[22px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Oops, no friends yet 😔</Text>
                        <Text style={[tw`text-white text-center text-[16px] mt-2 px-4`, { fontFamily: 'Nunito-Medium' }]}>Start inviting people to Homee to share memories together!</Text>
                        <TouchableOpacity
                            style={tw`mt-5 bg-[#7A5CFA] items-center justify-center px-6 py-2.5 rounded-xl`}
                            activeOpacity={0.7}
                            onPress={async () => {
                                try {
                                    await Share.share({
                                        message: 'Join me on Homee! Download the app here: https://homee.app',
                                        // url: 'https://homee.app',
                                        title: 'Homee - Share memories together!'
                                    });
                                } catch (error) {
                                    Alert.alert('Error', 'Unable to share the app link.');
                                }
                            }}
                        >
                            <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Invite friends</Text>
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
        </GradientBackground>
    );
}
