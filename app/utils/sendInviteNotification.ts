import { supabase } from '@/utils/supabase';

/**
 * Send an invite notification to a user for an event.
 * @param toUserId The user ID to notify
 * @param fromUser The user object of the inviter (must have username)
 * @param event The event object (must have id and title)
 */
export async function sendInviteNotification(toUserId: string, fromUser: { id: string, username: string }, event: { id: string, title: string }) {
  if (!toUserId || !fromUser?.username || !event?.id || !event?.title) return;
  const message = `@${fromUser.username} invites you to ${event.title}`;
  await supabase.from('invitenoti').insert([
    {
      user_id: toUserId,
      // type: 'invite',
      event_id: event.id,
      // event_title: event.title,
      from_user_id: fromUser.id,
      // from_username: fromUser.username,
      // message,
      created_at: new Date().toISOString(),
    }
  ]);
}
