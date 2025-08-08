import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ImageBackground, Keyboard, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import CountryPicker, { Country } from 'react-native-country-picker-modal';
import tw from 'twrnc';
import { useAuthStore } from "../store/authStore";
import GradientBackground from "../components/GradientBackground";
import IconLogo from "../../assets/logo/icon.svg";

export default function Login() {
    const router = useRouter();
    const [valid, setValid] = useState(true);
    const [notRegistered, setNotRegistered] = useState(false);
    const [mode, setMode] = useState<'phone' | 'email'>('phone');
    const [loginInfo, setLoginInfo] = useState('');
    const [phoneCode, setPhoneCode] = useState('');
    const [country, setCountry] = useState({ cca2: 'US', callingCode: ['1'] });
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [password, setPassword] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isFocusedCode, setIsFocusedCode] = useState(false);
    const [isFocusedPass, setIsFocusedPass] = useState(false);

    const { setSignupInfo, setPass } = useAuthStore();

    const checkEmail = async (email: string) => {
        console.log("Checking email", email);

        if (email.indexOf('@') >= 0) {
            // Always use lowercase for email
            const lowerEmail = email.trim().toLowerCase();

            const { data: users, error: userError } = await supabase
                .from('users')
                .select('email')
                .eq('email', lowerEmail).single();

            if (userError) {
                setNotRegistered(true);
                setValid(true);
                return;
            }

            setSignupInfo({ email: lowerEmail });
            setPass(password);

            const { error } = await supabase.auth.signInWithPassword({
                email: lowerEmail,
                password: password
            });

            if (error) {
                setValid(false);
                setNotRegistered(false);
                return;
            }

            router.replace('/home/homepage');
        }
    };

    const checkPhone = async (phone: string) => {
        if (/^\d+$/.test(phone) && /^\d+$/.test(phoneCode)) {
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
                setIsFocusedPass(false);
            }}>
                <View style={{ flex: 1 }}>
                    {/* Center content - takes up most of the screen */}
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={tw`mb-8 items-center`}>
                            <IconLogo width={80} height={80} style={tw``} />
                            <Text style={[tw`text-white text-[22px] text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>Please login to continue ✨</Text>
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
                                    onChangeText={(newVal) => {
                                        setLoginInfo(newVal);
                                        setValid(true);
                                        setNotRegistered(false);
                                    }}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    caretHidden={!isFocused}
                                />
                            </ImageBackground>

                            <Text style={[tw`text-white mb-2 mt-4 text-[16px]`, { fontFamily: 'Nunito-Bold' }]}>Enter password</Text>
                            <ImageBackground
                                source={require('../../assets/images/galaxy.jpg')}
                                imageStyle={{ borderRadius: 8, opacity: isFocusedPass ? 0.3 : 0 }}
                                style={tw`w-full rounded-[2]`}
                            >
                                <TextInput
                                    style={[
                                        tw`w-full px-3 py-3 text-white text-[15px]`,
                                        {
                                            fontFamily: 'Nunito-Medium',
                                            borderWidth: 1,
                                            borderColor: isFocusedPass ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                                            backgroundColor: isFocusedPass ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                                            borderRadius: 8,
                                        }
                                    ]}
                                    placeholder="Password"
                                    placeholderTextColor={'#9CA3AF'}
                                    value={password}
                                    onChangeText={(newVal) => { setPassword(newVal); setValid(true); }}
                                    onFocus={() => setIsFocusedPass(true)}
                                    onBlur={() => setIsFocusedPass(false)}
                                    secureTextEntry={true}
                                />
                            </ImageBackground>
                        </View>}

                        {/* Form */}
                        {mode === 'phone' && <View style={tw`w-full`}>
                            <Text style={[tw`text-white mb-2 text-[16px]`, { fontFamily: 'Nunito-Bold' }]}>Enter your phone number</Text>
                            <View style={[tw`flex-row items-center mb-2`]}>
                                <TouchableOpacity
                                    style={[tw`flex-row items-center px-3 py-3 justify-center`, {
                                        minWidth: 70,
                                        borderWidth: 1,
                                        borderColor: isFocusedCode ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                                        backgroundColor: isFocusedCode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                                        borderRadius: 8,
                                        marginRight: 8,
                                    }]}
                                    onPress={() => setShowCountryPicker(true)}
                                    activeOpacity={0.8}
                                    onFocus={() => setIsFocusedCode(true)}
                                    onBlur={() => setIsFocusedCode(false)}
                                >
                                    <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-Bold', marginRight: 6 }]}>+{country.callingCode[0]}</Text>
                                    <Ionicons name="chevron-down" size={14} color="#fff" />
                                </TouchableOpacity>
                                <CountryPicker
                                    withFilter
                                    withFlag
                                    withCallingCode
                                    withEmoji
                                    withAlphaFilter
                                    countryCode={country.cca2 as any}
                                    visible={showCountryPicker}
                                    onSelect={(c: Country) => {
                                        setCountry(c);
                                        setPhoneCode(c.callingCode[0] || '');
                                        setShowCountryPicker(false);
                                    }}
                                    onClose={() => setShowCountryPicker(false)}
                                />
                                <TextInput
                                    style={[tw`flex-1 px-3 py-3 text-white text-[15px]`, {
                                        fontFamily: 'Nunito-Medium',
                                        borderWidth: 1,
                                        borderColor: isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                                        backgroundColor: isFocused ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                                        borderRadius: 8,
                                    }]}
                                    placeholder="123456789"
                                    placeholderTextColor={'#9CA3AF'}
                                    value={loginInfo}
                                    onChangeText={(newVal) => { setLoginInfo(newVal); setValid(true); }}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    caretHidden={!isFocused}
                                    keyboardType="phone-pad"
                                />
                            </View>
                            
                            <Text style={[tw`text-white mb-2 mt-2 text-[16px]`, { fontFamily: 'Nunito-Bold' }]}>Enter password</Text>
                            <ImageBackground
                                source={require('../../assets/images/galaxy.jpg')}
                                imageStyle={{ borderRadius: 8, opacity: isFocusedPass ? 0.3 : 0 }}
                                style={tw`w-full rounded-[2]`}
                            >
                                <TextInput
                                    style={[
                                        tw`w-full px-3 py-3 text-white text-[15px]`,
                                        {
                                            fontFamily: 'Nunito-Medium',
                                            borderWidth: 1,
                                            borderColor: isFocusedPass ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                                            backgroundColor: isFocusedPass ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                                            borderRadius: 8,
                                        }
                                    ]}
                                    placeholder="Password"
                                    placeholderTextColor={'#9CA3AF'}
                                    value={password}
                                    onChangeText={(newVal) => { setPassword(newVal); setValid(true); }}
                                    onFocus={() => setIsFocusedPass(true)}
                                    onBlur={() => setIsFocusedPass(false)}
                                    secureTextEntry={true}
                                />
                            </ImageBackground>
                        </View>}

                        {/* Error */}
                        {notRegistered && (
                            <View style={tw`w-full py-2.5 mt-2 items-center justify-center bg-[#FF1769] rounded-[2]`}>
                                <Text style={[tw`text-white text-[14px]`, { fontFamily: 'Nunito-Medium' }]}>This email is not registered yet.{' '}
                                    <Text
                                        style={{ fontFamily: 'Nunito-ExtraBold', textDecorationLine: 'underline' }}
                                        onPress={() => router.replace('/(auth)/signup')}
                                    >
                                        Create an account?
                                    </Text>
                                </Text>
                            </View>
                        )}
                        {(!valid && !notRegistered) && (
                            <View style={tw`w-full py-2 mt-2 items-center justify-center bg-[#FF1769] rounded-[2]`}>
                                <Text style={[tw`text-[#FFFFFF]`, { fontFamily: 'Nunito-Bold' }]}>Oops, wrong password or email 😭</Text>
                            </View>
                        )}

                        <View style={tw`w-full py-2 mt-1.5 justify-start items-start`}>
                            <Text style={[tw`text-[13px] text-white`, { fontFamily: 'Nunito-Medium' }]}>Don't want to use {mode === 'email' ? 'email' : 'phone number'}?{' '}</Text>
                            <TouchableOpacity activeOpacity={0.8} onPress={() => { setMode(mode === 'email' ? 'phone' : 'email'); setLoginInfo('') }}>
                                <Text style={{ fontFamily: 'Nunito-ExtraBold', color: '#fff', fontSize: 13 }}>Log in with {mode === 'email' ? 'phone number' : 'email'} instead</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bottom content - fixed at bottom */}
                    <Text style={[tw`text-white text-[11px] text-center mt-5 mb-4`, { fontFamily: 'Nunito-Regular' }]}>
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
                        disabled={
                            (mode === 'email' && (!loginInfo.trim() || !loginInfo.includes('@')))
                            || (mode === 'phone' && !loginInfo.trim())
                        }
                        style={[
                            tw`rounded-full py-[10] w-full items-center mb-4`,
                            {
                                backgroundColor:
                                    (mode === 'email' && loginInfo.trim() && loginInfo.includes('@')) ||
                                    (mode === 'phone' && loginInfo.trim())
                                        ? '#FFFFFF' : '#FFFFFF',
                                opacity:
                                    (mode === 'email' && loginInfo.trim() && loginInfo.includes('@')) ||
                                    (mode === 'phone' && loginInfo.trim())
                                        ? 1 : 0.3
                            }
                        ]}
                    >
                        <Text style={[tw`text-black text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Log in</Text>
                    </TouchableOpacity>
                    <View style={tw`flex-row items-center justify-center mb-8`}>
                        <TouchableOpacity onPress={() => router.replace('/(auth)/signup')}>
                            <Text style={[tw`text-white text-[13px]`, { fontFamily: 'Nunito-Medium' }]}>
                                First time to Homee? <Text style={[tw`text-white text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Sign up</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </GradientBackground>
    );
}
