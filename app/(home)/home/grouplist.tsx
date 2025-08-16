import { router } from "expo-router";
import { View, Text, Touchable, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import tw from "twrnc";
import { useState, useEffect } from "react";
import { useAsyncFeaturedGroupsStore } from "@/app/store/asyncFeaturedGroupsStore";
import { supabase } from "@/utils/supabase";
import GroupCard from "@/app/(group)/groupcard";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUserStore } from "@/app/store/userStore";

interface Group {
    id: string;
    title: string;
    bio?: string;
    creator: string;
    //   created: string;
    public: boolean;
    group_image: string;
    member_count: number;
    onPress?: () => void;
}

export default function GroupList() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useUserStore();

    const width = Dimensions.get('screen').width;

    const cardWidth = width / 2 - 20;

    const fetchGroups = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('groups')
            .select('id, title, bio, creator, group_image, public, member_count')
            .order('member_count', { ascending: false })
            .order('created_at', { ascending: false })
            .or(
                `creator.eq.${user.id},id.in.(${ // groups where user is a member
                (
                    await supabase
                        .from('group_members')
                        .select('group_id')
                        .eq('user_id', user.id)
                ).data?.map((gm: { group_id: string }) => gm.group_id).join(',') || ''
                })`
            );

        if (error) {
            console.error('Error fetching groups:', error.message);
            return;
        }

        if (data) {
            setGroups(data);
        }
        setLoading(false);
    };

    const { featuredGroupIds, hydrate } = useAsyncFeaturedGroupsStore();

    useEffect(() => {
        hydrate();
    }, []);

    useEffect(() => {
        fetchGroups();
        // eslint-disable-next-line
    }, [user, featuredGroupIds.join(",")]);

    // Listen for group deletion event from groupview.tsx
    useEffect(() => {
        const onGroupDeleted = (event: any) => {
            const deletedId = event?.groupId;
            if (deletedId) {
                setGroups(prev => prev.filter(g => g.id !== deletedId));
            }
        };
        // Add event listener
        const subscription = (globalThis as any).addEventListener?.('groupDeleted', onGroupDeleted);
        // Fallback for React Native
        (globalThis as any).onGroupDeleted = onGroupDeleted;
        return () => {
            // Remove event listener
            (globalThis as any).removeEventListener?.('groupDeleted', onGroupDeleted);
            (globalThis as any).onGroupDeleted = undefined;
        };
    }, []);

    const handleSeeMore = () => {
        router.navigate('/(group)/grouplist_all');
    };

    // Place featured groups at the top, then the rest (excluding featured)
    const featuredGroups = featuredGroupIds
        .map(fid => groups.find(g => g.id === fid))
        .filter(Boolean) as Group[];
    const restGroups = groups.filter(g => !featuredGroupIds.includes(g.id));
    const displayGroups = [...featuredGroups, ...restGroups].slice(0, 5); // Show only first 5

    return (
        <View>
            <View style={tw`flex-row items-center px-4`}>
                <Text style={[tw`text-white text-[18px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Groups</Text>
                <TouchableOpacity
                    onPress={handleSeeMore}
                    disabled={loading}
                    style={tw`ml-2`}
                    accessibilityLabel="See more groups"
                >
                    <Ionicons name="chevron-forward" size={16} color="#fff" />
                </TouchableOpacity>
            </View>
            <ScrollView
                key={featuredGroupIds.join(",")}
                horizontal
                style={tw`h-48 flex-row mt-2.5`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={tw`gap-4 px-4`}
            >
                {displayGroups.map((group) => (
                    <GroupCard key={group.id}
                        id={group.id}
                        title={group.title}
                        bio={group.bio}
                        publicGroup={group.public}
                        creator={group.creator}
                        group_image={group.group_image}
                        member_count={group.member_count}
                        onPress={() => {
                            router.navigate({
                                pathname: '/(group)/groupview', params: {
                                    id: group.id
                                }
                            })
                        }}
                    />
                ))}

                <TouchableOpacity
                    style={[tw`bg-white/10 rounded-xl justify-center items-center`, { width: cardWidth, aspectRatio: 1 / 1 }]}
                    onPress={() => router.navigate('/(create)/group')}
                    activeOpacity={0.7}
                >
                    <View style={tw`flex-row items-center border border-white/50 rounded-full px-2.5 py-2`}>
                        <Text style={[tw`text-white text-xl mr-1.5 -mt-0.5`, { fontFamily: 'Nunito-ExtraBold' }]}>+</Text>
                        <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Create group</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>

            {/* To use the selector, render <FeatureGroupsSelector groups={groups} /> somewhere in your app */}
        </View>
    );
}