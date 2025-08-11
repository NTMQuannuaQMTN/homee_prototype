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

export default function SignUp() {
    const router = useRouter();
    const [valid, setValid] = useState(true);
    const [passRule, setPassRule] = useState([false, false, false, false]);
    const [alreadyVerified, setAlreadyVerified] = useState(false);
    const [mode, setMode] = useState<'phone' | 'email'>('phone');
    const [loginInfo, setLoginInfo] = useState('');
    const [password, setPassword] = useState('');
    const [phoneCode, setPhoneCode] = useState('');
    const [country, setCountry] = useState({ cca2: 'US', callingCode: ['1'] });
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isFocusedCode, setIsFocusedCode] = useState(false);
    const [isFocusedPass, setIsFocusedPass] = useState(false);

    // State for password visibility toggle
    const [showPassword, setShowPassword] = useState(false);

    const { setSignupInfo, setPass } = useAuthStore();

    const checkEmail = async (email: string) => {
        setAlreadyVerified(false);
        if (email.indexOf('@') >= 0) {
            // Always compare emails in lowercase
            const lowerEmail = email.trim().toLowerCase();
            // Fetch all users with the same email, case-insensitive
            const { data: users, error: userError } = await supabase
                .from('users')
                .select('email')
                .eq('email', lowerEmail).single();
            if (users && !userError) {
                // Check if any user email matches input, case-insensitive
                setAlreadyVerified(true);
                return;
            }
            setSignupInfo({ email: lowerEmail });
            setPass(password);

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
            Alert.alert('Please enter a valid phone number');
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
                <View style={tw`flex-1 mx-4`}> 
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

                            <Text style={[tw`text-white mb-2 mt-4 text-[16px]`, { fontFamily: 'Nunito-Bold' }]}>Create a password</Text>
                            <ImageBackground
                                source={require('../../assets/images/galaxy.jpg')}
                                imageStyle={{ borderRadius: 8, opacity: isFocusedPass ? 0.3 : 0 }}
                                style={tw`w-full rounded-[2]`}
                            >
                                <View style={tw`flex-row items-center`}>
                                    <TextInput
                                        style={[
                                            tw`flex-1 px-3 py-3 text-white text-[15px]`,
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
                                        onChangeText={(newVal) => {
                                            setPassword(newVal); setValid(true);
                                            setPassRule([
                                                /[A-Z]/.test(newVal),      // At least one uppercase letter
                                                /[a-z]/.test(newVal),      // At least one lowercase letter
                                                /[0-9]/.test(newVal),      // At least one number
                                                newVal.length >= 6         // At least 6 characters
                                            ])
                                        }}
                                        onFocus={() => setIsFocusedPass(true)}
                                        onBlur={() => setIsFocusedPass(false)}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword((prev) => !prev)}
                                        style={tw`absolute right-0 px-3 py-3`}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-off' : 'eye'}
                                            size={18}
                                            color="#fff"
                                        />
                                    </TouchableOpacity>
                                </View>
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
                                    withFlag={false}
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
                                    onChangeText={(newVal) => {
                                        setLoginInfo(newVal); setValid(true);
                                        setPassRule([
                                            
                                        ])
                                    }}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    caretHidden={!isFocused}
                                />
                            </View>

                            <Text style={[tw`text-white mb-2 mt-2 text-[16px]`, { fontFamily: 'Nunito-Bold' }]}>Create a password</Text>
                            <ImageBackground
                                source={require('../../assets/images/galaxy.jpg')}
                                imageStyle={{ borderRadius: 8, opacity: isFocusedPass ? 0.3 : 0 }}
                                style={tw`w-full rounded-[2]`}
                            >
                                <View style={tw`flex-row items-center`}>
                                    <TextInput
                                        style={[
                                            tw`flex-1 px-3 py-3 text-white text-[15px]`,
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
                                        onChangeText={(newVal) => { setPassword(newVal); setValid(true);
                                            setPassRule([
                                                /[A-Z]/.test(newVal),      // At least one uppercase letter
                                                /[a-z]/.test(newVal),      // At least one lowercase letter
                                                /[0-9]/.test(newVal),      // At least one number
                                                newVal.length >= 6         // At least 6 characters
                                            ])
                                        }}
                                        onFocus={() => setIsFocusedPass(true)}
                                        onBlur={() => setIsFocusedPass(false)}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword((prev) => !prev)}
                                        style={tw`absolute right-0 px-3 py-3`}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-off' : 'eye'}
                                            size={18}
                                            color="#fff"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </ImageBackground>
                        </View>}
                        
                        {isFocusedPass && (
                            <View style={tw`w-full mt-2`}> 
                                <View style={tw`flex-row items-center mb-1`}>
                                    <Ionicons name={passRule[0] ? 'checkmark-circle' : 'close-circle'} size={16} color={passRule[0] ? tw.color('green-500') : tw.color('rose-600')} style={tw`mr-1.5`} />
                                    <Text style={[tw`${passRule[0] ? 'text-green-500' : 'text-rose-600'} text-[13px] text-left`, { fontFamily: 'Nunito-Medium' }]}>Must have at least one uppercase</Text>
                                </View>
                                <View style={tw`flex-row items-center mb-1`}>
                                    <Ionicons name={passRule[1] ? 'checkmark-circle' : 'close-circle'} size={16} color={passRule[1] ? tw.color('green-500') : tw.color('rose-600')} style={tw`mr-1.5`} />
                                    <Text style={[tw`${passRule[1] ? 'text-green-500' : 'text-rose-600'} text-[13px] text-left`, { fontFamily: 'Nunito-Medium' }]}>Must have at least one lowercase</Text>
                                </View>
                                <View style={tw`flex-row items-center mb-1`}>
                                    <Ionicons name={passRule[2] ? 'checkmark-circle' : 'close-circle'} size={16} color={passRule[2] ? tw.color('green-500') : tw.color('rose-600')} style={tw`mr-1.5`} />
                                    <Text style={[tw`${passRule[2] ? 'text-green-500' : 'text-rose-600'} text-[13px] text-left`, { fontFamily: 'Nunito-Medium' }]}>Must have at least one number</Text>
                                </View>
                                <View style={tw`flex-row items-center`}>
                                    <Ionicons name={passRule[3] ? 'checkmark-circle' : 'close-circle'} size={16} color={passRule[3] ? tw.color('green-500') : tw.color('rose-600')} style={tw`mr-1.5`} />
                                    <Text style={[tw`${passRule[3] ? 'text-green-500' : 'text-rose-600'} text-[13px] text-left`, { fontFamily: 'Nunito-Medium' }]}>Must have at least six characters</Text>
                                </View>
                            </View>
                        )}

                        {/* Error */}
                        {valid ||
                            <View style={tw`w-full py-2 mt-1.5 items-center justify-center bg-[#FF1769] rounded-[2]`}>
                                <Text style={[tw`text-[#FFFFFF]`, { fontFamily: 'Nunito-Medium' }]}>Oops, your password don't match our rules 😭</Text>
                            </View>}
                        {alreadyVerified &&
                            <View style={tw`w-full py-2 mt-1.5 items-center justify-center`}>
                                <Text style={[tw`text-[12px] text-white`, { fontFamily: 'Nunito-Medium' }]}>Hey, this email has been verified. <Text style={tw`underline`} onPress={() => router.replace('/(auth)/login')}>Login instead?</Text></Text>
                            </View>}

                        <View style={tw`w-full py-2 mt-1.5 justify-start items-start`}>
                            <Text style={[tw`text-[13px] text-white`, { fontFamily: 'Nunito-Medium' }]}>Don't want to use {mode === 'email' ? 'email' : 'phone number'}?{' '}</Text>
                            <TouchableOpacity activeOpacity={0.8} onPress={() => { setMode(mode === 'email' ? 'phone' : 'email'); setLoginInfo(''); setPassword(''); }}>
                                <Text style={{ fontFamily: 'Nunito-ExtraBold', color: '#fff', fontSize: 13 }}>Sign up with {mode === 'email' ? 'phone number' : 'email'} instead</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bottom content - fixed at bottom */}
                    <Text style={[tw`text-white text-[11px] text-center mt-5 mb-4`, { fontFamily: 'Nunito-Regular' }]}>
                        By tapping SEND CODE, you are agreeing to our <Text style={{ fontFamily: 'Nunito-Bold' }}>Community Guidelines</Text>, <Text style={{ fontFamily: 'Nunito-Bold' }}>Terms of Service</Text>, and <Text style={{ fontFamily: 'Nunito-Bold' }}>Privacy Policy</Text>.
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            // Password must have at least 1 lowercase, 1 uppercase, 1 number, and be at least 6 characters
                            if (passRule.indexOf(false) >= 0) {
                                setValid(false);
                                console.log(passRule.indexOf(false))
                                return;
                            }
                            if (mode === 'email') {
                                checkEmail(loginInfo);
                            } else {
                                checkPhone(loginInfo);
                            }
                        }}
                        disabled={
                            (mode === 'email' && (!loginInfo.trim() || !loginInfo.includes('@')))
                            || (mode === 'phone' && !loginInfo.trim())
                            || !password
                            || passRule.indexOf(false) >= 0
                        }
                        style={[
                            tw`rounded-full py-[10] w-full items-center mb-4`,
                            {
                                backgroundColor: '#FFFFFF',
                                opacity:
                                    ((mode === 'email' && (!loginInfo.trim() || !loginInfo.includes('@')))
                                    || (mode === 'phone' && !loginInfo.trim())
                                    || !password
                                    || passRule.indexOf(false) >= 0)
                                    ? 0.3 : 1
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