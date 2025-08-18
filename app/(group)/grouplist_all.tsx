import { use, useEffect, useState } from 'react';
import React from 'react';
import { Animated } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { View as RNView, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import tw from 'twrnc';
import GradientBackground from '../components/GradientBackground';
import { supabase } from '@/utils/supabase';
import GroupCard from './groupcard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAsyncFeaturedGroupsStore } from '../store/asyncFeaturedGroupsStore';
import BackIcon from '../../assets/icons/back.svg';
import IconFun from '../../assets/icons/icon-fun.svg';
import { useUserStore } from '../store/userStore';

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
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingGroups, setPendingGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState<'joined' | 'requested'>('joined');
  const navigation = useNavigation();
  const { featuredGroupIds, hydrate } = useAsyncFeaturedGroupsStore();

  useEffect(() => {
    hydrate();
  }, []);
  const numColumns = 2;
  const { width } = Dimensions.get('window');
  const cardWidth = width / 2 - 20;
  const router = useRouter();

  const { user } = useUserStore();

useEffect(() => {
  if (!user?.id) return;
  const fetchGroups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('groups')
      .select('id, title, bio, creator, group_image, public, member_count')
      .order('member_count', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error && data) setGroups(data);
    setLoading(false);
  };

  const fetchPendingGroups = async () => {
    // group_requests table only contains pending requests for user_id
    const { data, error } = await supabase
      .from('group_requests')
      .select('group_id')
      .eq('user_id', user.id);
    if (!error && data && data.length > 0) {
      const groupIds = data.map((req: { group_id: string }) => req.group_id);
      if (groupIds.length === 0) {
        setPendingGroups([]);
        return;
      }
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, title, bio, creator, group_image, public, member_count')
        .in('id', groupIds);
      if (!groupsError && groupsData) setPendingGroups(groupsData);
      else setPendingGroups([]);
    } else {
      setPendingGroups([]);
    }
  };

  fetchGroups();
  fetchPendingGroups();
}, [user?.id]);

  // Place featured groups at the top, then the rest (excluding featured)
  // Remove pending groups from display
  const pendingGroupIds = pendingGroups.map(g => g.id);
  const featuredGroups = featuredGroupIds
    .map(fid => groups.find(g => g.id === fid))
    .filter((g): g is Group => !!g)
    .filter(g => !pendingGroupIds.includes(g.id));
  const restGroups = groups
    .filter(g => !featuredGroupIds.includes(g.id))
    .filter(g => !pendingGroupIds.includes(g.id));
  const displayGroups = [...featuredGroups, ...restGroups];

  return (
    <GradientBackground style={{ flex: 1 }}>
      {/* Fixed Header */}
      <View style={tw`flex-row items-center px-4 pt-14 pb-5 w-full z-10`}>
        <Text style={[tw`text-white text-[24px] flex-1`, { fontFamily: 'Nunito-Black' }]}>Your groups</Text>
        <TouchableOpacity
          onPress={() => router.push('/(group)/FeatureGroupsSelector')}
          style={tw`px-4 py-2 bg-white/10 rounded-full`}
          activeOpacity={0.7}
        >
          <Text style={[tw`text-[#7A5CFA] text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Select features</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar below header */}
      <View style={tw`pb-5 px-4 w-full justify-center items-center`}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-x-4`}>
          <TouchableOpacity
            style={tw`${activeTab === 'joined' ? 'bg-[#7A5CFA]' : ''} px-6 py-2 rounded-full`}
            onPress={() => setActiveTab('joined')}
            activeOpacity={0.7}
          >
            <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Joined groups</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`${activeTab === 'requested' ? 'bg-[#7A5CFA]' : ''} px-6 py-2 rounded-full`}
            onPress={() => setActiveTab('requested')}
            activeOpacity={0.7}
          >
            <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Requested</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={tw`items-center w-full flex-1`}>
        {activeTab === 'joined' ? (
          <Animated.FlatList
            data={[...displayGroups, { id: 'create-group-btn' }]}
            keyExtractor={item => item.id}
            extraData={featuredGroupIds.join(',')}
            numColumns={numColumns}
            contentContainerStyle={tw`pb-10`}
            columnWrapperStyle={tw`gap-x-4 mb-4`}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            renderItem={({ item }) => {
              // ...existing code...
              if (item.id === 'create-group-btn') {
                return (
                  <View style={{ width: cardWidth }}>
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
        ) : (
          <View style={tw`w-full px-4`}>
            {pendingGroups.length > 0 ? (
              <View style={tw``}>
                {pendingGroups.map(pg => (
                  <View key={pg.id} style={tw`bg-white/10 rounded-xl mb-2 px-4 py-3 flex-row items-center`}>
                    {pg.group_image ? (
                      <View style={tw`mr-3`}>
                        <Animated.Image
                          source={{ uri: pg.group_image }}
                          style={[tw`rounded-lg`, { width: 40, height: 40 }]}
                          resizeMode="cover"
                        />
                      </View>
                    ) : null}
                    <View style={tw`flex-1`}>
                      <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>{pg.title}</Text>
                      <Text style={[tw`text-white text-[13px]`, { fontFamily: 'Nunito-Regular' }]}>{pg.member_count} member{pg.member_count === 1 ? '' : 's'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[tw`text-white text-[12px]`, { fontFamily: 'Nunito-Regular' }]}>No pending requests.</Text>
            )}
          </View>
        )}
      </View>
    </GradientBackground>
  );
}
