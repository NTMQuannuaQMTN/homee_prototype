import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import tw from 'twrnc';
import GradientBackground from '../components/GradientBackground';
import { supabase } from '@/utils/supabase';
import GroupCard from './groupcard';
import { useNavigation, router } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

import BackIcon from '../../assets/icons/back.svg';

interface Group {
  id: string;
  title: string;
  bio?: string;
  creator: string;
  public: boolean;
  group_image: string;
  member_count: number;
}

export default function GroupListAll() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('groups')
        .select('id, title, bio, creator, group_image, public, member_count')
        .eq('public', true)
        .order('member_count', { ascending: false })
        .order('created_at', { ascending: false });
      if (!error && data) setGroups(data);
      setLoading(false);
    };
    fetchGroups();
  }, []);

  const numColumns = 2;
  const { width } = Dimensions.get('window');
  const cardWidth = width / 2 - 20; // 24px padding + 4px gap

  return (
    <GradientBackground style={{ flex: 1 }}>
      <View style={tw`flex-row items-center px-4 pt-14 pb-4`}> 
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackIcon width={24} height={24} color="#fff" />
        </TouchableOpacity>
        <View style={tw`flex-1 items-center`}>
            <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>All groups</Text>
        </View>
        <View style={tw`w-7`} />
      </View>
      <FlatList
        data={groups}
        keyExtractor={item => item.id}
        numColumns={numColumns}
        contentContainerStyle={tw`px-3 pb-6`}
        columnWrapperStyle={tw`gap-4 mb-4`}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <GroupCard
              id={item.id}
              title={item.title}
              bio={item.bio}
              publicGroup={item.public}
              creator={item.creator}
              group_image={item.group_image}
              member_count={item.member_count}
              onPress={() => router.navigate({ pathname: '/(group)/groupview', params: { id: item.id } })}
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? <Text style={[tw`text-white text-center mt-10`, { fontFamily: 'Nunito-Bold' }]}>Loading...</Text> : <Text style={[tw`text-white text-center mt-10`, { fontFamily: 'Nunito-Bold' }]}>No groups found.</Text>
        }
      />
    </GradientBackground>
  );
}
