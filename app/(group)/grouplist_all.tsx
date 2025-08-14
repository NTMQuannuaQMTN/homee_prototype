import { use, useEffect, useState } from 'react';
import React from 'react';
import { Animated } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { View as RNView } from 'react-native';
import { BlurView } from 'expo-blur';
import tw from 'twrnc';
import GradientBackground from '../components/GradientBackground';
import { supabase } from '@/utils/supabase';
import GroupCard from './groupcard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAsyncFeaturedGroupsStore } from '../store/asyncFeaturedGroupsStore';
import BackIcon from '../../assets/icons/back.svg';
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
    const fetchGroups = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('groups')
        .select('id, title, bio, creator, group_image, public, member_count')
        .eq('public', true)
        .or(
          `creator.eq.${user.id},id.in.(${ // groups where user is a member
          (
            await supabase
              .from('group_members')
              .select('group_id')
              .eq('user_id', user.id)
          ).data?.map((gm: { group_id: string }) => gm.group_id).join(',') || ''
          })`
        )
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
        <View style={tw`flex-row items-center mb-2 w-full`}>
          <Text style={[tw`text-white text-[24px] flex-1`, { fontFamily: 'Nunito-ExtraBold' }]}>Your groups</Text>
          <TouchableOpacity
            onPress={() => router.push('/(group)/FeatureGroupsSelector')}
            style={tw`px-4 py-2 bg-white/10 rounded-full`}
            activeOpacity={0.7}
          >
            <Text style={[tw`text-[#7A5CFA] text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Select features</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Compact Header (appears as you scroll) */}
      <Animated.View
        style={{
          flexDirection: 'row',
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
          style={[tw`absolute bg-[#080B32] bg-opacity-80 top-0 left-0 bottom-0 right-0`, { zIndex: -1 }]}
        />
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
            <Text style={[tw`text-[#7A5CFA] text-[13px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Select features</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={tw`items-center`}> {/* Add top padding for header overlay */}
        <Animated.FlatList
          data={[...displayGroups, { id: 'create-group-btn' }]}
          keyExtractor={item => item.id}
          extraData={featuredGroupIds.join(',')}
          numColumns={numColumns}
          contentContainerStyle={tw`pt-28.5 pb-10`}
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
      </View>
    </GradientBackground>
  );
}
