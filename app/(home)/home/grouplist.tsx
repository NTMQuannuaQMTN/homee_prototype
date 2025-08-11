import { router } from "expo-router";
import { View, Text, Touchable, TouchableOpacity, ScrollView } from "react-native";
import tw from "twrnc";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

interface Group {
    id: string;
    name: string;
    description?: string;
    created_at: string;
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
                .select('*')
                .range(currentOffset, currentOffset + limit - 1)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching groups:', error);
                return;
            }

            if (data) {
                console.log(data);
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
                    <TouchableOpacity 
                        key={group.id}
                        style={tw`h-32 w-32 bg-gray-500 rounded-lg justify-center items-center p-2`}
                        // onPress={() => router.navigate(`/(group)/${group.id}`)}
                    >
                        <Text style={tw`text-white text-center font-bold`} numberOfLines={2}>
                            {group.name}
                        </Text>
                        {group.description && (
                            <Text style={tw`text-white text-xs text-center mt-1`} numberOfLines={2}>
                                {group.description}
                            </Text>
                        )}
                    </TouchableOpacity>
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