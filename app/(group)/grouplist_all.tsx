
import { useEffect, useState } from 'react';
import { useRouter, useNavigation } from 'expo-router';
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import tw from 'twrnc';
import GradientBackground from '../components/GradientBackground';
import { supabase } from '@/utils/supabase';
import GroupCard from './groupcard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFeaturedGroupsStore } from '../store/featuredGroupsStore';
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
  const { featuredGroupIds } = useFeaturedGroupsStore();
  const numColumns = 2;
  const { width } = Dimensions.get('window');
  const cardWidth = width / 2 - 20;
  const router = useRouter();

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

  // Place featured groups at the top, then the rest (excluding featured)
  const featuredGroups = featuredGroupIds
    .map(fid => groups.find(g => g.id === fid))
    .filter(Boolean) as Group[];
  const restGroups = groups.filter(g => !featuredGroupIds.includes(g.id));
  const displayGroups = [...featuredGroups, ...restGroups];

  return (
    <GradientBackground style={{ flex: 1 }}>
      <View style={tw`flex-row items-center px-4 pt-14 pb-4`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackIcon width={24} height={24} color="#fff" />
        </TouchableOpacity>
        <View style={tw`flex-1 flex-row items-center justify-center`}>
          <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Your groups</Text>
          <TouchableOpacity
            onPress={() => router.push('/(group)/FeatureGroupsSelector')}
            style={tw`ml-2 px-2 py-1 bg-white/10 rounded-full`}
            activeOpacity={0.7}
          >
            <Text style={tw`text-blue-300 text-xs`}>Choose</Text>
          </TouchableOpacity>
        </View>
        <View style={tw`w-7`} />
      </View>
      <View style={tw`items-center mb-18`}>

        <FlatList
          data={[...displayGroups, { id: 'create-group-btn' }]}
          keyExtractor={item => item.id}
          extraData={featuredGroupIds.join(',')}
          numColumns={numColumns}
          contentContainerStyle={tw`pb-14`}
          columnWrapperStyle={tw`gap-x-4 mb-4`}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.id === 'create-group-btn') {
              return (
                <View style={{ width: cardWidth }}>
                  <TouchableOpacity
                    style={[tw`bg-white/10 rounded-xl justify-center items-center`, {width: cardWidth, aspectRatio: 1/1}]}
                    onPress={() => router.navigate('/(create)/group')}
                    activeOpacity={0.7}
                  >
                    <View style={tw`flex-row items-center border border-white/50 rounded-full px-2.5 py-2`}>
                      <Text style={[tw`text-white text-xl mr-1.5 -mt-0.5`, { fontFamily: 'Nunito-ExtraBold' }]}>+</Text>
                      <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Create group</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            }
            const group = item as Group;
            return (
              <View style={{ width: cardWidth }}>
                <GroupCard
                  id={group.id}
                  title={group.title}
                  bio={group.bio}
                  publicGroup={group.public}
                  creator={group.creator}
                  group_image={group.group_image}
                  member_count={group.member_count}
                  onPress={() => router.navigate({ pathname: '/(group)/groupview', params: { id: group.id } })}
                />
              </View>
            );
          }}
          ListEmptyComponent={
            loading ? <Text style={[tw`text-white text-center mt-10`, { fontFamily: 'Nunito-Bold' }]}>Loading...</Text> : <Text style={[tw`text-white text-center mt-10`, { fontFamily: 'Nunito-Bold' }]}>No groups found.</Text>
          }
        />
      </View>
    </GradientBackground>
  );
}
