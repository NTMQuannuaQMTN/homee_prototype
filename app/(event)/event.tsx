import { supabase } from '@/utils/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, Image, ScrollView, Text, TouchableOpacity, useAnimatedValue, View } from 'react-native';
import tw from 'twrnc';

import Host from '@/assets/icons/hostwhite-icon.svg';
import defaultImages from '../(create)/defaultimage';
import DecisionModal from '../(home)/home/eventDecision';
import Back from '../../assets/icons/back.svg';
import Deadline from '../../assets/icons/hourglasswhite-icon.svg';
import Invite from '../../assets/icons/invite-icon.svg';
import Location from '../../assets/icons/locationwhite-icon.svg';
import Private from '../../assets/icons/private.svg';
import Public from '../../assets/icons/public.svg';
import ThreeDots from '../../assets/icons/threedots.svg';

import { Ionicons } from '@expo/vector-icons';
import EventActionModal, { getEventActions } from '../(home)/home/eventAction';
import { useUserStore } from '../store/userStore';
import DraggableSpecModal from './DraggableSpecModal';

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

export default function EventDetails() {
    const { id, status, fromUpcoming, fromExplore, fromFriendsEvents, fromAllEvents } = useLocalSearchParams();
    const [event, setEvent] = useState<EventView | null>(null);
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [curStatus, setStatus] = useState(status);
    const [hostWC, setHostWC] = useState({
        host: '',
        count: 0,
    });
    const [cohosts, setCohosts] = useState<any[]>([]);
    const { user } = useUserStore();
    const [viewLocation, setViewLocation] = useState(0);
    const viewLocationAnimation = useAnimatedValue(0);
    const [spec, setSpec] = useState<any[][]>([]);
    const [specView, setSpecView] = useState<number[]>([0, 0, 0, 0]);
    const [rsvp, setRSVP] = useState<any[]>([]);
    const [view, setView] = useState<number>(0);

    const [actionModalVisible, setActionModalVisible] = useState(false);
    const cashSpecAnimation = useAnimatedValue(0);
    const foodSpecAnimation = useAnimatedValue(0);
    const merchSpecAnimation = useAnimatedValue(0);
    const coolSpecAnimation = useAnimatedValue(0);

    useEffect(() => {
        cashSpecAnimation.setValue(1 - specView[0]);
        Animated.timing(cashSpecAnimation, {
            toValue: specView[0],
            duration: 150,
            useNativeDriver: false,
        }).start();
    }, [specView[0]])

    useEffect(() => {
        cashSpecAnimation.setValue(1 - specView[0]);
        Animated.timing(cashSpecAnimation, {
            toValue: specView[0],
            duration: 150,
            useNativeDriver: false,
        }).start();
    }, [specView[0]])

    useEffect(() => {
        foodSpecAnimation.setValue(1 - specView[1]);
        Animated.timing(foodSpecAnimation, {
            toValue: specView[1],
            duration: 150,
            useNativeDriver: false,
        }).start();
    }, [specView[1]])

    useEffect(() => {
        merchSpecAnimation.setValue(1 - specView[2]);
        Animated.timing(merchSpecAnimation, {
            toValue: specView[2],
            duration: 150,
            useNativeDriver: false,
        }).start();
    }, [specView[2]])

    useEffect(() => {
        coolSpecAnimation.setValue(1 - specView[3]);
        Animated.timing(coolSpecAnimation, {
            toValue: specView[3],
            duration: 150,
            useNativeDriver: false,
        }).start();
    }, [specView[3]])

    const specCol = {
        '💸 Cash prize': 'bg-yellow-200',
        '🍕 Free food': 'bg-sky-200',
        '👕 Free merch': 'bg-pink-200/90',
        '🎟️ Cool prizes': 'bg-green-200/90'
    }

    useEffect(() => {
        viewLocationAnimation.setValue(1 - viewLocation);
        Animated.timing(viewLocationAnimation, {
            toValue: viewLocation,
            duration: 150,
            useNativeDriver: false,
        }).start();
    }, [viewLocation]);

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
        const getSpecial = () => {
            let specs = [
                ['💸 Cash prize', event?.cash_prize],
                ['🍕 Free food', event?.free_food],
                ['👕 Free merch', event?.free_merch],
                ['🎟️ Cool prizes', event?.cool_prize],
            ].map(e => [e[0], e[1]]);
            setSpec(specs);
        }
        getSpecial();
    }, [event]);

    useEffect(() => {
        const getRSVP = async () => {
            const { data, error } = await supabase
                .from('guests')
                .select('decision, users(profile_image)')
                .eq('event_id', id)
                .in('decision', ['Going', 'Maybe'])

            if (!error && data) setRSVP(data);
        }
        getRSVP();
    }, [event]);

    useEffect(() => {
        const getView = async () => {
            const { data, error } = await supabase
                .from('eventviews')
                .select('user_id')
                .eq('event_id', id)

            if (!error && data) setView(data.length);
        }
        getView();
    }, [event]);

    useEffect(() => {
        if (!event) return;
        const getHost = async () => {
            const { data: cohost, error: cohErr } = await supabase.from('hosts')
                .select('user_id, name').eq('event_id', id);
            if (cohErr) {
                console.log('Err get coh', id);
            } else {
                const cohostID = [event.host_id, ...cohost.filter(e => e.user_id && e.user_id !== event.host_id).map(e => e.user_id)];
                const cohostName = cohost.filter(e => e.name).map(e => e.name);

                if (cohostName.length > 0) {
                    setHostWC({ host: cohostName[0], count: cohost.length + 1 });
                } else {
                    setHostWC({ host: '', count: cohost.length + 1 });
                }

                // For each element in cohostID, get the user and add to cohosts
                let users: any[] = [];
                for (const uid of cohostID) {
                    const { data: userData, error: userErr } = await supabase
                        .from('users')
                        .select('id, firstname, profile_image')
                        .eq('id', uid)
                        .single();
                    if (!userErr && userData) {
                        users.push(userData);
                    }
                }
                setCohosts(users);
            }
        }

        getHost();
    }, [event]);

    useEffect(() => {
        const getDecision = async () => {
            if (status !== '') {
                return;
            }
            console.log('www');
            const { data, error } = await supabase.from('guests')
                .select('decision').eq('event_id', id).eq('user_id', user.id).single();
            if (error) { setStatus('Not RSVP') }
            else { setStatus(data.decision); }
            console.log(data?.decision);
        }
        getDecision();
    }, [event])

    const handleDecisionSelect = async (d: string) => {
        if (d === 'Not RSVP') {
            setStatus('Not RSVP');
            // Optionally, you can also remove the RSVP from the database:
            const { error } = await supabase.from('guests')
                .delete()
                .eq('event_id', event?.id)
                .eq('user_id', user.id);
            if (error) { console.log('Error not rsvp'); return; }
        }
        setStatus(d);
        if (curStatus !== 'Not RSVP') {
            const { error } = await supabase.from('guests')
                .update({ 'decision': d, 'created_at': new Date().toISOString() }).eq('event_id', event?.id)
                .eq('user_id', user.id);

            if (error) {
                console.log('Update error');
                return;
            }
        } else {
            const { error } = await supabase.from('guests')
                .insert([{
                    'decision': d, 'event_id': event?.id,
                    'user_id': user.id
                }]);

            if (error) {
                console.log('Add error');
                return;
            } else {
                console.log('okay');
            }
        }
        setShowDecisionModal(false);
    }
    
    const onDelete = (id: string) => {
        Alert.alert('Deleted');
        router.back();
    };

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
            <ScrollView style={tw`bg-black absolute top-0 left-0 bg-opacity-60 w-full h-full pt-10`} showsVerticalScrollIndicator={false}>
                <View style={tw`px-4 pt-3 pb-1`}>
                    {/* Top bar with back and threedots icons */}
                    <View style={tw`flex-row items-center justify-between mb-1.5`}>
                        <TouchableOpacity onPress={() => router.back()} style={tw`p-1`}>
                            <Back width={24} height={24} />
                        </TouchableOpacity>
                        <View style={tw`flex-1`} />
                        <TouchableOpacity
                            onPress={() => setActionModalVisible(true)}
                            style={tw`p-1`}>
                            <ThreeDots width={22} height={22} />
                        </TouchableOpacity>
                    </View>
                    <Text
                        style={[tw`text-white text-[24px] w-full leading-[1.25]`, { fontFamily: 'Nunito-ExtraBold', textAlign: 'center' }]}
                        numberOfLines={2}
                        allowFontScaling={true}
                        ellipsizeMode="tail"
                    >
                        {event?.title}
                    </Text>
                    <View style={tw`flex-row items-center my-2`}>
                        {event?.public ? <View style={tw`flex-row items-center gap-2 justify-center bg-[#064B55] border border-white/10 rounded-full px-2 py-0.5`}>
                            <Public />
                            <Text style={[tw`text-[13px] text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Public</Text>
                        </View> :
                            <View style={tw`flex-row items-center gap-2 justify-center bg-[#080B32] border border-purple-900 rounded-full px-2 py-0.5`}>
                                <Private />
                                <Text style={[tw`text-[13px] text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Private</Text>
                            </View>}
                    </View>
                </View>
                {/* Event Image */}
                <View style={tw`px-4`}>
                    <View style={[tw`rounded-xl overflow-hidden w-full items-center justify-center relative`, { aspectRatio: 410 / 279 }]}>
                        <Image
                            source={
                                event ? typeof event.image === 'string' && event.image.startsWith('default_')
                                    ? defaultImages[parseInt(event.image.replace('default_', ''), 10) - 1]
                                    : event.image
                                        ? { uri: event.image }
                                        : defaultImages[0]
                                    : defaultImages[0]
                            }
                            style={{ width: '100%', height: '100%' }}
                            resizeMode={
                                event && typeof event.image === 'string' && event.image.startsWith('default_')
                                    ? 'contain'
                                    : 'cover'
                            }
                        />
                    </View>
                </View>
                {/* RSVP/Invite Buttons */}
                <View style={tw`flex-row px-4 mt-3.5 mb-2 gap-2`}>
                    {curStatus === 'Host' || curStatus === 'Cohost' ?
                        <TouchableOpacity style={tw`bg-[#CAE6DF] flex-1 flex-row py-2.5 rounded-full items-center justify-center gap-1.5`}
                            onPress={() => router.replace({ pathname: '/(create)/create', params: { id: event?.id } })}>
                            <Text style={[tw`text-black text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Edit event</Text>
                        </TouchableOpacity>
                        : curStatus === 'Not RSVP' ?
                            <TouchableOpacity style={tw`bg-[#7A5CFA] flex-1 flex-row py-2.5 rounded-full items-center justify-center gap-1.5`}
                                onPress={() => setShowDecisionModal(true)}>
                                <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>RSVP</Text>
                            </TouchableOpacity>
                            : curStatus === 'Going' ?
                                <TouchableOpacity style={tw`bg-green-500 flex-1 flex-row py-2.5 rounded-full items-center justify-center gap-1.5`}
                                    onPress={() => setShowDecisionModal(true)}>
                                    <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>I’m going </Text>
                                    <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>🥳</Text>
                                </TouchableOpacity>
                                : curStatus === 'Maybe' ?
                                    <TouchableOpacity style={tw`bg-yellow-600 flex-1 flex-row py-2.5 rounded-full items-center justify-center gap-1.5`}
                                        onPress={() => setShowDecisionModal(true)}>
                                        <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Eh...maybe </Text>
                                        <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>🤔</Text>
                                    </TouchableOpacity>
                                    : <TouchableOpacity style={tw`bg-rose-600 flex-1 flex-row py-2.5 rounded-full items-center justify-center gap-1.5`}
                                        onPress={() => setShowDecisionModal(true)}>
                                        <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>I can't </Text>
                                        <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>😭</Text>
                                    </TouchableOpacity>
                    }
                    <TouchableOpacity
                        style={tw`flex-row bg-[#23244A] gap-x-2 py-2.5 px-6 rounded-full items-center`}
                        onPress={() => router.push({ pathname: '/(event)/invite', params: { id: event?.id } })}
                    >
                        <Invite width={18} height={18} />
                        <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Invite</Text>
                    </TouchableOpacity>
                </View>
                {/* Date/Time */}
                <View style={tw`px-4 mt-1 mb-2`}>
                    {/* Date/Time breakdown */}
                    {(() => {
                        if (!event?.start) return null;
                        const startDate = event.start ? new Date(event.start) : null;
                        const endDate = event.end ? new Date(event.end) : null;
                        const formatDate = (date: Date) => {
                            return date.toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                            });
                        };
                        const formatTime = (date: Date) => {
                            let h = date.getHours();
                            let m = date.getMinutes();
                            let ampm = h >= 12 ? 'PM' : 'AM';
                            h = h % 12;
                            if (h === 0) h = 12;
                            return `${h}:${m.toString().padStart(2, '0')}${ampm}`;
                        };
                        if (!startDate) return null;
                        if (!endDate || startDate.toDateString() === endDate.toDateString()) {
                            // Only start, or start/end on same day
                            return (
                                <View>
                                    <Text style={[tw`text-white text-[22px] `, { fontFamily: 'Nunito-ExtraBold', textAlign: 'left' }]}>
                                        {formatDate(startDate)}
                                    </Text>
                                    <Text style={[tw`text-white text-[15px] `, { fontFamily: 'Nunito-Medium', textAlign: 'left' }]}>
                                        {formatTime(startDate)}
                                        {endDate ? ` - ${formatTime(endDate)}` : ''}
                                    </Text>
                                </View>
                            );
                        } else {
                            // Start/end on different days
                            return (
                                <View>
                                    <Text style={[tw`text-white text-[22px] `, { fontFamily: 'Nunito-ExtraBold', textAlign: 'left' }]}>
                                        {formatDate(startDate)}, {formatTime(startDate)}
                                    </Text>
                                    <Text style={[tw`text-white text-[15px] `, { fontFamily: 'Nunito-Medium', textAlign: 'left' }]}>
                                        to {formatDate(endDate)}, {formatTime(endDate)}
                                    </Text>
                                </View>
                            );
                        }
                    })()}
                </View>
                {/* Host and Description */}
                <View style={tw`px-4 mt-0.5 mb-2`}>
                    <View style={tw`flex-row items-center mb-1`}>
                        <Host width={12} height={12} style={tw`mr-2`} />
                        <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Hosted by </Text>
                        <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>{hostWC.host}</Text>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={tw`flex-row items-center mb-3 gap-1.5`}
                    >
                        {cohosts.map((cohost, idx) => {
                            return (
                                <TouchableOpacity key={idx} style={tw`flex-row items-center gap-1.5 bg-white/10 border border-white/20 px-2 py-2 rounded-xl`}
                                    onPress={() => router.push({ pathname: '/(profile)/profile', params: { user_id: cohost.id } })}>
                                    <View style={[tw`rounded-full border border-white/20 items-center justify-center bg-white/10`, { width: 30, height: 30, overflow: 'hidden' }]}>
                                        <Image
                                            source={cohost.profile_image ? { uri: cohost.profile_image } : require('../../assets/icons/pfpdefault.svg')}
                                            style={{ width: 30, height: 30, borderRadius: 60 }}
                                            resizeMode="cover"
                                            defaultSource={require('../../assets/icons/pfpdefault.svg')}
                                        />
                                    </View>
                                    <Text style={[tw`text-white`, { fontFamily: 'Nunito-Bold' }]}>{cohost.firstname}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    <View style={tw`flex-row mb-1.5 gap-2 items-start`}>
                        <Location width={12} height={12} style={tw`mt-1`} />
                        <View style={tw`flex-1`}>
                            {event?.rsvpfirst && curStatus === 'Not RSVP' ? (
                                <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>RSVP to see details</Text>
                            ) : (
                                (event?.location_add !== event?.location_name || event?.location_more || event?.location_note) ? (
                                    <TouchableOpacity style={tw`flex-row items-center`} onPress={() => setViewLocation(1 - viewLocation)}>
                                        <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>{event?.location_name}</Text>
                                        <Animated.View style={{ marginLeft: 8, transform: [{ rotate: viewLocationAnimation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) }] }}>
                                            <Ionicons
                                                name="chevron-forward"
                                                size={14}
                                                color="#fff"
                                            />
                                        </Animated.View>
                                    </TouchableOpacity>
                                ) : (
                                    <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>{event?.location_name}</Text>
                                )
                            )}
                        </View>
                    </View>
                    {viewLocation === 1 && <Animated.View style={[tw`h-fit overflow-hidden`]}>
                        <View style={[tw`px-4 ml-4 gap-2.5 mb-2 py-2 bg-white/10 rounded-lg border border-white/20`]}>
                            {event?.location_add && event?.location_add !== event?.location_name && (
                                <View style={tw``}>
                                    <Text style={[tw`text-[15px] text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Address</Text>
                                    <Text style={[tw`text-[14px] text-white`, { fontFamily: 'Nunito-Medium' }]}>{event.location_add}</Text>
                                </View>
                            )}
                            {event?.location_more && (
                                <View style={tw``}>
                                    <Text style={[tw`text-[15px] text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Apt / Suite / Floor</Text>
                                    <Text style={[tw`text-[14px] text-white`, { fontFamily: 'Nunito-Medium' }]}>{event.location_more}</Text>
                                </View>
                            )}
                            {event?.location_note && (
                                <View style={tw``}>
                                    <Text style={[tw`text-[15px] text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Further notes</Text>
                                    <Text style={[tw`text-[14px] text-white`, { fontFamily: 'Nunito-Medium' }]}>{event.location_note}</Text>
                                </View>
                            )}
                        </View>
                    </Animated.View>}
                    {event?.bio ? (
                        <View style={tw`flex-row mt-2.5 mb-2 items-center gap-2`}>
                            <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-Medium' }]}>{event.bio}</Text>
                        </View>
                    ) : null}
                    {event?.rsvp_deadline && <View style={tw`flex-row mt-2 mb-3 items-center gap-2`}>
                        <Deadline width={12} height={12}></Deadline>
                        {event?.rsvp_deadline && (() => {
                            const deadline = new Date(event.rsvp_deadline);
                            const now = new Date();
                            // Zero out the time for both dates to count full days
                            deadline.setHours(0, 0, 0, 0);
                            now.setHours(0, 0, 0, 0);
                            const msPerDay = 1000 * 60 * 60 * 24;
                            const daysLeft = Math.ceil(
                                (deadline.getTime() - now.getTime()) / msPerDay
                            );
                            if (daysLeft > 0) {
                                return (
                                    <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>
                                        {daysLeft} day{daysLeft !== 1 ? 's' : ''} left to RSVP
                                    </Text>
                                );
                            } else if (daysLeft === 0) {
                                return (
                                    <Text style={[tw`text-rose-500 text-[15px]`, { fontFamily: 'Nunito-Bold' }]}>
                                        RSVP closes today
                                    </Text>
                                );
                            } else {
                                return (
                                    <Text style={[tw`text-gray-400 text-[15px]`, { fontFamily: 'Nunito-Bold' }]}>
                                        RSVP has closed :(
                                    </Text>
                                );
                            }
                        })()}
                    </View>}
                    <Text style={[tw`text-[16px] text-white mb-1.5 mt-2`, { fontFamily: 'Nunito-ExtraBold' }]}>What's special?</Text>
                    {spec.filter(s => s[1] != null).length === 0 ? (
                        <Text style={[tw`text-white text-[14px] mb-4 -mt-0.5`, { fontFamily: 'Nunito-Medium', textAlign: 'left' }]}>Oops, no free food, free merch or prize :(</Text>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`flex-row mb-4 items-center gap-2`}>
                            {spec.map((s, ind) => {
                                if (s[1] == null) return null;
                                const key = s[0] as keyof typeof specCol;
                                return (
                                    <TouchableOpacity
                                        key={ind}
                                        style={tw`${specCol[key]} flex-row gap-1 px-2 py-1 rounded-full`}
                                        onPress={() => {
                                            setSpecView(prev => {
                                                const newArr = [...prev];
                                                newArr[ind] = prev[ind] === 1 ? 0 : 1;
                                                console.log(newArr);
                                                return newArr;
                                            });
                                        }}
                                    >
                                        <View style={tw`flex-row items-center`}>
                                            <Text style={[tw`text-[13px] text-black -mt-0.5`, { fontFamily: 'Nunito-ExtraBold' }]}>{s[0]}</Text>
                                            {s[1] !== '' &&
                                                <Ionicons
                                                    name="chevron-down"
                                                    size={12}
                                                    color="#000"
                                                    style={tw`ml-1 self-center mt-0.5`}
                                                />
                                            }
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}
                    {(event?.public_list || curStatus === 'Going' || curStatus === 'Host' || curStatus === 'Cohost') && (
                        <View style={tw`flex-row w-full items-center gap-2 mb-1`}>
                            <Text style={[tw`text-[16px] text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Who's going?</Text>
                            <TouchableOpacity style={tw`mx-1 mt-0.5 border-b border-gray-400 flex justify-center items-center`}
                                onPress={() => { router.push({ pathname: '/(event)/event_guest', params: { id: id, hosting: status === 'Cohost' || status === 'Host' ? 'Hosting' : '' } }) }}>
                                <Text style={[tw`text-[12px] text-gray-400`, { fontFamily: 'Nunito-Medium' }]}>View guests</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {(event?.public_list || curStatus === 'Going' || curStatus === 'Host' || curStatus === 'Cohost') && <View style={tw`flex-row items-center mt-0.5 gap-1.5`}>
                        {rsvp.filter(e => e.decision === "Going").slice(0, 5).map((e, ind) => {
                            console.log(e);
                            return <Image key={ind}
                                source={
                                    e.users.profile_image
                                        ? { uri: e.users.profile_image }
                                        :
                                        require('@/assets/images/pfp-default2.png')
                                }
                                style={{ width: 26, height: 26, borderRadius: 12, marginBottom: 4, marginTop: 2 }}
                            />
                        })}
                    </View>}
                    {(event?.public_list || curStatus === 'Going' || curStatus === 'Host' || curStatus === 'Cohost') && <View style={tw`flex-row items-center mb-15`}>
                        <Text style={[tw`text-white text-[14px] mr-2`, { fontFamily: 'Nunito-Medium' }]}>{rsvp.filter(e => e.decision === 'Going').length} going • {(user.id === event?.host_id || cohosts.indexOf(user.id) >= 0) ? `${rsvp.filter(e => e.decision === 'Maybe').length} maybe` : `${rsvp.length + view} interested`}</Text>
                    </View>}
                </View>

                {/* Decision Modal */}
                <DecisionModal
                    visible={showDecisionModal}
                    onClose={() => setShowDecisionModal(false)}
                    eventTitle={event?.title || ''}
                    maybe={!!event?.maybe}
                    onSelect={(dec) => { handleDecisionSelect(dec); }}
                />
                <DraggableSpecModal
                    visible={specView.indexOf(1) >= 0}
                    color={specView.indexOf(1) >= 0 ? Object.values(specCol)[specView.indexOf(1)] : '#000000'}
                    title={specView.indexOf(1) >= 0 ? spec[specView.indexOf(1)][0] : ''}
                    spec={specView.indexOf(1) >= 0 ? spec[specView.indexOf(1)][1] : ''}
                    onClose={() => setSpecView([0, 0, 0, 0])}
                />

                <EventActionModal
                    visible={actionModalVisible}
                    onClose={() => setActionModalVisible(false)}
                    title={"What's up with this event?"}
                    actions={getEventActions({
                        event: { ...event, isDraft: false }, // flatten event object, as in EventCard
                        user,
                        cohosts,
                        push: router.push, // use router.push as push
                        setActionModalVisible,
                        onDelete,
                        fromExplore: (fromExplore === '1'),
                        fromUpcoming: (fromUpcoming === '1'),
                        fromFriendsEvents: (fromFriendsEvents === '1'),
                        fromAllEvents: (fromAllEvents === '1'),
                    })}
                />
            </ScrollView>
        </View>
    );
}
