
import GradientBackground from '../components/GradientBackground';
import { useRouter } from 'expo-router';
import React from 'react';
import { Share, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import tw from 'twrnc';
import { useUserStore } from '../store/userStore';
import LogoutModal from './logoutmodal';

import { Ionicons } from '@expo/vector-icons';
import BackIcon from '../../assets/icons/back.svg';
import AboutIcon from '../../assets/icons/catforfun.svg';
import FeedbackIcon from '../../assets/icons/feedback-icon.svg';
import InstaIcon from '../../assets/icons/insta-icon.svg';
import InviteIcon from '../../assets/icons/invite-icon.svg';
import Logout from '../../assets/icons/logout-icon.svg';
import MailIcon from '../../assets/icons/mail-icon.svg';
import TermsIcon from '../../assets/icons/terms-icon.svg';
import XIcon from '../../assets/icons/x-icon.svg';

import LogoWhite from '../../assets/logo/iconwhite.svg';

export default function Settings() {
    const router = useRouter();
    const { user } = useUserStore();
    const [showLogoutModal, setShowLogoutModal] = React.useState(false);
    const handleInviteShare = async () => {
        try {
            await Share.share({
                message: "Join Homee with me so we can share and save memories together! https://homee.app"
            });
        } catch (error) {
            // Optionally handle error
        }
    };
    const handleLogout = () => {
        // Add your logout logic here
        setShowLogoutModal(false);
    };
    return (
        <GradientBackground style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
                {/* Top row: back icon and settings title */}
                <View style={tw`flex-row items-center px-4 pt-14 pb-4 w-full`}>
                    <TouchableOpacity
                        style={tw`mr-2`}
                        onPress={() => user?.id && router.replace({ pathname: '/(profile)/profile', params: { user_id: user.id } })}
                        accessibilityLabel="Go back"
                        disabled={!user?.id}
                    >
                        <BackIcon width={24} height={24} />
                    </TouchableOpacity>
                    <View style={tw`flex-1 items-center`}>
                        <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Settings</Text>
                    </View>
                    {/* Empty view for spacing on right */}
                    <View style={tw`w-7`} />
                </View>

                {/* Invite friends box/button */}
                <View style={tw`px-6 mt-3`}>
                    <TouchableOpacity
                        style={tw`bg-white/10 rounded-lg flex-row items-center gap-x-2.5 py-4 px-4`}
                        activeOpacity={0.8}
                        onPress={handleInviteShare}
                    >
                        <InviteIcon width={20} height={20} />
                        <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Invite friends to Homee</Text>
                    </TouchableOpacity>
                </View>

                {/* Help */}
                <View style={tw`px-6 mt-4`}>
                    <Text style={[tw`text-white text-base mb-2`, { fontFamily: 'Nunito-ExtraBold' }]}>Help</Text>
                    <TouchableOpacity style={tw`bg-white/10 rounded-t-lg border-b border-white/5 flex-row items-center gap-x-2.5 py-4 px-4 justify-between`} activeOpacity={0.8}>
                        <View style={tw`flex-row items-center gap-x-2.5`}>
                            <MailIcon width={20} height={20} />
                            <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Contact support</Text>
                        </View>
                        <Ionicons name="open-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={tw`bg-white/10 rounded-b-lg flex-row items-center gap-x-2.5 py-4 px-4 justify-between`} activeOpacity={0.8}>
                        <View style={tw`flex-row items-center gap-x-2.5`}>
                            <FeedbackIcon width={20} height={20} />
                            <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Send feedback</Text>
                        </View>
                        <Ionicons name="open-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* About Homee */}
                <View style={tw`px-6 mt-4`}>
                    <Text style={[tw`text-white text-base mb-2`, { fontFamily: 'Nunito-ExtraBold' }]}>About Homee</Text>
                    <TouchableOpacity style={tw`bg-white/10 rounded-t-lg border-b border-white/5 flex-row items-center gap-x-2.5 py-4 px-4 justify-between`} activeOpacity={0.8}>
                        <View style={tw`flex-row items-center ml-0.5 gap-x-3`}>
                            <LogoWhite width={16} height={16} />
                            <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>About us</Text>
                        </View>
                        <Ionicons name="open-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={tw`bg-white/10 border-b border-white/5 flex-row items-center gap-x-2.5 py-4 px-4 justify-between`} activeOpacity={0.8}>
                        <View style={tw`flex-row items-center gap-x-2.5`}>
                            <Ionicons name="logo-instagram" size={20} color="#fff" />
                            <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Instagram</Text>
                        </View>
                        <Ionicons name="open-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={tw`bg-white/10 rounded-b-lg flex-row items-center gap-x-2.5 py-4 px-4 justify-between`} activeOpacity={0.8}>
                        <View style={tw`flex-row items-center gap-x-2.5`}>
                            <XIcon width={20} height={20} color="#fff" />
                            <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Twitter (𝕏)</Text>
                        </View>
                        <Ionicons name="open-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Terms */}
                <View style={tw`px-6 mt-4`}>
                    <Text style={[tw`text-white text-base mb-2`, { fontFamily: 'Nunito-ExtraBold' }]}>Terms</Text>
                    <TouchableOpacity style={tw`bg-white/10 rounded-t-lg border-b border-white/5 flex-row items-center gap-x-2.5 py-4 px-4 justify-between`} activeOpacity={0.8}>
                        <View style={tw`flex-row items-center gap-x-2.5`}>
                            <TermsIcon width={20} height={20} />
                            <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Community Guidelines</Text>
                        </View>
                        <Ionicons name="open-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={tw`bg-white/10 border-b border-white/5 flex-row items-center gap-x-2.5 py-4 px-4 justify-between`} activeOpacity={0.8}>
                        <View style={tw`flex-row items-center gap-x-2.5`}>
                            <TermsIcon width={20} height={20} />
                            <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Terms of Service</Text>
                        </View>
                        <Ionicons name="open-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={tw`bg-white/10 rounded-b-lg flex-row items-center gap-x-2.5 py-4 px-4 justify-between`} activeOpacity={0.8}>
                        <View style={tw`flex-row items-center gap-x-2.5`}>
                            <TermsIcon width={20} height={20} />
                            <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Privacy Policy</Text>
                        </View>
                        <Ionicons name="open-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Change password and Logout box/buttons */}
                <View style={tw`px-6 mt-8`}>
                    <TouchableOpacity
                        style={tw`bg-white/10 rounded-lg flex-row items-center gap-x-2.5 py-4 px-4 mb-3`}
                        activeOpacity={0.8}
                        onPress={() => router.push('/(auth)/changepassword')}
                    >
                        <Ionicons name="person-circle-outline" size={20} color="#fff" />
                        <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Change password</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={tw`bg-white/10 rounded-lg flex-row items-center gap-x-2.5 py-4 px-4`}
                        activeOpacity={0.8}
                        onPress={() => setShowLogoutModal(true)}
                    >
                        <Logout width={20} height={20} />
                        <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Log out</Text>
                    </TouchableOpacity>
                </View>

                {/* Logout confirmation modal */}
                <LogoutModal
                    visible={showLogoutModal}
                    onLogout={handleLogout}
                    onCancel={() => setShowLogoutModal(false)}
                />
            </ScrollView>
        </GradientBackground>
    );
}
