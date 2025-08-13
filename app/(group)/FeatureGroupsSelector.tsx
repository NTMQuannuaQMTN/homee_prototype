
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import BackIcon from '../../assets/icons/back.svg';
import defaultImages from './group_defaultimg';
import GradientBackground from '../components/GradientBackground';
import tw from 'twrnc';
import { useAsyncFeaturedGroupsStore } from '../store/asyncFeaturedGroupsStore';
import { useRouter } from 'expo-router';

interface Group {
  id: string;
  title: string;
  group_image?: string;
}

interface FeatureGroupsSelectorProps {
  groups?: Group[];
  onSave?: () => void;
  onCancel?: () => void;
}

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
// Import the back.svg icon using react-native-svg or as an Image
// If using react-native-svg, you would import as:
// import BackIcon from '../../assets/icons/back.svg';
// For Expo, use Image and require

export default function FeatureGroupsSelector({ groups: propGroups, onSave, onCancel }: FeatureGroupsSelectorProps) {
  const router = useRouter();
  const { featuredGroupIds, setFeaturedGroupIds, hydrate } = useAsyncFeaturedGroupsStore();
  const [selected, setSelected] = React.useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>(propGroups || []);

  useEffect(() => {
    const init = async () => {
      await hydrate();
      setSelected(useAsyncFeaturedGroupsStore.getState().featuredGroupIds);
    };
    init();
  }, []);

  useEffect(() => {
    setSelected(featuredGroupIds);
  }, [featuredGroupIds]);

  useEffect(() => {
    if (!propGroups) {
      const fetchGroups = async () => {
        const { data, error } = await supabase
          .from('groups')
          .select('id, title, group_image')
          .eq('public', true)
          .order('member_count', { ascending: false })
          .order('created_at', { ascending: false });
        if (!error && data) setGroups(data);
      };
      fetchGroups();
    }
  }, [propGroups]);

  const isFeatured = (id: string) => selected.includes(id);
  const canAdd = selected.length < 5;

  const handleSelect = (id: string) => {
    if (isFeatured(id)) setSelected(selected.filter(gid => gid !== id));
    else if (canAdd) setSelected([...selected, id]);
  };

  const handleSave = async () => {
    await setFeaturedGroupIds(selected);
    if (onSave) onSave();
    else router.back();
  };
  const handleCancel = async () => {
    await hydrate();
    setSelected(useAsyncFeaturedGroupsStore.getState().featuredGroupIds);
    if (onCancel) onCancel();
    else router.back();
  };

  return (
    <GradientBackground>
      <View style={tw`flex-1 px-4 py-14`}>
        <View style={tw`flex-row items-center mb-4`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-2`}>
            <BackIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Select up to 5 featured groups:</Text>
        </View>
        <FlatList
          data={groups}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            // ...existing code...
            let imageSource;
            const isDefault = !item.group_image || item.group_image === 'default';
            if (isDefault) {
              let defaultIndex = 0;
              if (item.id && item.id.length > 2) {
                defaultIndex = Math.abs(Array.from(item.id).reduce((acc, c) => acc + c.charCodeAt(0), 0)) % defaultImages.length;
              } else {
                defaultIndex = Math.floor(Math.random() * defaultImages.length);
              }
              imageSource = defaultImages[defaultIndex];
            } else {
              imageSource = { uri: item.group_image };
            }
            return (
              <TouchableOpacity
                style={tw`${isFeatured(item.id) ? 'bg-green-600' : 'bg-white/10'} rounded-lg px-4 py-3 mb-2 flex-row items-center`}
                onPress={() => handleSelect(item.id)}
              >
                {/* Group photo on the left */}
                <View style={tw`mr-3`}>
                  <View style={tw`w-12 h-12 rounded-lg overflow-hidden items-center justify-center`}>
                    <Image
                      source={imageSource}
                      style={{ width: 48, height: 48 }}
                      resizeMode="cover"
                    />
                  </View>
                </View>
                <Text style={[tw`text-white text-[16px] flex-1`, { fontFamily: 'Nunito-ExtraBold' }]}>{item.title}</Text>
                {isFeatured(item.id) && (
                  <View style={tw`ml-2 bg-green-700 rounded-full w-8 h-8 items-center justify-center`}>
                    <Text style={[tw`text-white text-[13px]`, { fontFamily: 'Nunito-ExtraBold' }]}>{selected.indexOf(item.id) + 1}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={tw`pb-0`}
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
        />
        <Text style={[tw`text-white text-[14px] mt-2`, { fontFamily: 'Nunito-ExtraBold' }]}>{selected.length}/5 selected</Text>
        <View style={tw`mt-4`}>
          <TouchableOpacity onPress={handleSave} style={tw`py-2.5 bg-[#7A5CFA] rounded-full mb-2`}>
            <Text style={[tw`text-white text-center text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCancel} style={tw`py-2.5 bg-white/5 rounded-full`}>
            <Text style={[tw`text-white text-center text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
}
