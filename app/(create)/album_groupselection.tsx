import React from 'react';
import { supabase } from '@/utils/supabase';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { useUserStore } from '../store/userStore';
import { useAsyncFeaturedGroupsStore } from '../store/asyncFeaturedGroupsStore';
import { Image } from 'react-native';
import defaultImages from '../(group)/group_defaultimg';
import BackIcon from '../../assets/icons/back.svg';
import GradientBackground from '../components/GradientBackground';
import StarIcon from '../../assets/icons/staricon.svg';

interface AlbumGroup {
  id: string;
  title: string;
  group_image: string;
  member_count?: number;
  created_at?: string;
}

export default function AlbumGroupSelection() {
  const router = useRouter();
  const { user } = useUserStore();
  const { featuredGroupIds, hydrate } = useAsyncFeaturedGroupsStore();
  const [userGroups, setUserGroups] = React.useState<AlbumGroup[]>([]);

  React.useEffect(() => {
    const fetchUserGroups = async () => {
      await hydrate();
      if (!user?.id) return;
      const { data: createdGroups } = await supabase
        .from('groups')
        .select('id, title, group_image, member_count, created_at')
        .eq('creator', user.id);
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
      let joinedGroups: AlbumGroup[] = [];
      if (memberships && memberships.length > 0) {
        const groupIds = (memberships as { group_id: string }[]).map(m => m.group_id);
        const { data: joined } = await supabase
          .from('groups')
          .select('id, title, group_image, member_count, created_at')
          .in('id', groupIds);
        if (joined) joinedGroups = joined;
      }
      const allGroups = [ ...(createdGroups || []), ...joinedGroups ];
      // Ensure all objects have member_count and created_at
      const normalizedGroups = allGroups.map(g => ({
        ...g,
        member_count: 'member_count' in g && typeof (g as any).member_count === 'number' ? (g as any).member_count : 0,
        created_at: 'created_at' in g ? (g as any).created_at ?? '' : '',
      }));
      const uniqueGroups = Array.from(new Map(normalizedGroups.map(g => [g.id, g])).values());
      // List featured groups first, then the rest (sorted by member_count, created_at)
      const featuredGroups = featuredGroupIds
        .map(fid => uniqueGroups.find(g => g.id === fid))
        .filter(g => g !== undefined);
      const restGroups = uniqueGroups
        .filter(g => !featuredGroupIds.includes(g.id));
      restGroups.sort((a, b) => {
        if (b.member_count !== a.member_count) return b.member_count - a.member_count;
        const caA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const caB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return caB - caA;
      });
      setUserGroups([...featuredGroups, ...restGroups]);
    };
    fetchUserGroups();
  }, [user?.id, featuredGroupIds]);

  return (
    <GradientBackground>
      <View style={tw`flex-1 pt-14`}> 
        <View style={tw`flex-row items-center px-4 mb-4`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-2`}>
            <BackIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Select group for album</Text>
        </View>
        <ScrollView style={tw`h-150`}>
          {userGroups.length === 0 ? (
            <Text style={[tw`text-white text-center py-6`, { fontFamily: 'Nunito-Light' }]}>No groups found.</Text>
          ) : (
            <View style={tw`px-2`}>
              {userGroups.map((g) => {
                let imageSource;
                const isDefault = !g.group_image || g.group_image === 'default';
                if (isDefault) {
                  let defaultIndex = 0;
                  if (g.id && g.id.length > 2) {
                    defaultIndex = Math.abs(Array.from(g.id).reduce((acc, c) => acc + c.charCodeAt(0), 0)) % defaultImages.length;
                  } else {
                    defaultIndex = Math.floor(Math.random() * defaultImages.length);
                  }
                  imageSource = defaultImages[defaultIndex];
                } else {
                  imageSource = { uri: g.group_image };
                }
                const isFeatured = featuredGroupIds.includes(g.id);
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={tw`bg-white/10 rounded-lg px-4 py-3 mb-2 flex-row items-center`}
                    onPress={() => {
                      router.replace({
                        pathname: '/(create)/album',
                        params: { groupId: g.id, name: g.title, img: g.group_image }
                      });
                    }}
                  >
                    <View style={tw`mr-3`}>
                      <View style={tw`w-12 h-12 rounded-lg overflow-hidden items-center justify-center`}>
                        <Image
                          source={imageSource}
                          style={{ width: 48, height: 48 }}
                          resizeMode="cover"
                        />
                      </View>
                    </View>
                    <View style={tw`flex-row items-center flex-1`}>
                        {isFeatured && (
                            <StarIcon width={18} height={18} style={tw`mr-1`} />
                        )}
                      <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>{g.title}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </GradientBackground>
  );
}
