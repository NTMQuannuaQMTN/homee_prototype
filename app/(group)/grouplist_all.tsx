import { use, useEffect, useState } from 'react';
import React from 'react';
import { Animated } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'react-native';
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
  const [pendingCreators, setPendingCreators] = useState<Record<string, string>>({}); // groupId -> profile_image
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
          setPendingCreators({});
          return;
        }
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('id, title, bio, creator, group_image, public, member_count')
          .in('id', groupIds);
        if (!groupsError && groupsData) {
          setPendingGroups(groupsData);
          // Fetch creator profile images
          const creatorIds = Array.from(new Set(groupsData.map((g: any) => g.creator)));
          if (creatorIds.length > 0) {
            const { data: creatorsData, error: creatorsError } = await supabase
              .from('users')
              .select('id, profile_image')
              .in('id', creatorIds);
            if (!creatorsError && creatorsData) {
              // Map creator id to profile_image
              const creatorMap: Record<string, string> = {};
              creatorsData.forEach((c: any) => {
                creatorMap[c.id] = c.profile_image;
              });
              // Map groupId to creator profile_image
              const groupCreatorMap: Record<string, string> = {};
              groupsData.forEach((g: any) => {
                groupCreatorMap[g.id] = creatorMap[g.creator] || '';
              });
              setPendingCreators(groupCreatorMap);
            } else {
              setPendingCreators({});
            }
          } else {
            setPendingCreators({});
          }
        } else {
          setPendingGroups([]);
          setPendingCreators({});
        }
      } else {
        setPendingGroups([]);
        setPendingCreators({});
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
      {/* Animated Header - scrolls up and fades out */}
      <Animated.View
        style={{
          paddingTop: 56,
          paddingBottom: 0,
          paddingHorizontal: 16,
          flexDirection: 'column',
          alignItems: 'flex-start',
          opacity: scrollY.interpolate({ inputRange: [0, 60], outputRange: [1, 0], extrapolate: 'clamp' }),
          transform: [
            {
              translateY: scrollY.interpolate({
                inputRange: [0, 60],
                outputRange: [0, -60],
                extrapolate: 'clamp',
              }),
            },
          ],
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2,
        }}
      >
        <View style={tw`flex-row items-center mb-4 w-full`}>
          <Text style={[tw`text-white text-[24px] flex-1`, { fontFamily: 'Nunito-Black' }]}>Your groups</Text>
          <TouchableOpacity
            onPress={() => router.push('/(group)/FeatureGroupsSelector')}
            style={tw`px-4 py-2 bg-white/10 rounded-full`}
            activeOpacity={0.7}
          >
            <Text style={[tw`text-[#7A5CFA] text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Select top 5</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Bar below header */}
        <View style={tw`pb-4 px-4 w-full justify-center items-center flex-row gap-x-4`}>
          <TouchableOpacity
            style={tw`${activeTab === 'joined' ? 'bg-[#7A5CFA]' : ''} px-6 py-2 rounded-full`}
            onPress={() => setActiveTab('joined')}
            activeOpacity={0.7}
          >
            <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Joined groups</Text>
          </TouchableOpacity>
          {pendingGroups.length > 0 && (
            <TouchableOpacity
              style={tw`${activeTab === 'requested' ? 'bg-[#7A5CFA]' : ''} px-6 py-2 rounded-full`}
              onPress={() => setActiveTab('requested')}
              activeOpacity={0.7}
            >
              <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Requested</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Compact Header (appears as you scroll) */}
      <Animated.View
        style={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 52,
          paddingBottom: 8,
          opacity: scrollY.interpolate({ inputRange: [0, 60], outputRange: [0, 1], extrapolate: 'clamp' }),
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          overflow: 'hidden',
        }}
      >
        <BlurView
          intensity={30}
          tint="dark"
          style={[tw`absolute top-0 left-0 bottom-0 right-0`, { zIndex: -1 }]}
        />
        <View
          style={[tw`absolute bg-[#080B32] bg-opacity-70 top-0 left-0 bottom-0 right-0`, { zIndex: -1 }]}
        />
        <View style={tw`flex-row w-full items-center mb-2`}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackIcon width={24} height={24} color="#fff" />
          </TouchableOpacity>
          <View style={tw`flex-row items-center w-full`}>
            <Text style={[tw`text-white text-[16px] ml-2.5`, { fontFamily: 'Nunito-ExtraBold' }]}>Your groups</Text>
            <View style={tw`flex-1`} />
            <TouchableOpacity
              onPress={() => router.push('/(group)/FeatureGroupsSelector')}
              style={tw`mr-4.5 px-4 py-2 bg-white/10 rounded-full`}
              activeOpacity={0.7}
            >
              <Text style={[tw`text-[#7A5CFA] text-[13px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Select top 5</Text>
            </TouchableOpacity>
          </View>
        </View>

      </Animated.View>

      {/* Tab Content */}
      <View style={tw`items-center w-full flex-1`}>
        {activeTab === 'joined' ? (
          <Animated.FlatList
            data={[...displayGroups, { id: 'create-group-btn' }]}
            keyExtractor={item => item.id}
            extraData={featuredGroupIds.join(',')}
            numColumns={numColumns}
            contentContainerStyle={tw`pb-10 pt-40`}
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
          <Animated.ScrollView
            style={tw`w-full`}
            contentContainerStyle={tw`pb-10 pt-40 px-4`}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            {pendingGroups.length > 0 ? (
              <View style={tw``}>
                {pendingGroups.map(pg => (
                  <TouchableOpacity
                    key={pg.id}
                    style={tw`bg-white/10 rounded-xl mb-2 px-4 py-3 flex-row items-center`}
                    activeOpacity={0.7}
                    onPress={() => router.navigate({ pathname: '/(group)/groupview', params: { id: pg.id } })}
                  >
                    <View style={[tw`mr-4`, { position: 'relative', width: 48, height: 48 }]}> {/* w-12 h-12 = 48px */}
                      <Image
                        source={{ uri: pg.group_image }}
                        style={tw`w-12 h-12 rounded-lg bg-white/20`}
                        resizeMode="cover"
                      />
                      {pendingCreators[pg.id] ? (
                        <Image
                          source={{ uri: pendingCreators[pg.id] }}
                          resizeMode="cover"
                          style={[tw`w-6 h-6 rounded-full border border-[#7A5CFA] shadow-lg`, {
                            position: 'absolute',
                            bottom: -6,
                            right: -6,
                          }]}
                        />
                      ) : null}
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-Black' }]}>{pg.title}</Text>
                      <Text style={[tw`text-white text-[13px]`, { fontFamily: 'Nunito-Medium' }]}> 
                        {pg.member_count} {pg.member_count === 1 ? 'member' : 'members'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[tw`text-white text-[12px]`, { fontFamily: 'Nunito-Regular' }]}>No pending requests.</Text>
            )}
          </Animated.ScrollView>
        )}
      </View>
    </GradientBackground>
  );
}
