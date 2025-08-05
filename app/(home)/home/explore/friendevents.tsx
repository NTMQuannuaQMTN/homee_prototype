import { useUserStore } from '@/app/store/userStore';
import { supabase } from '@/utils/supabase';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import tw from 'twrnc';
import Loader from '../../loader';
import EventCard from '../eventcard';

export default function FriendEvents() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useUserStore();

    const fetchEvents = async () => {
        setLoading(true);

        const { data: friendData, error: frErr } = await supabase.from('friends')
            .select('friend').eq('user_id', user.id);

        if (frErr) {
            console.log('Error get friends');
            return;
        }

        const friends = (friendData.map(e => e.friend));
        console.log('Friends:', friends);

        const { data: hostEvents, error: hosErr } = await supabase.from('hosts')
            .select('event_id').eq('user_id', user.id);

        if (hosErr) {
            console.log('Error get host events');
            return;
        }

        const userCohost = (hostEvents ? hostEvents.map(e => e.event_id) : []);
        console.log('User cohost', userCohost);

        const { data: friendEvents, error: frevErr } = await supabase.from('hosts')
            .select('event_id').in('user_id', friends);

        if (frevErr) {
            console.log('Error get host events');
            return;
        }

        const friendCohost = (friendEvents ? friendEvents.map(e => e.event_id) : []);
        console.log('Friend cohost', friendCohost);

        let query = supabase
            .from('events')
            .select('*')
            .neq('host_id', user.id)
            .eq('done', true)
            .not('id', 'in', `(${userCohost.join(',')})`)
            .or(
                [
                    `host_id.in.(${friends.join(',')})`,
                    `id.in.(${friendCohost.join(',')})`
                ].filter(Boolean).join(',')
            )
        // Only include events where the RSVP deadline is after now
        const now = new Date().toISOString();
        query = query.gte('rsvp_deadline', now);

        const { data, error } = await query;

        if (error) {
            console.log('Yes problem in getting events');
        } else {
            setEvents(data);
        }

        setLoading(false);
    }

    useEffect(() => {
        fetchEvents();
    }, [user]);

    useFocusEffect(useCallback(() => {fetchEvents()}, []));

    return (
        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 96 }}>
            {loading ? <Loader /> :
                (events.map((e, index) => {
                    // console.log(e);
                    return (
                        <EventCard
                            key={index}
                            event={e}
                            fromFriendsEvents={true}
                            onReportEvent={(eventId: string) => {
                                // TODO: Implement report event logic/modal here
                                console.log('Report event:', eventId);
                                // You can show a modal, send to API, etc.
                            }}
                        />
                    );
                }))
            }
        </ScrollView>
    );
}