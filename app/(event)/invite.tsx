import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import defaultImages from '../(create)/defaultimage';
import Back from '../../assets/icons/back.svg';
import { useUserStore } from '../store/userStore';

type EventView = {
  id: string;
  title: string;
  public: boolean;
  image: string;
  start: string;
  end: string;
  location_add: string;
  location_name: string;
  location_more: string;
  location_note: string;
  rsvp_deadline: string;
  bio: string;
  cash_prize: string | null;
  free_food: string | null;
  free_merch: string | null;
  cool_prize: string | null;
  host_id: string;
  public_list: boolean;
  maybe: boolean;
  rsvpfirst: boolean;
  school_id: string;
};

export default function Invite() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<EventView | null>(null);
  const [activeTab, setActiveTab] = useState<'invite' | 'share'>('invite');

  // Friends state
  const { user } = useUserStore();
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  useEffect(() => {
    const getEventDetail = async () => {
      // @ts-ignore
      const { data, error: eventErr } = await (await import('@/utils/supabase')).supabase.from('events')
        .select('*').eq('id', id).single();
      if (!eventErr) {
        setEvent(data);
      } else {
        console.log('Err');
      }
    };
    getEventDetail();
  }, [id]);

  // Fetch friends when invite tab is active
  useEffect(() => {
    if (activeTab !== 'invite' || !user?.id) return;
    setLoadingFriends(true);
    const fetchFriends = async () => {
      try {
        const supabase = (await import('@/utils/supabase')).supabase;
        const { data: friendRows, error } = await supabase
          .from('friends')
          .select('friend')
          .eq('user_id', user.id);
        if (error || !friendRows || friendRows.length === 0) {
          setFriends([]);
        } else {
          let otherUserIds = friendRows.map((row: any) => row.friend);
          otherUserIds = Array.from(new Set(otherUserIds));
          if (otherUserIds.length === 0) {
            setFriends([]);
          } else {
            const { data: profiles, error: profileError } = await supabase
              .from('users')
              .select('id, username, firstname, lastname, profile_image')
              .in('id', otherUserIds);
            if (profileError || !profiles) {
              setFriends([]);
            } else {
              setFriends(profiles);
            }
          }
        }
      } catch (err) {
        setFriends([]);
      }
      setLoadingFriends(false);
    };
    fetchFriends();
  }, [activeTab, user?.id]);

  // Background image logic
  let bgSource = defaultImages[0];
  if (event) {
    if (typeof event.image === 'string') {
      if (event.image.startsWith('file://') || event.image.startsWith('content://')) {
        bgSource = { uri: event.image };
      } else if (event.image.startsWith('default_')) {
        const idx = parseInt(event.image.replace('default_', ''), 10) - 1;
        bgSource = defaultImages[idx] || defaultImages[0];
      } else {
        bgSource = { uri: event.image };
      }
    }
  }

  return (
    <View style={styles.container}>
      {/* Background and overlay at lowest zIndex */}
      <Image
        source={bgSource}
        style={[styles.bgImage, { zIndex: 0, position: 'absolute' }]}
        blurRadius={8}
        onError={e => {
          console.log('Background image failed to load:', e.nativeEvent);
        }}
      />
      <View style={[styles.overlay, { zIndex: 1, position: 'absolute' }]} />

      {/* Content above overlay */}
      <View style={{ flex: 1, width: '100%', zIndex: 2 }}>
        {/* Header Bar and Tab Switcher */}
        <View style={tw`w-full pt-10`}>
          <View style={tw`px-4 pt-3 pb-1`}>
            <View style={tw`flex-row items-center justify-center mb-1.5`}>
              <TouchableOpacity onPress={() => router.back()} style={tw`p-1`}>
                <Back width={24} height={24} />
              </TouchableOpacity>
              <View style={tw`flex-1 flex-row items-center justify-center`}>
                <Text style={[tw`text-white text-base -ml-9`, { fontFamily: 'Nunito-ExtraBold', textAlign: 'center' }]}>Invite</Text>
              </View>
            </View>
          </View>
          {/* Tab Switcher directly below header */}
          <View style={tw`flex-row justify-around mt-2 mb-2 w-full px-6`}>
            <TouchableOpacity
              style={tw`flex-1 items-center py-2 ${activeTab === 'invite' ? 'bg-[#7A5CFA] rounded-full' : ''}`}
              onPress={() => setActiveTab('invite')}
            >
              <Text style={[tw`text-[15px] text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Invite friends</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 items-center py-2 ${activeTab === 'share' ? 'bg-[#7A5CFA] rounded-full' : ''}`}
              onPress={() => setActiveTab('share')}
            >
              <Text style={[tw`text-[15px] text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Content */}
        <View style={[tw`flex-1 w-full`, { marginTop: 8 }]}> {/* Add marginTop to ensure content is below tab */}
          {activeTab === 'invite' ? (
            <View style={tw`flex-1`}>
              {loadingFriends ? (
                <Text style={[tw`text-white text-center mt-10`, { fontFamily: 'Nunito-ExtraBold' }]}>Loading friends...</Text>
              ) : friends.length === 0 ? (
                <View style={tw`flex-1 items-center justify-center`}>
                  <Text style={[tw`text-white text-center text-[17px]`, { fontFamily: 'Nunito-ExtraBold' }]}>No friends to invite 😔</Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={tw`px-6 pb-10`}>
                  {friends.map((friend) => (
                    <TouchableOpacity
                      key={friend.id}
                      style={tw`${selectedFriends.includes(friend.id) ? 'bg-[#7A5CFA]/60' : 'bg-white/5'} flex-row items-center mb-4 border border-white/10 rounded-xl p-3`}
                      onPress={() => setSelectedFriends((prev) => {
                        const checked = prev.includes(friend.id);
                        return checked ? prev.filter((id) => id !== friend.id) : [...prev, friend.id];
                      })}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={
                          friend.profile_image && typeof friend.profile_image === 'string' && (friend.profile_image.startsWith('http') || friend.profile_image.startsWith('file://') || friend.profile_image.startsWith('content://'))
                            ? { uri: friend.profile_image }
                            : require('../../assets/images/pfp-default.png')
                        }
                        style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
                      />
                      <View style={tw`flex-1`}>
                        <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>{friend.firstname || ''} {friend.lastname || ''}</Text>
                        <Text style={[tw`text-white text-[13px] -mt-0.5`, { fontFamily: 'Nunito-Medium' }]}>@{friend.username || 'Unknown'}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : (
            <View style={tw`flex-1 items-center justify-center`}>
              <Text style={tw`text-white`}>Share UI goes here</Text>
            </View>
          )}
        </View>
      </View>
      {/* Bottom action buttons */}
      <View style={[tw`w-full flex-col px-6 pb-10 pt-3 gap-y-2`, { position: 'absolute', bottom: 0, left: 0, zIndex: 10 }]}>
        <TouchableOpacity
          style={tw`flex-1 bg-[#7A5CFA] py-3 rounded-full items-center`}
          onPress={async () => {
            if (!event || !user || selectedFriends.length === 0) return;
            const { sendInviteNotification } = await import('../utils/sendInviteNotification');
            console.log('ádin');
            for (const friendId of selectedFriends) {
              await sendInviteNotification(friendId, { id: user.id, username: user.username }, { id: event.id, title: event.title });
            }
            alert('Invitations sent!');
            setSelectedFriends([]);
          }}
          activeOpacity={0.7}
        >
          <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Invite</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`flex-1 bg-white/5 py-3 rounded-full items-center`}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    bottom: 0,
    height: undefined,
    minHeight: '100%',
    resizeMode: 'cover',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingTop: 48,
    paddingBottom: 8,
    zIndex: 2,
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'transparent',
  },
  headerBackBtn: {
    padding: 8,
    position: 'absolute',
    left: 8,
    top: 48,
    zIndex: 3,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Nunito-ExtraBold',
    textAlign: 'center',
    marginLeft: -24, // visually center due to back button
  },
  eventId: {
    fontSize: 16,
    color: '#888',
  },
});
