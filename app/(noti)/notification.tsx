// Separate component for Maybe reminder notification card
const MaybeReminderCard = ({ notif, isRead, notifId, markAsRead, router, eventTitle, timeString }: any) => {
  const [showDecisionModal, setShowDecisionModal] = React.useState(false);
  const [decision, setDecision] = React.useState('Maybe');
  const [badgeColor, setBadgeColor] = React.useState('bg-yellow-600');
  const [userId, setUserId] = React.useState(notif.user_id || null);

  React.useEffect(() => {
    // If user_id is not present, fetch it from guests table (for guest RSVP reminders)
    if (!userId && notif.event_id) {
      (async () => {
        const { data } = await supabase
          .from('guests')
          .select('user_id')
          .eq('event_id', notif.event_id)
          .single();
        if (data && data.user_id) setUserId(data.user_id);
      })();
    }
  }, [notif.event_id, userId]);

  // Update badge color and emoji based on decision
  React.useEffect(() => {
    if (decision === 'Going') setBadgeColor('bg-green-500');
    else if (decision === 'Maybe') setBadgeColor('bg-yellow-600');
    else if (decision === 'Nope' || decision === "Can't go" || decision === 'Cant go') setBadgeColor('bg-rose-600');
    else setBadgeColor('bg-gray-500');
  }, [decision]);

  // Badge label and emoji
  const getBadge = () => {
    if (decision === 'Going') return (<><Text style={[tw`text-white text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>I’m going </Text><Text style={[tw`text-white text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>🥳</Text></>);
    if (decision === 'Maybe') return (<><Text style={[tw`text-white text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Eh...maybe </Text><Text style={[tw`text-white text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>🤔</Text></>);
    if (decision === 'Nope' || decision === "Can't go" || decision === 'Cant go') return (<><Text style={[tw`text-white text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>I can't </Text><Text style={[tw`text-white text-[14px] -mt-0.5`, { fontFamily: 'Nunito-ExtraBold' }]}>😭</Text></>);
    return (<Text style={[tw`text-white text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>{decision}</Text>);
  };

  // Message above badge
  const getMessage = () => {
    if (decision === 'Going') return (<Text style={{ color: 'white', fontSize: 15, marginTop: 2 }}><Text style={{ fontFamily: 'Nunito-Medium' }}>You’re going to </Text><Text style={{ fontFamily: 'Nunito-ExtraBold' }}>{eventTitle ? `"${eventTitle}"` : ''}</Text><Text style={{ fontFamily: 'Nunito-Medium' }}>! See you there 🎉</Text></Text>);
    if (decision === 'Maybe') return (<Text style={{ color: 'white', fontSize: 15, marginTop: 2 }}><Text style={{ fontFamily: 'Nunito-Medium' }}>Event </Text><Text style={{ fontFamily: 'Nunito-ExtraBold' }}>{eventTitle ? `"${eventTitle}"` : ''}</Text><Text style={{ fontFamily: 'Nunito-Medium' }}> starts in 24 hours! Want to change your mind?</Text></Text>);
    if (decision === 'Nope' || decision === "Can't go" || decision === 'Cant go') return (<Text style={{ color: 'white', fontSize: 15, marginTop: 2 }}><Text style={{ fontFamily: 'Nunito-Medium' }}>You can’t make it to </Text><Text style={{ fontFamily: 'Nunito-ExtraBold' }}>{eventTitle ? `"${eventTitle}"` : ''}</Text><Text style={{ fontFamily: 'Nunito-Medium' }}> 😭</Text></Text>);
    return null;
  };

  // Handle RSVP change
  const handleDecisionChange = async (newDecision: string) => {
    setDecision(newDecision);
    // Update RSVP in DB
    if (notif.event_id && userId) {
      const { error } = await supabase.from('guests')
        .update({ decision: newDecision, created_at: new Date().toISOString() })
        .eq('event_id', notif.event_id)
        .eq('user_id', userId);
      if (error) {
        console.error('[RSVP DEBUG] Error updating RSVP:', error);
      }
    }
    setShowDecisionModal(false);
  };

  return (
    <View style={tw`${isRead ? 'bg-white/5' : 'bg-yellow-600/80'} rounded-xl p-4 mb-3`}>
      <TouchableOpacity
        activeOpacity={0.5}
        onPress={() => {
          if (!isRead) markAsRead(notifId);
          if (notif.event_id) {
            router.push({ pathname: '/(event)/event', params: { id: notif.event_id, status: '' } });
          }
        }}
      >
        <Text style={{ color: 'white', fontFamily: 'Nunito-ExtraBold', fontSize: 15 }}>
          {decision === 'Maybe' ? '🤔 Still thinking?' : decision === 'Going' ? '🥳 RSVP updated!' : decision === 'Nope' || decision === "Can't go" || decision === 'Cant go' ? '😭 RSVP updated!' : ''}
        </Text>
        {getMessage()}
        {/* Decision badge */}
        <TouchableOpacity
          style={tw`self-start mt-3 px-3 py-1.5 ${badgeColor} z-99 rounded-full flex-row items-center`}
          onPress={() => setShowDecisionModal(true)}
          activeOpacity={0.8}
        >
          {getBadge()}
        </TouchableOpacity>
        {timeString && (
          <Text style={[tw`text-gray-400 text-xs mt-2`, { fontFamily: 'Nunito-Regular' }]}>{timeString}</Text>
        )}
      </TouchableOpacity>
      {/* Decision modal (reusing from (home)/home/eventDecision.tsx) */}
      <DecisionModal
        visible={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        eventTitle={eventTitle}
        maybe={true}
        onSelect={(d) => {handleDecisionChange(d)}}
      />
    </View>
  );
};
function getRelativeTime(dateString: string) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 31) return `${diffDay}d ago`;
  const diffMo = Math.floor(diffDay / 30);
  return `${diffMo}mo ago`;
}
import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

import BackIcon from '../../assets/icons/back.svg';
import PfpDefault from '../../assets/icons/pfpdefault.svg';

import DecisionModal from '../(home)/home/eventDecision';
import BotBar from '../botbar';
import { useUserStore } from '../store/userStore';
import { fetchEventRSVPNotifications, fetchFriendRequestNotifications, fetchInviteNotifications } from '../utils/notificationsUtils';
// Accept friend request
async function handleAcceptFriend(myId: string, friendId: string, refresh: () => void) {
  const { error: addError } = await supabase.from('friends')
    .insert([{ user_id: myId, friend: friendId }, { user_id: friendId, friend: myId }]).select();
  if (addError) {
    alert('Problems in adding friend');
  }
  // Remove request after accepting
  await supabase.from('requests')
    .delete()
    .eq('user_id', friendId)
    .eq('requestee', myId);
  refresh();
}

// Cancel friend request
async function handleCancelRequest(myId: string, friendId: string, refresh: () => void) {
  await supabase.from('requests')
    .delete()
    .eq('user_id', friendId)
    .eq('requestee', myId);
  refresh();
}


const TABS = [
  { key: 'all', label: 'All' },
  { key: 'events', label: 'Events' },
  { key: 'reminder', label: 'Reminders' },
  { key: 'friend', label: 'Friend requests' },
];


// Helper to get a unique notification id (for local read state)
function getNotifId(notif: any) {
  if (notif.type === 'friend' || notif.user) {
    return `friend_${notif.user_id}_${notif.created_at}`;
  }
  if (notif.type === 'reminder') {
    // Use event_id and reminder window (24h/2h) for stable id
    let window = 'reminder';
    if (notif.message && notif.message.toLowerCase().includes('tomorrow')) window = '24h';
    else if (notif.message && notif.message.toLowerCase().includes('two hours')) window = '2h';
    return `reminder_${notif.event_id}_${window}`;
  }
  // For event notifications, use event id or created_at
  return `event_${notif.id || ''}_${notif.created_at || ''}`;
}

const NotificationScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const [friendNotifications, setFriendNotifications] = useState<any[]>([]);
  // Placeholder for event notifications
  const [eventNotifications, setEventNotifications] = useState<any[]>([]);
  // Invite notifications
  const [inviteNotifications, setInviteNotifications] = useState<any[]>([]);
  // Placeholder for reminder notifications (generated client-side)
  const [reminderNotifications, setReminderNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  // Store read notification ids in local state
  const [readNotifs, setReadNotifs] = useState<string[]>([]);

  // Key for AsyncStorage
  const READ_NOTIFS_KEY = 'readNotifs';

  // Load read notifications from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(READ_NOTIFS_KEY);
        if (stored) setReadNotifs(JSON.parse(stored));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Helper to mark a notification as read and persist
  const markAsRead = (notifId: string) => {
    setReadNotifs(prev => {
      if (prev.includes(notifId)) return prev;
      const updated = [...prev, notifId];
      // Persist after state is set
      setTimeout(() => {
        AsyncStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(updated));
      }, 0);
      return updated;
    });
  };

  // Fetch friend, event, and generate reminder notifications
  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    const friendNotifs = await fetchFriendRequestNotifications(user.id);
    setFriendNotifications(friendNotifs);
    // Fetch event RSVP notifications for events hosted by the user
    const eventNotifs = await fetchEventRSVPNotifications(user.id);
    setEventNotifications(eventNotifs);
    // Fetch invite notifications for this user
    const inviteNotifs = await fetchInviteNotifications(user.id);
    setInviteNotifications(inviteNotifs);

    // Dynamically generate reminders for events the user is attending as 'Going' or 'Maybe'
    // 1. Fetch all guests for this user where decision is 'Going' or 'Maybe'
    const { data: guestRows, error: guestError } = await supabase
      .from('guests')
      .select('event_id, decision, created_at')
      .eq('user_id', user.id)
      .in('decision', ['Going', 'Maybe']);

    if (!guestRows || guestRows.length === 0) {
      setReminderNotifications([]);
      setLoading(false);
      return;
    }

    // 2. Fetch event info for these event_ids
    const eventIds = guestRows.map(g => g.event_id);
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, start')
      .in('id', eventIds);

    if (!events || events.length === 0) {
      setReminderNotifications([]);
      setLoading(false);
      return;
    }

    // 3. For each event, check if now is within 24h or 2h before start_time
    const now = new Date();
    const reminders = [];
    for (const g of guestRows) {
      const event = events.find(e => e.id === g.event_id);
      if (!event || !event.start) continue;
      const start = new Date(event.start);
      const diffMs = start.getTime() - now.getTime();
      const diffMins = diffMs / (1000 * 60);
      // 24h reminder for 'Going': show only if event starts in exactly 24 hours (within ±15 minutes)
      if (g.decision === 'Going' && diffMins - 1440 <= 2.5) {
        // Format event start time as e.g. '3:00 PM'
        const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        // Set created_at to event start minus 24h
        const reminderTime = new Date(start.getTime() - 24 * 60 * 60 * 1000);
        reminders.push({
          type: 'reminder',
          event_id: event.id,
          event_title: event.title,
          created_at: reminderTime.toISOString(),
          message: `Quick reminder: your "${event.title}" starts tomorrow at ${startTime}!`,
        });
      }
      // 24h reminder for 'Maybe': show only if event starts in exactly 24 hours (within ±15 minutes)
      else if (g.decision === 'Maybe' && diffMins - 1440 <= 2.5) {
        const reminderTime = new Date(start.getTime() - 24 * 60 * 60 * 1000);
        reminders.push({
          type: 'reminder',
          event_id: event.id,
          event_title: event.title,
          created_at: reminderTime.toISOString(),
          message: `Hey yo, the ${event.title} will start in 24 hours! Want to change your decision?`,
        });
      }
      // 2h reminder for 'Going': show only if event starts in exactly 2 hours (within ±10 minutes)
      else if (g.decision === 'Going' && Math.abs(diffMins - 120) <= 10) {
        // Set created_at to event start minus 2h
        const reminderTime = new Date(start.getTime() - 2 * 60 * 60 * 1000);
        reminders.push({
          type: 'reminder',
          event_id: event.id,
          event_title: event.title,
          created_at: reminderTime.toISOString(),
          message: `Your event "${event.title}" will start in two hours!`,
        });
      }
    }
    setReminderNotifications(reminders);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Helper to render a notification card (friend, event, or reminder)
  const renderNotificationCard = (notif: any, idx: number) => {
    // Unique id for read state
    const notifId = getNotifId(notif);
    const isRead = readNotifs.includes(notifId);
    // Friend request notification
    if (notif.type === 'friend' || notif.user) {
      const timeString = notif.created_at ? getRelativeTime(notif.created_at) : '';
      const profileId = notif.user?.id || notif.user_id;
      const showActions = !notif.isFriend;
      return (
        <View key={idx} style={tw`${isRead ? 'bg-white/5' : 'bg-[#7A5CFA]/70'} rounded-xl p-4 mb-3`}>
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => {
              if (!isRead) markAsRead(notifId);
              if (showActions && profileId) {
                router.push({ pathname: '/(profile)/profile', params: { user_id: profileId } });
              }
            }}
          >
            <View style={tw`flex-row items-center`}>
              {notif.user?.profile_image ? (
                <View style={tw`w-7 h-7 rounded-full overflow-hidden mr-2 bg-white/20 items-center justify-center`}>
                  <Image
                    source={{ uri: notif.user.profile_image }}
                    style={{ width: 28, height: 28, borderRadius: 14 }}
                  />
                </View>
              ) : (
                <View style={tw`w-7 h-7 rounded-full overflow-hidden mr-2 bg-white/20 items-center justify-center`}>
                  <PfpDefault width={24} height={24} />
                </View>
              )}
              <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>@{notif.user?.username || notif.user_id || 'Someone'}</Text>
              <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-Medium' }]}>{notif.isFriend ? ' and you are now friends!' : ' wants to be your friend'}</Text>
            </View>
            {timeString && (
              <Text style={[tw`text-gray-400 text-xs mt-2`, { fontFamily: 'Nunito-Regular' }]}>{timeString}</Text>
            )}
          </TouchableOpacity>
          {showActions && (
            <View style={tw`flex-row gap-2 mt-2.5`}>
              <TouchableOpacity
                style={tw`flex-1 py-2.5 rounded-xl bg-[#22C55E] items-center`}
                onPress={async () => {
                  await handleAcceptFriend(user.id, notif.user_id, () => {
                    fetchNotifications();
                  });
                }}
              >
                <View style={tw`flex-row items-center justify-center`}>
                  <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Accept</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 py-2.5 rounded-xl bg-rose-600 items-center`}
                onPress={async () => {
                  await handleCancelRequest(user.id, notif.user_id, () => {
                    fetchNotifications();
                  });
                }}
              >
                <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }
    // Invite notification
    if (notif.type === 'invite' || (notif.message && notif.message.includes('invites you to'))) {
      const timeString = notif.created_at ? getRelativeTime(notif.created_at) : '';
      return (
        <View key={idx} style={tw`${isRead ? 'bg-white/5' : 'bg-[#7A5CFA]/70'} rounded-xl p-4 mb-3`}>
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => {
              if (!isRead) markAsRead(notifId);
              if (notif.event_id) {
                router.push({ pathname: '/(event)/event', params: { id: notif.event_id, status: '' } });
              }
            }}
          >
            <Text style={{ color: 'white', fontFamily: 'Nunito-ExtraBold', fontSize: 15 }}>
              {notif.message}
            </Text>
            {timeString && (
              <Text style={[tw`text-gray-400 text-xs mt-2`, { fontFamily: 'Nunito-Regular' }]}>{timeString}</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }
    // Reminder notification for guests ("Going" or "Maybe")
    if (notif.type === 'reminder') {
      const timeString = notif.created_at ? getRelativeTime(notif.created_at) : '';
      let eventTitle = notif.event_title || '';
      // Detect if this is a 'Maybe' reminder by message content
      const isMaybe = notif.message && notif.message.startsWith('Hey yo, the');
      if (isMaybe) {
        // UI for 'Maybe' reminder
        console.log(notif);
        return (
          <MaybeReminderCard
            notif={notif}
            isRead={isRead}
            notifId={notifId}
            markAsRead={markAsRead}
            router={router}
            eventTitle={eventTitle}
            timeString={timeString}
            key={idx}
          />
        );
      } else {
        // UI for 'Going' reminder (original)
        let timeStr = '';
        if (notif.message && notif.message.includes('at')) {
          // Extract time from message
          const match = notif.message.match(/at (.+)!$/);
          if (match) timeStr = match[1];
        }
        return (
          <View key={idx} style={tw`${isRead ? 'bg-white/5' : 'bg-[#7A5CFA]/70'} rounded-xl p-4 mb-3`}>
            <TouchableOpacity
              activeOpacity={0.5}
              onPress={() => {
                if (!isRead) markAsRead(notifId);
                if (notif.event_id) {
                  router.push({ pathname: '/(event)/event', params: { id: notif.event_id, status: '' } });
                }
              }}
            >
              {/* 1st line: Quick reminder */}
              <Text style={{ color: 'white', fontFamily: 'Nunito-ExtraBold', fontSize: 15 }}>
                🔔 Quick reminder
              </Text>
              {/* 2nd line: Your {event title} starts tomorrow at {time} */}
              <Text style={{ color: 'white', fontSize: 15, marginTop: 2 }}>
                <Text style={{ fontFamily: 'Nunito-Medium' }}>Your </Text>
                <Text style={{ fontFamily: 'Nunito-ExtraBold' }}>
                  "{eventTitle}"
                </Text>
                <Text style={{ fontFamily: 'Nunito-Medium' }}> event starts tomorrow{timeStr ? ' at ' : ''}</Text>
                {timeStr ? <Text style={{ fontFamily: 'Nunito-ExtraBold' }}>{timeStr}</Text> : null}
                <Text style={{ fontFamily: 'Nunito-Medium' }}>. Don't forget :) </Text>
              </Text>
              {timeString && (
                <Text style={[tw`text-gray-400 text-xs mt-2`, { fontFamily: 'Nunito-Regular' }]}>{timeString}</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      }
    }
    // Event RSVP notification
    const timeString = notif.created_at ? getRelativeTime(notif.created_at) : '';
    // Decision badge color logic
    let badgeColor = 'bg-gray-500';
    const dec = notif.decision ? notif.decision.toLowerCase() : '';
    if (dec === 'going') badgeColor = 'bg-green-500';
    else if (dec === 'maybe') badgeColor = 'bg-yellow-600';
    else if (dec === 'nope' || dec === "can't go" || dec === 'cant go' || dec === "can't go") badgeColor = 'bg-rose-600';

    return (
      <View key={idx} style={tw`${isRead ? 'bg-white/5' : 'bg-[#7A5CFA]/70'} rounded-xl p-4 mb-3`}>
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => {
            if (!isRead) markAsRead(notifId);
            // Navigate to event page
            if (notif.event_id) {
              router.push({ pathname: '/(event)/event', params: { id: notif.event_id, status: 'Host' } });
            }
          }}
        >
          <View style={tw`flex-row items-start`}>
            {/* Avatar */}
            {notif.guest_profile_image ? (
              <View style={tw`w-7 h-7 rounded-full overflow-hidden mr-2 bg-white/20 items-center justify-center mt-0.5`}>
                <Image
                  source={{ uri: notif.guest_profile_image }}
                  style={{ width: 28, height: 28, borderRadius: 14 }}
                />
              </View>
            ) : (
              <View style={tw`w-7 h-7 rounded-full overflow-hidden mr-2 bg-white/20 items-center justify-center mt-0.5`}>
                <PfpDefault width={24} height={24} />
              </View>
            )}
            {/* Message */}
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontFamily: 'Nunito-ExtraBold', fontSize: 15 }}>
                @{notif.guest_username || 'Someone'}{' '}
                <Text style={{ fontFamily: 'Nunito-Medium' }}>has responded to your </Text>
                <Text style={{ fontFamily: 'Nunito-ExtraBold' }}>
                  {notif.event_title ? `"${notif.event_title}"` : 'an event'}
                </Text>
                <Text style={{ fontFamily: 'Nunito-Medium' }}> event</Text>
              </Text>
              {notif.decision && (
                <Text
                  style={[
                    tw`rounded-full px-2 pb-1 pt-0.5 mt-2 self-start`,
                    {
                      backgroundColor:
                        badgeColor === 'bg-green-500' ? '#22C55E' :
                        badgeColor === 'bg-yellow-600' ? '#CA8A04' :
                        badgeColor === 'bg-rose-600' ? '#E11D48' :
                        badgeColor === 'bg-gray-500' ? '#6B7280' :
                        undefined,
                      color: 'white',
                      fontFamily: 'Nunito-ExtraBold',
                      fontSize: 15,
                      overflow: 'hidden',
                    },
                  ]}
                >
                  {notif.action ? notif.action.toUpperCase() : ''}
                </Text>
              )}
            </View>
          </View>
          {timeString && (
            <Text style={[tw`text-gray-400 text-xs mt-2`, { fontFamily: 'Nunito-Regular' }]}>{timeString}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  let tabContent: React.ReactNode = null;
  if (loading) {
    tabContent = (
      <View style={tw`flex-1 items-center justify-center -mt-30`}>
        <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Loading...</Text>
      </View>
    );
  } else if (activeTab === 'friend') {
    tabContent = friendNotifications.length === 0 ? (
      <View style={tw`flex-1 items-center justify-center -mt-30`}>
        <Text style={[tw`text-white text-[17px]`, { fontFamily: 'Nunito-ExtraBold' }]}>You've checked all your requests 🎉</Text>
        <Text style={[tw`text-white text-[15px] mt-0.5`, { fontFamily: 'Nunito-Medium' }]}>Or, you haven't had any yet :(</Text>
      </View>
    ) : (
      <ScrollView contentContainerStyle={tw`px-4 pt-2 pb-8`}>
        {friendNotifications.map((notif, idx) => renderNotificationCard({ ...notif, type: 'friend' }, idx))}
      </ScrollView>
    );
  } else if (activeTab === 'events') {
    // Show only event RSVP notifications in the Events tab
    const onlyEventNotifs = eventNotifications.map(n => ({ ...n, type: 'event' }));
    onlyEventNotifs.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    tabContent = onlyEventNotifs.length === 0 ? (
      <View style={tw`flex-1 items-center justify-center -mt-30`}>
        <Text style={[tw`text-white text-[17px]`, { fontFamily: 'Nunito-ExtraBold' }]}>No event notifications yet 🙄</Text>
        <Text style={[tw`text-white text-[15px] mt-0.5`, { fontFamily: 'Nunito-Medium' }]}>Stay tuned for updates!</Text>
      </View>
    ) : (
      <ScrollView contentContainerStyle={tw`px-4 pt-2 pb-8`}>
        {onlyEventNotifs.map((notif, idx) => renderNotificationCard(notif, idx))}
      </ScrollView>
    );
  } else if (activeTab === 'reminder') {
    // Show only reminder notifications in the Reminder tab
    const onlyReminders = reminderNotifications.map(n => ({ ...n, type: 'reminder' }));
    onlyReminders.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    tabContent = onlyReminders.length === 0 ? (
      <View style={tw`flex-1 items-center justify-center -mt-30`}>
        <Text style={[tw`text-white text-[17px]`, { fontFamily: 'Nunito-ExtraBold' }]}>No reminders yet ⏰</Text>
        <Text style={[tw`text-white text-[15px] mt-0.5`, { fontFamily: 'Nunito-Medium' }]}>Reminders will show up here before your events!</Text>
      </View>
    ) : (
      <ScrollView contentContainerStyle={tw`px-4 pt-2 pb-24`}>
        {onlyReminders.map((notif, idx) => renderNotificationCard(notif, idx))}
      </ScrollView>
    );
  } else if (activeTab === 'all') {
    // Show all notifications (friend, event RSVP, reminders, invites)
    const allNotifications = [
      ...friendNotifications.map(n => ({ ...n, type: 'friend' })),
      ...eventNotifications.map(n => ({ ...n, type: 'event' })),
      ...reminderNotifications.map(n => ({ ...n, type: 'reminder' })),
      ...inviteNotifications.map(n => ({ ...n, type: 'invite' })),
    ];
    allNotifications.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    tabContent = allNotifications.length === 0 ? (
      <View style={tw`flex-1 items-center justify-center -mt-30`}>
        <Text style={[tw`text-white text-[17px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Yay! No more notifications 🎉</Text>
        <Text style={[tw`text-white text-[15px] mt-0.5`, { fontFamily: 'Nunito-Medium' }]}>Or, it's just started...</Text>
      </View>
    ) : (
      <ScrollView contentContainerStyle={tw`px-4 pt-2 pb-8`}>
        {allNotifications.map((notif, idx) => renderNotificationCard(notif, idx))}
      </ScrollView>
    );
  } else {
    tabContent = (
      <View style={tw`flex-1 items-center justify-center -mt-30`}>
        <Text style={[tw`text-white text-[17px]`, { fontFamily: 'Nunito-ExtraBold' }]}>No event notifications yet 🙄</Text>
        <Text style={[tw`text-white text-[15px] mt-0.5`, { fontFamily: 'Nunito-Medium' }]}>Stay tuned for updates!</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#080B32', '#0E1241', '#291C56', '#392465', '#51286A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Top Bar copied from QRProfile */}
      <View style={tw`w-full flex-row items-center mb-2 px-4 pt-14 relative`}>
        <TouchableOpacity
          onPress={() => router.replace('/home/homepage')}
          style={tw`absolute left-0 px-4 pt-14`}
          accessibilityLabel="Back to homepage"
        >
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
        <View style={tw`flex-1 items-center justify-center`}>
          <Text style={[tw`text-white text-base`, { fontFamily: 'Nunito-ExtraBold' }]}>Notifications</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={tw`flex-row justify-left px-5 mt-2 mb-1 gap-x-2`}>
        {TABS.map((tab, idx) => (
          <React.Fragment key={tab.key}>
            <TouchableOpacity
              style={tw`items-center pb-2`}
              onPress={() => setActiveTab(tab.key)}
              accessibilityLabel={tab.label}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  tw`text-[14px]`,
                  { fontFamily: activeTab === tab.key ? 'Nunito-ExtraBold' : 'Nunito-Medium', color: 'white', opacity: activeTab === tab.key ? 1 : 0.6 },
                ]}
              >
                {tab.label}
              </Text>
              {activeTab === tab.key && (
                <View
                  style={{
                    height: 2.5,
                    backgroundColor: 'white',
                    borderRadius: 2,
                    marginTop: 4,
                    alignSelf: 'center',
                    width: '100%',
                  }}
                />
              )}
            </TouchableOpacity>
            {idx < TABS.length - 1 && <View style={tw`w-2`} />}
          </React.Fragment>
        ))}
      </View>

      <View style={[tw`flex-1`]}>
        {tabContent}
      </View>
      <BotBar currentTab="noti" />
    </LinearGradient>
  );
};

export default NotificationScreen;
