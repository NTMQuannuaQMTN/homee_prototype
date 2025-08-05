import { useUserStore } from '@/app/store/userStore';
import { supabase } from '@/utils/supabase';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import EventCard from '../eventcard';

export default function Hosting() {
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [pastEvents, setPastEvents] = useState<any[]>([]);
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

        // Only include events where the RSVP deadline is after now
        const now = new Date().toISOString();

        let query_upcoming = supabase
            .from('events')
            .select('*')
            .eq('done', true)
            .or([`host_id.eq.${user.id}`,
            `id.in.(${userCohost.join(',')})`].filter(Boolean).join(','));
        query_upcoming = query_upcoming.gte('start', now);

        const { data: upcomingData, error: upcomingErr } = await query_upcoming;

        if (upcomingErr) {
            console.log('Yes problem in getting events');
        } else {
            // Sort upcoming events by start date/time ascending
            const sortedUpcoming = (upcomingData || []).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
            setUpcomingEvents(sortedUpcoming);
        }

        let query_past = supabase
            .from('events')
            .select('*')
            .eq('done', true)
            .or([`host_id.eq.${user.id}`,
            `id.in.(${userCohost.join(',')})`].filter(Boolean).join(','));
        query_past = query_past.lte('start', now);

        const { data: pastData, error: pastErr } = await query_past;

        if (pastErr) {
            console.log('Yes problem in getting events');
        } else {
            setPastEvents(pastData);
        }
    }

    useEffect(() => {
        fetchEvents();
    }, [user]);

    useFocusEffect(useCallback(() => {fetchEvents()}, []));

    // Handler to remove event from state after deletion
    const handleDeleteEvent = (eventId: string) => {
        setUpcomingEvents(prev => prev.filter(e => e.id !== eventId));
        setPastEvents(prev => prev.filter(e => e.id !== eventId));
    };

    return (
        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 96 }}>
            {/* If no upcoming events, show info message and create button */}
            {upcomingEvents.length === 0 && (
                <View style={tw`flex-1 justify-center items-center mt-50`}>
                    <View style={tw`flex-1 justify-center items-center mb-20`}>
                        <Text style={[tw`text-white text-[18px]`, { fontFamily: 'Nunito-ExtraBold' }]}>No events yet 😶</Text>
                        <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-Medium' }]}>Create an event today to get started!</Text>
                        <TouchableOpacity
                            style={tw`mt-4 bg-[#7A5CFA] rounded-full px-6 py-2`}
                            activeOpacity={0.7}
                            onPress={() => require('expo-router').useRouter().push('/(create)/create')}
                        >
                            <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Create event</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            {/* Event Card 1 */}
            {upcomingEvents.map((e, index) => {
                return <EventCard key={index} event={e} onDelete={handleDeleteEvent} />
            })}
            {/* Past events */}
            <View style={tw`flex-row items-center mb-2`}>
                <Text style={[tw`text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Past events</Text>
            </View>
            {/* If no past events, show info message */}
            {pastEvents.length === 0 && (
                <View style={tw`mb-16`}>
                    <Text style={[tw`text-gray-400 text-[13px] -mt-1`, { fontFamily: 'Nunito-Medium' }]}>Events you hosted will appear here once they end!</Text>
                </View>
            )}
            {/* Event Card 1 */}
            {pastEvents.map((e, index) => {
                return <EventCard key={index} event={e} onDelete={handleDeleteEvent} />
            })}
        </ScrollView>
    );
}
