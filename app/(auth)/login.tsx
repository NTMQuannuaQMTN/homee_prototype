import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ImageBackground, Keyboard, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import tw from 'twrnc';
import { useAuthStore } from "../store/authStore";

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
                    <Text style={[tw`text-white text-sm text-center mb-2`, { fontFamily: 'Nunito-Medium' }]}>Welcome back!</Text>
                    <Text style={[tw`text-white text-lg text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>Login to continue 🔥</Text>
                </View>

                {/* Form */}
                <View style={tw`w-full`}>
                    <Text style={[tw`text-white mb-1.5 text-[15px]`, { fontFamily: 'Nunito-SemiBold' }]}>User email</Text>
                    <ImageBackground
                      source={require('../../assets/images/galaxy.jpg')}
                      imageStyle={{ borderRadius: 8, opacity: isFocused ? 0.3 : 0 }}
                      style={tw`w-full rounded-[2]`}
                    >
                      <TextInput
                        style={[
                          tw`h-10 w-full px-3 py-2 text-white text-[14px]`,
                          {
                            fontFamily: 'Nunito-Medium',
                            borderWidth: 1,
                            borderColor: isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                            backgroundColor: isFocused ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                            borderRadius: 8,
                          }
                        ]}
                        placeholder="hello@gmail.com"
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
            <Text style={[tw`text-white text-[11px] text-center mb-4`, { fontFamily: 'Nunito-Regular' }]}>By tapping SEND CODE, you consent to receive email updates from us or event hosts. Unsubscribe in the emails</Text>
            <TouchableOpacity onPress={checkEmail}
                style={tw`bg-white rounded-full py-[10] w-full items-center mb-4`}>
                <Text style={[tw`text-black text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Send code</Text>
            </TouchableOpacity>
            <View style={tw`flex-row items-center justify-center mb-8`}>
                <Text style={[tw`text-white text-[12px] mr-1`, { fontFamily: 'Nunito-Regular' }]}>First time in Sizzl?</Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/signup')}>
                    <Text style={[tw`text-white underline text-[12px]`, { fontFamily: 'Nunito-Medium' }]}>Signup</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
        </TouchableWithoutFeedback>
    );
}
