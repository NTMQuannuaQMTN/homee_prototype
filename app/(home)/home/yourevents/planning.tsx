
import { supabase } from '@/utils/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import { useUserStore } from '../../../store/userStore';
import EventCard from '../eventcard';

type DraftEvent = {
  id: string;
  title?: string;
  location_name?: string;
  bio?: string;
};

export default function Planning() {
  const { user } = useUserStore();
  const [drafts, setDrafts] = useState<DraftEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // async function fetchDrafts() {
  //   setLoading(true);
  //   const { data, error } = await supabase
  //     .from('events')
  //     .select('*')
  //     .eq('host_id', user.id)
  //     .eq('done', false)
  //     .order('created_at', { ascending: false });
  //   if (!error) setDrafts((data as DraftEvent[]) || []);
  //   setLoading(false);
  // }

  // useEffect(() => {
  //   fetchDrafts();
  // }, [user.id]);

  // useFocusEffect(useCallback(() => { fetchDrafts() }, []));

  if (!drafts.length) return (
    <View style={tw`flex-1 justify-center items-center -mt-30`}>
      <Text style={[tw`text-white text-[18px]`, { fontFamily: 'Nunito-ExtraBold' }]}>No drafts yet 😶</Text>
      <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-Medium' }]}>Plan a new event to get started!</Text>
      <TouchableOpacity
        style={tw`mt-4 bg-[#7A5CFA] rounded-full px-6 py-2`}
        activeOpacity={0.7}
        onPress={() => router.replace('/(create)/create')}
      >
        <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Create event</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 96 }}>
        {drafts.map(item => (
          <TouchableOpacity key={item.id} activeOpacity={0.85} onPress={() => router.replace({ pathname: '/(create)/create', params: { id: item.id } })}>
            <EventCard
              event={{ ...item, isDraft: true }}
              onDeleteDraft={async (id: string) => {
                await supabase.from('events').delete().eq('id', id);
                setDrafts(drafts => drafts.filter(d => d.id !== id));
              }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
  );
}
