import { useUserStore } from '@/app/store/userStore';
import { supabase } from '@/utils/supabase';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import tw from 'twrnc';
import EventCard from '../eventcard';

export default function Attended() {
    const [attendedEvents, setAttendedEvents] = useState<any[]>([]);
    const { user } = useUserStore();

    const fetchEvents = async () => {
        const { data: hostEvents, error: hosErr } = await supabase.from('hosts')
            .select('event_id').eq('user_id', user.id);

        if (hosErr) {
            console.log('Error get host events');
            return;
        }

        const userCohost = (hostEvents ? hostEvents.map(e => e.event_id) : []);
        console.log('User cohost', userCohost);

        const { data: joinEvents, error: joinErr } = await supabase.from('guests')
            .select('event_id').eq('user_id', user.id).eq('decision', 'Going');

        if (joinErr) {
            console.log('Error get join events');
            return;
        }

        const userJoin = (joinEvents ? joinEvents.map(e => e.event_id) : []);

        // Only include events where the RSVP deadline is after now
        const now = new Date().toISOString();

        let query_upcoming = supabase
            .from('events')
            .select('*')
            .eq('done', true)
            .neq('host_id', user.id)
            .not('id', 'in', `(${userCohost.join(',')})`)
            .in('id', userJoin);
        query_upcoming = query_upcoming.lte('start', now);

        const { data: upcomingData, error: upcomingErr } = await query_upcoming;

        if (upcomingErr) {
            console.log('Yes problem in getting events');
        } else {
            console.log(upcomingData);
            setAttendedEvents(upcomingData || []);
        }
    }

    useEffect(() => {
        fetchEvents();
    }, [user]);

    useFocusEffect(useCallback(() => {fetchEvents()}, []));

    return (
        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 96 }}>
            {/* Event Card 1 */}
            {attendedEvents.map((e, index) => {
                return <EventCard key={index} event={e} />
            })}
        </ScrollView>
    );
}
