import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ImageBackground, Keyboard, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import tw from 'twrnc';
import { useAuthStore } from "../store/authStore";
import GradientBackground from "../components/GradientBackground";
import IconLogo from "../../assets/logo/icon.svg";

export default function SignUp() {
    const router = useRouter();
    const [valid, setValid] = useState(true);
    const [alreadyVerified, setAlreadyVerified] = useState(false);
    const [mode, setMode] = useState<'phone' | 'email'>('phone');
    const [loginInfo, setLoginInfo] = useState('');
    const [phoneCode, setPhoneCode] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isFocusedCode, setIsFocusedCode] = useState(false);

    const { setSignupInfo } = useAuthStore();

    const checkEmail = async (email: string) => {
        setAlreadyVerified(false);
        if (email.indexOf('@') >= 0) {
            // Always compare emails in lowercase
            const lowerEmail = email.trim().toLowerCase();
            // Fetch all users with the same email, case-insensitive
            const { data: users, error: userError } = await supabase
                .from('users')
                .select('email');
            if (users && !userError) {
                // Check if any user email matches input, case-insensitive
                const match = users.find((u: any) => (u.email || '').toLowerCase() === lowerEmail);
                if (match) {
                    setAlreadyVerified(true);
                    return;
                }
            }
            setSignupInfo({ email: lowerEmail });

            const { error } = await supabase.auth.signInWithOtp({
                email: lowerEmail,
                options: {
                    shouldCreateUser: true,
                    emailRedirectTo: 'exp://j3bihve-courtins-8081.exp.direct',
                },
            });

            if (error) {
                console.log("OTP send error", error.message);
                return;
            }

            router.replace('/(auth)/verify');
        }
    };

    const checkPhone = async (phone: string) => {
        setAlreadyVerified(false);
        if (/^\d+$/.test(phone)) {
            Alert.alert('Good phone, but update later');
            // Always compare emails in lowercase
            // const lowerEmail = email.trim().toLowerCase();
            // // Fetch all users with the same email, case-insensitive
            // const { data: users, error: userError } = await supabase
            //     .from('users')
            //     .select('email');
            // if (users && !userError) {
            //     // Check if any user email matches input, case-insensitive
            //     const match = users.find((u: any) => (u.email || '').toLowerCase() === lowerEmail);
            //     if (match) {
            //         setAlreadyVerified(true);
            //         return;
            //     }
            // }
            // setSignupInfo({ email: lowerEmail });

            // const { error } = await supabase.auth.signInWithOtp({
            //     email: lowerEmail,
            //     options: {
            //         shouldCreateUser: true,
            //         emailRedirectTo: 'exp://j3bihve-courtins-8081.exp.direct',
            //     },
            // });

            // if (error) {
            //     console.log("OTP send error", error.message);
            //     return;
            // }

            // router.replace('/(auth)/verify');
        } else {
            Alert.alert('no phone');
        }
    };

    return (
        <GradientBackground>
            <TouchableWithoutFeedback onPress={() => {
                Keyboard.dismiss();
                setIsFocused(false);
                setIsFocusedCode(false);
            }}>
                <View style={{ flex: 1 }}>
                    {/* Center content - takes up most of the screen */}
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={tw`mb-8 items-center`}>
                            <IconLogo width={80} height={80} style={tw``} />
                            <Text style={[tw`text-white text-[22px] text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>Welcome to Homee 🚀</Text>
                        </View>

                        {/* Form */}
                        {mode === 'email' && <View style={tw`w-full`}>
                            <Text style={[tw`text-white mb-2 text-[16px]`, { fontFamily: 'Nunito-Bold' }]}>Enter your email address</Text>
                            <ImageBackground
                                source={require('../../assets/images/galaxy.jpg')}
                                imageStyle={{ borderRadius: 8, opacity: isFocused ? 0.3 : 0 }}
                                style={tw`w-full rounded-[2]`}
                            >
                                <TextInput
                                    style={[
                                        tw`w-full px-3 py-3 text-white text-[15px]`,
                                        {
                                            fontFamily: 'Nunito-Medium',
                                            borderWidth: 1,
                                            borderColor: isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                                            backgroundColor: isFocused ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                                            borderRadius: 8,
                                        }
                                    ]}
                                    placeholder="hello@example.com"
                                    placeholderTextColor={'#9CA3AF'}
                                    value={loginInfo}
                                    onChangeText={(newVal) => { setLoginInfo(newVal); setValid(true); }}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    caretHidden={!isFocused}
                                />
                            </ImageBackground>
                        </View>}

                        {/* Form */}
                        {mode === 'phone' && <View style={tw`w-full`}>
                            <Text style={[tw`text-white mb-2 text-[16px]`, { fontFamily: 'Nunito-Bold' }]}>Enter your country code</Text>
                            <ImageBackground
                                source={require('../../assets/images/galaxy.jpg')}
                                imageStyle={{ borderRadius: 8, opacity: isFocusedCode ? 0.3 : 0 }}
                                style={tw`w-full rounded-[2]`}
                            >
                                <TextInput
                                    style={[
                                        tw`w-full px-3 py-3 text-white text-[15px]`,
                                        {
                                            fontFamily: 'Nunito-Medium',
                                            borderWidth: 1,
                                            borderColor: isFocusedCode ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                                            backgroundColor: isFocusedCode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                                            borderRadius: 8,
                                            paddingLeft: 24,
                                        }
                                    ]}
                                    placeholder="123456789"
                                    placeholderTextColor={'#9CA3AF'}
                                    value={phoneCode}
                                    onChangeText={(newVal) => { setPhoneCode(newVal); setValid(true); }}
                                    onFocus={() => setIsFocusedCode(true)}
                                    onBlur={() => setIsFocusedCode(false)}
                                    caretHidden={!isFocused}
                                />
                                <Text style={[{fontFamily: 'Nunito-Medium'},tw`text-white text-[15px] absolute top-3 left-3`]}>+</Text>
                            </ImageBackground>

                            <Text style={[tw`text-white mb-2 text-[16px]`, { fontFamily: 'Nunito-Bold' }]}>Enter your phone number</Text>
                            <ImageBackground
                                source={require('../../assets/images/galaxy.jpg')}
                                imageStyle={{ borderRadius: 8, opacity: isFocused ? 0.3 : 0 }}
                                style={tw`w-full rounded-[2]`}
                            >
                                <TextInput
                                    style={[
                                        tw`w-full px-3 py-3 text-white text-[15px]`,
                                        {
                                            fontFamily: 'Nunito-Medium',
                                            borderWidth: 1,
                                            borderColor: isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                                            backgroundColor: isFocused ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                                            borderRadius: 8,
                                        }
                                    ]}
                                    placeholder="123456789"
                                    placeholderTextColor={'#9CA3AF'}
                                    value={loginInfo}
                                    onChangeText={(newVal) => { setLoginInfo(newVal); setValid(true); }}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    caretHidden={!isFocused}
                                />
                            </ImageBackground>
                        </View>}

                        {/* Error */}
                        {valid ||
                            <View style={tw`w-full py-2 mt-1.5 items-center justify-center bg-[#FF1769] rounded-[2]`}>
                                <Text style={[tw`text-[#FFFFFF]`, { fontFamily: 'Nunito-Medium' }]}>Oops, you gotta use a proper .edu email 😭</Text>
                            </View>}
                        {alreadyVerified &&
                            <View style={tw`w-full py-2 mt-1.5 items-center justify-center`}>
                                <Text style={[tw`text-[12px] text-white`, { fontFamily: 'Nunito-Medium' }]}>Hey, this email has been verified. <Text style={tw`underline`} onPress={() => router.replace('/(auth)/login')}>Login instead?</Text></Text>
                            </View>}

                        <View style={tw`w-full py-2 mt-1.5 items-center justify-center`}>
                            <Text style={[tw`text-[12px] text-white`, { fontFamily: 'Nunito-Medium' }]}>... <Text style={{ fontFamily: 'Nunito-ExtraBold' }} onPress={() => { setMode(mode === 'email' ? 'phone' : 'email'); setLoginInfo('') }}>Sign up using {mode === 'email' ? 'phone number' : 'email'}</Text></Text>
                        </View>
                    </View>

                    {/* Bottom content - fixed at bottom */}
                    <Text style={[tw`text-white text-[11px] text-center mb-4`, { fontFamily: 'Nunito-Regular' }]}>
                        By tapping SEND CODE, you are agreeing to our <Text style={{ fontFamily: 'Nunito-Bold' }}>Community Guidelines</Text>, <Text style={{ fontFamily: 'Nunito-Bold' }}>Terms of Service</Text>, and <Text style={{ fontFamily: 'Nunito-Bold' }}>Privacy Policy</Text>.
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            if (mode === 'email') {
                                checkEmail(loginInfo);
                            } else {
                                checkPhone(loginInfo);
                            }
                        }}
                        disabled={!loginInfo.trim()}
                        style={[
                            tw`rounded-full py-[10] w-full items-center mb-4`,
                            {
                                backgroundColor: loginInfo.trim() ? '#FFFFFF' : '#FFFFFF',
                                opacity: loginInfo.trim() ? 1 : 0.3
                            }
                        ]}
                    >
                        <Text style={[tw`text-black text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Send code</Text>
                    </TouchableOpacity>
                    <View style={tw`flex-row items-center justify-center mb-8`}>
                        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                            <Text style={[tw`text-white text-[13px]`, { fontFamily: 'Nunito-Medium' }]}>
                                Already have an account? <Text style={[tw`text-white text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Login</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </GradientBackground>
    );
}