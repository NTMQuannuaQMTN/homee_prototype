import { router } from "expo-router";
import { View, Text, Touchable, TouchableOpacity, ScrollView } from "react-native";
import tw from "twrnc";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import GroupCard from "@/app/(group)/groupcard";
import Ionicons from 'react-native-vector-icons/Ionicons';

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
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const limit = 5;

    const fetchGroups = async (isLoadMore = false) => {
        setLoading(true);
        try {
            const currentOffset = isLoadMore ? offset : 0;

            const { data, error } = await supabase
                .from('groups')
                .select('id, title, bio, creator, group_image, public, member_count')
                .range(currentOffset, currentOffset + limit - 1)
                .eq('public', true)
                .order('member_count', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching groups:', error);
                return;
            }

            if (data) {
                if (isLoadMore) {
                    setGroups(prev => [...prev, ...data]);
                } else {
                    setGroups(data);
                }

                setOffset(currentOffset + limit);
                setHasMore(data.length === limit);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleSeeMore = () => {
        router.navigate('/(group)/grouplist_all');
    };

    return (
        <View>
            <View style={tw`flex-row items-center px-4`}>
                <Text style={[tw`text-white text-[18px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Groups</Text>
                {hasMore && (
                    <TouchableOpacity
                        onPress={handleSeeMore}
                        disabled={loading}
                        style={tw`ml-2`}
                        accessibilityLabel="See more groups"
                    >
                        <Ionicons name="chevron-forward" size={16} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
            <ScrollView horizontal style={tw`h-48 flex-row mt-2`} showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-4 px-4`}>
                {groups.map((group) => (
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
                    style={tw`h-48 w-48 bg-white/10 rounded-xl justify-center items-center`}
                    onPress={() => router.navigate('/(create)/group')}
                >
                    <Text style={tw`text-white text-2xl`}>+</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* See more button replaced by right arrow next to Groups title */}
        </View>
    );
}