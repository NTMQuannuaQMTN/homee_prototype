
import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import tw from 'twrnc';
import { useAsyncFeaturedGroupsStore } from '../store/asyncFeaturedGroupsStore';
import { useRouter } from 'expo-router';

interface Group {
  id: string;
  title: string;
}

interface FeatureGroupsSelectorProps {
  groups?: Group[];
  onSave?: () => void;
  onCancel?: () => void;
}

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

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
          .select('id, title')
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
      <View style={tw`flex-1 px-4 py-16`}>
        <Text style={tw`text-white text-lg mb-2`}>Select up to 5 featured groups:</Text>
        <FlatList
          data={groups}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={tw`${isFeatured(item.id) ? 'bg-green-700' : 'bg-white/10'} rounded-lg px-4 py-2 mb-2 flex-row items-center`}
              onPress={() => handleSelect(item.id)}
            >
              <Text style={tw`text-white flex-1`}>{item.title}</Text>
              {isFeatured(item.id) && (
                <View style={tw`ml-2 bg-green-700 rounded-full w-6 h-6 items-center justify-center`}>
                  <Text style={tw`text-white text-xs font-bold`}>{selected.indexOf(item.id) + 1}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={tw`pb-4`}
          style={tw`flex-1`}
        />
        <Text style={tw`text-white text-xs mt-2`}>{selected.length}/5 selected</Text>
        <View style={tw`flex-row justify-end mt-4`}>
          <TouchableOpacity onPress={handleCancel} style={tw`px-4 py-2 bg-white/10 rounded-lg mr-2`}>
            <Text style={tw`text-white`}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={tw`px-4 py-2 bg-blue-600 rounded-lg`}>
            <Text style={tw`text-white`}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
}
