import { supabase } from '@/utils/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

import defaultImages from '../(create)/defaultimage';
import Back from '../../assets/icons/back.svg';


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
}

export default function EventGuests() {
    const { id, hosting } = useLocalSearchParams();
    const [event, setEvent] = useState<EventView | null>(null);
    const [rsvp, setRSVP] = useState<any[]>([]);
    const [selectedTab, setSelectedTab] = useState('All');

    useEffect(() => {
        const getEventDetail = async () => {
            const { data, error: eventErr } = await supabase.from('events')
                .select('*').eq('id', id).single();

            if (!eventErr) {
                setEvent(data);
            } else {
                console.log('Err');
            }
        }

        getEventDetail();
    }, [id]);

    useEffect(() => {
        const getRSVP = async () => {
            // Also select created_at for registration time
            const { data, error } = await supabase
                .from('guests')
                .select('decision, user_id, created_at, users(profile_image, firstname, lastname, username)')
                .eq('event_id', id)
                .in('decision', (hosting === 'Hosting' ? ['Going', 'Maybe', 'Nope'] : ['Going', 'Maybe']))

            if (!error && data) setRSVP(data);
        }
        getRSVP();
    }, [event]);

    // Determine available tabs
    let tabs = ['All'];
    const isHostView = hosting === 'Hosting';
    if (isHostView) {
        tabs = ['All', 'Going'];
        if (event?.maybe) tabs.push('Maybe');
        tabs.push("Can't Go");
    }

    // Filter and sort RSVP data for the selected tab
    let filteredRSVP = rsvp;
    if (selectedTab === 'Going') filteredRSVP = rsvp.filter(e => e.decision === 'Going');
    else if (selectedTab === 'Maybe') filteredRSVP = rsvp.filter(e => e.decision === 'Maybe');
    else if (selectedTab === "Can't Go") filteredRSVP = rsvp.filter(e => e.decision === 'Can\'t go');
    // Sort by registration time, latest first
    filteredRSVP = filteredRSVP.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <View style={tw`w-full h-full`}>
            {/* Background image and overlay */}
            <Image
                source={
                    event
                        ? (typeof event.image === 'string'
                            ? (event.image.startsWith('file://') || event.image.startsWith('content://')
                                ? { uri: event.image }
                                : event.image.startsWith('default_')
                                    ? defaultImages[parseInt(event.image.replace('default_', ''), 10) - 1]
                                    : { uri: event.image })
                            : defaultImages[0])
                        : defaultImages[0]
                }
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    bottom: 0,
                    height: undefined,
                    minHeight: '100%',
                    resizeMode: 'cover',
                    zIndex: 0,
                }}
                blurRadius={8}
                onError={e => {
                    console.log('Background image failed to load:', e.nativeEvent);
                }}
            />
            {/* Header */}
            <View style={tw`bg-black absolute top-0 left-0 bg-opacity-60 w-full h-full pt-10`}>
                <View style={tw`px-4 pt-3 pb-1`}>
                    {/* Top bar with back and threedots icons */}
                    <View style={tw`flex-row items-center justify-center mb-1.5`}>
                        <TouchableOpacity onPress={() => router.back()} style={tw`p-1`}>
                            <Back width={24} height={24} />
                        </TouchableOpacity>
                        <View style={tw`flex-1 flex-row items-center justify-center`}> 
                            <Text style={[tw`text-white text-base -ml-9`, { fontFamily: 'Nunito-ExtraBold', textAlign: 'center' }]}>Guest list</Text>
                        </View>
                    </View>

                    {/* Tab bar - pill style like homepage */}
                    <View style={tw`flex-row justify-around mt-2 mb-2`}> 
                        {tabs.map(tab => {
                            let activeBg = '';
                            if (selectedTab === tab) {
                                if (tab === 'Going') activeBg = 'bg-green-500';
                                else if (tab === 'Maybe') activeBg = 'bg-yellow-600';
                                else if (tab === "Can't Go") activeBg = 'bg-rose-600';
                                else activeBg = 'bg-[#7A5CFA]';
                            }
                            return (
                                <TouchableOpacity
                                    key={tab}
                                    style={tw`flex-1 items-center py-2 mx-1 rounded-full ${activeBg}`}
                                    onPress={() => setSelectedTab(tab)}
                                >
                                    <Text style={[tw`text-[15px] text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>{tab}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <ScrollView style={tw`mt-2 w-full h-full gap-2`}>
                        {filteredRSVP.length === 0 ? (
                            <View style={tw`w-full pt-10 items-center`}>
                                <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Oops, no guest yet 😩</Text>
                            </View>
                        ) : (
                            filteredRSVP.map((e, ind) => {
                                let badgeColor = e.decision === 'Going' ? 'bg-green-500' : e.decision === 'Maybe' ? 'bg-yellow-600' : 'bg-rose-600';
                                return (
                                    <TouchableOpacity key={ind} style={[tw`flex-row px-3 py-1.5 bg-white/5 rounded-xl items-start gap-x-2 border border-white/10`]}
                                        onPress={() => router.push({ pathname: '/(profile)/profile', params: { user_id: e.user_id } })}>
                                        <Image source={{ uri: e.users.profile_image }} width={30} height={30} style={tw`rounded-full`} />
                                        <View>
                                            <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>{e.users.firstname} {e.users.lastname}</Text>
                                            <Text style={[tw`text-white text-[13px] -mt-0.5`, { fontFamily: 'Nunito-Medium' }]}>@{e.users.username}</Text>
                                            <Text style={[tw`text-white text-[11px] mt-2`, { fontFamily: 'Nunito-Medium' }]}>RSVP'ed {new Date(e.created_at).toLocaleString()}</Text>
                                        </View>
                                        <View style={tw`flex-1`} />
                                        <View style={tw`rounded-full mt-4 px-2.5 py-1 ${badgeColor}`}>
                                            <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>{e.decision.toUpperCase()}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            </View>
        </View>
    );
}
