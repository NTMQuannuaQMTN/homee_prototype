import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ImageBackground, Keyboard, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import tw from 'twrnc';
import { useAuthStore } from "../store/authStore";
import GradientBackground from "../components/GradientBackground";
import IconLogo from "../../assets/logo/icon.svg";

export default function Login() {
    const router = useRouter();
    const [valid, setValid] = useState(true);
    const [email, setEmail] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const { setSignupInfo } = useAuthStore();

    const checkEmail = async () => {
        console.log("Checking email", email);
        if (email.indexOf('@') >= 0) {
            // Always use lowercase for email
            const lowerEmail = email.trim().toLowerCase();
            setSignupInfo({ email: lowerEmail });

            console.log("Sending OTP to", lowerEmail);

            const { error } = await supabase.auth.signInWithOtp({
                email: lowerEmail,
                options: {
                    shouldCreateUser: false, // Only allow login for existing users
                    emailRedirectTo: 'exp://j3bihve-courtins-8081.exp.direct',
                },
            });

            if (error) {
                Alert.alert("Error", "This email is not registered with us. Please sign up first.");
                return;
            }

            router.replace('/(auth)/verify');
        }
    };

    return (
        <GradientBackground>
            <TouchableWithoutFeedback onPress={() => {
                Keyboard.dismiss();
                setIsFocused(false);
            }}>
                <View style={{ flex: 1 }}>
                    {/* Center content - takes up most of the screen */}
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <View style={tw`mb-8 items-center`}>
                    <IconLogo width={80} height={80} style={tw``} />
                    <Text style={[tw`text-white text-[22px] text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>Please login to continue ✨</Text>
                </View>

                {/* Form */}
                <View style={tw`w-full`}>
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
                            borderRadius: 10,
                          }
                        ]}
                        placeholder="hello@example.com"
                        placeholderTextColor={'#9CA3AF'}
                        value={email}
                        onChangeText={(newVal) => { setEmail(newVal); setValid(true); }}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        caretHidden={!isFocused}
                      />
                    </ImageBackground>
                </View>

                {/* Error */}
                {valid ||
                <View style={tw`w-full py-2 mt-1.5 items-center justify-center bg-[#FF1769] rounded-[2]`}>
                    <Text style={[tw`text-[#FFFFFF]`, { fontFamily: 'Nunito-Medium' }]}>Oops, you gotta use a proper .edu email 😭</Text>
                </View>}
            </View>

            {/* Bottom content - fixed at bottom */}
            <Text style={[tw`text-white text-[11px] text-center mb-4`, { fontFamily: 'Nunito-Regular' }]}>
                By tapping SEND CODE, you are agreeing to our <Text style={{ fontFamily: 'Nunito-Bold' }}>Community Guidelines</Text>, <Text style={{ fontFamily: 'Nunito-Bold' }}>Terms of Service</Text>, and <Text style={{ fontFamily: 'Nunito-Bold' }}>Privacy Policy</Text>.
            </Text>
            <TouchableOpacity 
                onPress={checkEmail}
                disabled={!email.trim()}
                style={[
                    tw`rounded-full py-[10] w-full items-center mb-4`,
                    {
                        backgroundColor: email.trim() ? '#FFFFFF' : '#FFFFFF',
                        opacity: email.trim() ? 1 : 0.3
                    }
                ]}
            >
                <Text style={[tw`text-black text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Send code</Text>
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
