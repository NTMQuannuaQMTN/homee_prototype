import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from 'react';
import { ImageBackground, Keyboard, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import tw from 'twrnc';
import { useAuthStore } from "../store/authStore";

export default function Verify() {
    const [code, setCode] = useState('');
    const MAXLENGTH = 6;
    const [valid, setValid] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const router = useRouter();
    const { signupInfo, setUser, setSession } = useAuthStore();

    // Countdown timer effect
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (countdown > 0) {
            timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    // Function to resend OTP
    const resendOTP = async () => {
        if (!signupInfo?.email || !canResend) return;
        
        // Reset countdown
        setCountdown(60);
        setCanResend(false);
        
        console.log("Resending OTP to:", signupInfo.email);
        const { error } = await supabase.auth.signInWithOtp({
            email: signupInfo.email,
            options: {
                shouldCreateUser: true,
                emailRedirectTo: 'exp://j3bihve-courtins-8081.exp.direct',
            },
        });

        if (error) {
            console.log("OTP resend error", error.message);
        } else {
            console.log("OTP resent successfully");
        }
    };

    // Function to verify the entered OTP code
    const checkCode = async (inputCode?: string) => {
        const codeToCheck = inputCode ?? code;
        if (codeToCheck.length !== MAXLENGTH || !signupInfo?.email) {
            setValid(false);
            return;
        }

        setLoading(true);

        // Always use lowercase for email
        const lowerEmail = signupInfo.email.trim().toLowerCase();

        const { data, error } = await supabase.auth.verifyOtp({
            email: lowerEmail,
            token: codeToCheck,
            type: "email", // Use "email_otp" if "email" doesn't work for your supabase-js version.
        });

        setLoading(false);

        if (error) {
            setValid(false);
            console.log("Verification error:", error.message);
        } else if (data && data.session && data.user) {
            console.log("Verification successful:", data);
            const { data: userData, error: userError } = await supabase.from('users')
                .select('profile_image').eq('email', lowerEmail).single();
            if (userError) {
                router.replace('/(auth)/register');
            } else {
                // Existing user: check for profile image
                console.log("profile_image value:", userData.profile_image);
                if (userData.profile_image && userData.profile_image.trim() !== '') {
                    router.replace('/(home)/home/homepage');
                } else {
                    router.replace('/(auth)/image');
                }
            }
        } else {
            setValid(false);
            console.log("Verification failed: No session returned");
        }
    };

    return (
        <TouchableWithoutFeedback onPress={() => {
            Keyboard.dismiss();
            setIsFocused(false);
        }}>
            <LinearGradient
                colors={['#080B32', '#0E1241', '#291C56', '#392465', '#51286A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ flex: 1, padding: 20 }}
            >
            {/* Center content - takes up most of the screen */}
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <View style={tw`mb-8`}>
                    <Text style={[tw`text-white text-sm text-center mb-2`, { fontFamily: 'Nunito-Medium' }]}>Check your email inbox!</Text>
                    <Text style={[tw`text-white text-lg text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>Type in the code 🙌</Text>
                </View>

                {/* Form */}
                <View style={tw`w-full`}>
                    <Text style={[tw`text-white mb-1.5 text-[15px]`, { fontFamily: 'Nunito-SemiBold' }]}>Verification code</Text>
                    <ImageBackground
                        source={require('../../assets/images/galaxy.jpg')}
                        imageStyle={{ borderRadius: 8, opacity: isFocused ? 0.3 : 0 }}
                        style={tw`w-full rounded-[2]`}
                    >
                        <View style={tw`w-full relative items-center`}>
                            <TextInput 
                                style={[
                                    tw`text-center h-10 w-full px-3 py-2 text-[14px]`,
                                    {
                                        fontFamily: 'Nunito-Medium',
                                        borderWidth: 1,
                                        borderColor: isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                                        color: 'transparent', // Make the actual text invisible
                                        backgroundColor: isFocused ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                                        borderRadius: 8,
                                        textAlign: 'center',
                                    }
                                ]}
                                value={code}
                                onChangeText={newCode => {
                                    setCode(newCode);
                                    setValid(true);
                                    if (newCode.length === MAXLENGTH) {
                                        checkCode(newCode);
                                    }
                                }}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                maxLength={MAXLENGTH}
                                caretHidden={true} // Always hide the cursor since we have overlay
                                keyboardType="numeric"
                                autoComplete="one-time-code"
                                selectionColor="transparent" // Hide text selection
                            />
                            <View style={tw`w-full h-10 py-2 items-center justify-center absolute top-0`}>
                                <Text style={[tw`${code.length > 0 ? 'text-white' : 'text-gray-400'} text-md tracking-[2]`, { fontFamily: 'Nunito-Medium' }]}> 
                                    {code + '_'.repeat(MAXLENGTH - code.length)}
                                </Text>
                            </View>
                        </View>
                    </ImageBackground>
                </View>

                {/* Error */}
                {valid || 
                <View style={tw`w-full py-2 mt-1.5 items-center justify-center bg-[#FF1769] rounded-[2]`}>
                    <Text style={[tw`text-white`, { fontFamily: 'Nunito-Medium' }]}>Oops, the code doesn't match 😭</Text>
                </View>}

                {/* Resend section */}
                <View style={tw`mt-4 items-center flex-row`}>
                    <Text style={[tw`text-white text-[12px]`, { fontFamily: 'Nunito-Medium' }]}>Haven't seen the code? </Text>
                    {canResend ? (
                        <TouchableOpacity onPress={resendOTP}>
                            <Text style={[tw`text-white underline text-[12px]`, { fontFamily: 'Nunito-Medium' }]}>Resend code</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={[tw`text-gray-400 text-[12px]`, { fontFamily: 'Nunito-Medium' }]}>
                            Resend code ({countdown}s)
                        </Text>
                    )}
                </View>
            </View>

            {/* Bottom button - fixed at bottom */}
            <TouchableOpacity
                style={tw`bg-white rounded-full py-[10] w-full items-center mb-8 ${loading ? 'opacity-50' : ''}`}
                onPress={() => checkCode()}
                disabled={loading}
            >
                <Text style={[tw`text-black text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>
                    {loading ? 'Verifying...' : 'Continue'}
                </Text>
            </TouchableOpacity>
        </LinearGradient>
        </TouchableWithoutFeedback>
    );
}