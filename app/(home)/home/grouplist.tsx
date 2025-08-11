import { router } from "expo-router";
import { View, Text, Touchable, TouchableOpacity, ScrollView } from "react-native";
import tw from "twrnc";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import GroupCard from "@/app/(group)/groupcard";

interface Group {
    id: string;
    title: string;
    bio?: string;
    creator: string;
  //   created: string;
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
        if (!loading && hasMore) {
            fetchGroups(true);
        }
    };

    return (
        <View>
            <Text style={[tw`text-white text-2xl mt-1`, { fontFamily: 'Nunito-ExtraBold' }]}>Groups</Text>
            <ScrollView horizontal style={tw`h-32 flex-row mt-2`} contentContainerStyle={tw`gap-4`}>
                {groups.map((group) => (
                    <GroupCard key={group.id}
                        id={group.id}
                        title={group.title}
                        bio={group.bio}
                        creator={group.creator}
                        group_image={group.group_image}
                        member_count={group.member_count}
                        onPress={() => {}}
                    />
                ))}

                <TouchableOpacity
                    style={tw`h-32 w-32 bg-gray-500 rounded-lg justify-center items-center`}
                    onPress={() => router.navigate('/(create)/group')}
                >
                    <Text style={tw`text-white text-2xl`}>+</Text>
                </TouchableOpacity>
            </ScrollView>

            {hasMore && (
                <TouchableOpacity
                    style={tw`mt-2 bg-blue-500 rounded-lg py-2 px-4 self-center`}
                    onPress={handleSeeMore}
                    disabled={loading}
                >
                    <Text style={tw`text-white font-bold`}>
                        {loading ? 'Loading...' : 'See More'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}