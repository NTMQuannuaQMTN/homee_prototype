// Fetch invite notifications for a user from 'invitenoti' table
export async function fetchInviteNotifications(userId: string) {
  const { data, error } = await supabase
    .from('invitenoti')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data;
}

// Delete all invite notifications for an event (call when event starts)
export async function deleteInviteNotificationsForEvent(eventId: string) {
  const { error } = await supabase
    .from('invitenoti')
    .delete()
    .eq('event_id', eventId);
  return error == null;
}
// Fetch RSVP notifications for events where the user is a guest (not host)
export async function fetchGuestRSVPNotifications(userId: string) {
  // 1. Find all guests where user is a guest (not host)
  const { data: guestRows, error: guestError } = await supabase
    .from('guests')
    .select('event_id, decision, created_at')
    .eq('user_id', userId);

  if (guestError || !guestRows || guestRows.length === 0) {
    return [];
  }

  // 2. Fetch event info for these event_ids
  const eventIds = guestRows.map(g => g.event_id);
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, start, host_id')
    .in('id', eventIds);

  if (eventsError || !events || events.length === 0) {
    return [];
  }

  // 3. Build notifications for each RSVP
  const notifications = guestRows.map(g => {
    const event = events.find(e => e.id === g.event_id);
    return {
      type: 'guest_rsvp',
      event_id: g.event_id,
      event_title: event?.title || '',
      event_start: event?.start || '',
      host_id: event?.host_id || '',
      decision: g.decision,
      created_at: g.created_at,
    };
  });
  // Sort by event start desc
  notifications.sort((a, b) => new Date(b.event_start).getTime() - new Date(a.event_start).getTime());
  return notifications;
}
// Fetch RSVP notifications for events hosted by the user
export async function fetchEventRSVPNotifications(hostId: string) {
  // 1. Find all events where user is a host (events table)
  const { data: hostEvents, error: hostEventsError } = await supabase
    .from('events')
    .select('id')
    .eq('host_id', hostId);

//   console.log('[RSVP DEBUG] hostEvents:', hostEvents, 'error:', hostEventsError);
  if (hostEventsError || !hostEvents || hostEvents.length === 0) {
    return [];
  }

  const eventIds = hostEvents.map(e => e.id);
//   console.log('[RSVP DEBUG] eventIds:', eventIds);
  if (eventIds.length === 0) return [];

  // 2. Fetch all guests for these events (excluding the host themselves)
  const { data: guests, error: guestsError } = await supabase
    .from('guests')
    .select('user_id, event_id, decision, created_at')
    .in('event_id', eventIds)
    .neq('user_id', hostId);

//   console.log('[RSVP DEBUG] guests:', guests, 'error:', guestsError);
  if (guestsError || !guests) {
    return [];
  }

  // 3. Fetch event titles
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title')
    .in('id', eventIds);
//   console.log('[RSVP DEBUG] events:', events, 'error:', eventsError);
  if (eventsError || !events) {
    return [];
  }

  // 4. Fetch guest usernames
  const guestUserIds = [...new Set(guests.map(g => g.user_id))];
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username, profile_image')
    .in('id', guestUserIds);
//   console.log('[RSVP DEBUG] users:', users, 'error:', usersError);
  if (usersError || !users) {
    return [];
  }

  // 5. Build notifications
  const notifications = guests.map(g => {
    const event = events.find(e => e.id === g.event_id);
    const user = users.find(u => u.id === g.user_id);
    let action = '';
    if (g.decision === 'Going') action = 'Going 🥳';
    else if (g.decision === 'Maybe') action = 'Maybe 🤔';
    else if (g.decision === "Nope" || g.decision === "Can't go" || g.decision === 'Cant go' || g.decision === "Can't Go") action = "Can't go 😭";
    else action = g.decision;
    return {
      type: 'event',
      event_id: g.event_id,
      event_title: event?.title || '',
      guest_id: g.user_id,
      guest_username: user?.username || '',
      guest_profile_image: user?.profile_image || null,
      decision: g.decision,
      action: action,
      created_at: g.created_at,
      message: `@${user?.username || 'Someone'} chooses ${action} to your "${event?.title || ''}" event.`
    };
  });
//   console.log('[RSVP DEBUG] notifications:', notifications);
  // Sort by created_at desc
  notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return notifications;
}
import { supabase } from '@/utils/supabase';


export async function fetchFriendRequestNotifications(userId: string) {
  // Fetch friend requests, include created_at and profile_image
  const { data: requests, error: reqError } = await supabase
    .from('requests')
    .select('user_id, user:users!requests_user_id_fkey(username,profile_image), created_at')
    .eq('requestee', userId);

  if (reqError) {
    console.error('Error fetching notifications:', reqError);
    return [];
  }

  // Fetch friends for current user
  const { data: friends, error: friendError } = await supabase
    .from('friends')
    .select('user_id, friend')
    .or(`user_id.eq.${userId},friend.eq.${userId}`);

  if (friendError) {
    console.error('Error fetching friends:', friendError);
    return [];
  }

  // Build notification list
  const notifs = (requests || []).map((req) => {
    // Check if friendship exists
    const isFriend = (friends || []).some(f =>
      (f.user_id === userId && f.friend === req.user_id) ||
      (f.user_id === req.user_id && f.friend === userId)
    );
    return {
      ...req,
      isFriend,
    };
  });
  return notifs;
}
