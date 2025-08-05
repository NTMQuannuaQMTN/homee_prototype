import { useUserStore } from '@/app/store/userStore';
import { supabase } from '@/utils/supabase';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import tw from 'twrnc';
import EventCard from '../eventcard';

export default function AllEvents() {
    const [events, setEvents] = useState<any[]>([]);
    const { user } = useUserStore();

    // const fetchEvents = async () => {
    //     let query = supabase
    //         .from('events')
    //         .select('*')
    //         .eq('done', true)
    //         .eq('school_id', user.school_id)
    //         .neq('host_id', user.id);
    //     // Only include events where the RSVP deadline is after now
    //     const now = new Date().toISOString();
    //     query = query.lte('rsvp_deadline', now);

    //     const { data, error } = await query;

    //     if (error) {
    //         console.log('Yes problem in getting events');
    //     } else {
    //         setEvents(data);
    //     }
    // }

    // useEffect(() => {
    //     fetchEvents();
    // }, [user]);

    // useFocusEffect(useCallback(() => { fetchEvents() }, []));

    return (
        <ScrollView style={tw`flex-1`} contentContainerStyle={{ paddingBottom: 96 }}>
            {/* Upcoming hit event */}
            <View style={tw`flex-row items-center mb-2`}>
                <Text style={[tw`text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>🔥 Upcoming hit event</Text>
            </View>
            {/* Event Card 1 */}
            {events.map((e, index) => {
                return <EventCard key={index} event={e}
                    fromFriendsEvents={true}
                    onReportEvent={(eventId: string) => {
                        // TODO: Implement report event logic/modal here
                        console.log('Report event:', eventId);
                        // You can show a modal, send to API, etc.
                    }} />
            })}

        </ScrollView>
    );
}
