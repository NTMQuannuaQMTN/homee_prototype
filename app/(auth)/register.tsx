import { supabase } from '@/utils/supabase';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import tw from 'twrnc';
import { useAuthStore } from '../store/authStore';
import IconLogo from '../../assets/logo/icon.svg';

export default function Register() {
  const router = useRouter();
  // Helper to check if all required fields are filled
  const allFieldsFilled = () => {
    return (
      registerInfo.username.trim().length > 0 &&
      registerInfo.name.trim().length > 0
    );
  };
  const { signupInfo } = useAuthStore();
  const [imagePage, setImagePage] = useState(false);
  const [focusedField, setFocusedField] = useState<null | 'username' | 'name'>(null);
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(true);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [imageInput, setImageInput] = useState('');
  const [registerInfo, setRegisterInfo] = useState({
    username: '',
    name: ''
  })

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1
    });

    console.log(result);

    if (!result.canceled) {
      setImageInput(result.assets[0].uri);
    }
  }

  const checkRegister = async () => {
    setLoading(true);
    setShowFieldErrors(true);

    // Username validation: 4+ chars, only a-z, 0-9, _, .
    const usernameRegex = /^[a-z0-9_.]{4,}$/;
    if (!usernameRegex.test(registerInfo.username)) {
      setValid(false);
      setLoading(false);
      return false;
    }
    const { error } = await supabase.from('users').select('*')
      .eq('username', registerInfo.username).single();
    if (!error) {
      setValid(false);
      setLoading(false);
      return false;
    }

    // Name validation: 1+ characters, letters and spaces only
    const nameRegex = /^[a-zA-Z\s]{1,}$/;
    if (!nameRegex.test(registerInfo.name.trim())) {
      setValid(false);
      setLoading(false);
      return false;
    }

    // All validations passed
    setValid(true);
    setLoading(false);

    // TODO: Save user data to database
    console.log('Registration data:', {
      username: registerInfo.username,
      name: registerInfo.name.trim()
    });

    const { error: insertError } = await supabase.from('users').insert({ ...registerInfo, ...signupInfo }).select().single();

    if (insertError) { console.log("INSERT ERR:", insertError.message) }

    return true;
  }

  const confirmRegister = async () => {
    if (!imageInput) return;
    console.log(imageInput);
    const { data } = await supabase.from('users').select('id').eq('username', registerInfo.username).single();
    const userID = data?.id;

    try {
      const filePath = `avatar/${userID}`;

      const response = await fetch(imageInput);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('homee-img')
        .upload(filePath, blob);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return;
      }

      const { data: urlData } = await supabase.storage
        .from('homee-img')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl;
      console.log(publicUrl);

      const { error: setAvatarError } = await supabase.from('users').update({ 'profile_image': publicUrl }).eq('id', userID).select();

      if (setAvatarError) {
        console.error("Set error:", setAvatarError);
      } else {
        const {data: checkData} = await supabase.from('users').select('profile_image').eq('username', registerInfo.username).single();
        console.log(checkData);
      }
    } catch (err) {
      console.error('Image upload failed:', err);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setFocusedField(null); }}>
      <LinearGradient
        colors={['#080B32', '#0E1241', '#291C56', '#392465', '#51286A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1, padding: 20 }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={tw`mb-8 items-center`}>
              <IconLogo width={80} height={80} style={tw``} />
              <Text style={[tw`text-white text-[16px] text-center mb-1`, { fontFamily: 'Nunito-Medium' }]}>{imagePage ? 'Add your profile image!' : 'Almost there!'}</Text>
              <Text style={[tw`text-white text-[22px] text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>{imagePage ? 'Make it easier to find your friends 💛' : 'Let\'s finish your profile 🤗'}</Text>
            </View>

            {imagePage ||
              <View style={tw`w-full`}>
                {/* Form */}
                <Text style={[tw`text-white mb-2 text-[16px]`, { fontFamily: 'Nunito-Bold' }]}>Enter your username</Text>
                <ImageBackground
                  source={require('../../assets/images/galaxy.jpg')}
                  imageStyle={{ borderRadius: 8, opacity: focusedField === 'username' ? 0.3 : 0 }}
                  style={tw`w-full rounded-[2]`}
                >
                  <TextInput
                    style={[
                      tw`w-full px-3 py-3 text-[15px]`,
                      {
                        fontFamily: 'Nunito-Medium',
                        borderWidth: 1,
                        borderColor:
                          showFieldErrors && !/^[a-z0-9_.]{4,}$/.test(registerInfo.username)
                            ? '#FF1769'
                            : focusedField === 'username'
                              ? '#FFFFFF'
                              : 'rgba(255, 255, 255, 0.1)',
                        backgroundColor: focusedField === 'username' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                        borderRadius: 8,
                        color:
                          showFieldErrors && !/^[a-z0-9_.]{4,}$/.test(registerInfo.username)
                            ? '#FF1769'
                            : '#FFFFFF',
                      },
                    ]}
                    value={registerInfo.username}
                    placeholder="choppedpartythrower"
                    placeholderTextColor={'#9CA3AF'}
                    onChangeText={newUsername => {
                      setRegisterInfo(regInfo => ({ ...regInfo, username: newUsername }));
                      setValid(true);
                      setShowFieldErrors(false);
                    }}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    caretHidden={focusedField !== 'username'}
                  />
                </ImageBackground>
                <Text
                  style={[
                    tw`text-[12px] text-left mt-2 mb-4 leading-[1.2]`,
                    {
                      fontFamily: 'Nunito-Medium',
                      color:
                        showFieldErrors && !/^[a-z0-9_.]{4,}$/.test(registerInfo.username)
                          ? '#FF1769'
                          : '#FFFFFF',
                    },
                  ]}
                >
                  Must be between a-z, 0-9, _ , . and have at least 4 characters
                </Text>

                {/* First name */}
                <Text style={[tw`text-white mt-1 mb-2 text-[16px]`, { fontFamily: 'Nunito-Bold' }]}>Enter your name</Text>
                <ImageBackground
                  source={require('../../assets/images/galaxy.jpg')}
                  imageStyle={{ borderRadius: 8, opacity: focusedField === 'name' ? 0.3 : 0 }}
                  style={tw`w-full rounded-[2]`}
                >
                  <TextInput
                    style={[
                      tw`w-full px-3 py-3 text-[15px]`,
                      {
                        fontFamily: 'Nunito-Medium',
                        borderWidth: 1,
                        borderColor:
                          showFieldErrors && !/^[a-zA-Z\s]{1,}$/.test(registerInfo.name.trim())
                            ? '#FF1769'
                            : focusedField === 'name'
                              ? '#FFFFFF'
                              : 'rgba(255, 255, 255, 0.1)',
                        backgroundColor: focusedField === 'name' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                        borderRadius: 8,
                        color:
                          showFieldErrors && !/^[a-zA-Z\s]{1,}$/.test(registerInfo.name.trim())
                            ? '#FF1769'
                            : '#FFFFFF',
                      },
                    ]}
                    value={registerInfo.name}
                    placeholder="Sizzle"
                    placeholderTextColor={'#9CA3AF'}
                    onChangeText={newName => {
                      setRegisterInfo(regInfo => ({ ...regInfo, name: newName }));
                      setValid(true);
                      setShowFieldErrors(false);
                    }}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    caretHidden={focusedField !== 'name'}
                  />
                </ImageBackground>
                <Text
                  style={[
                    tw`text-[12px] text-left mt-2 mb-4 leading-[1.2]`,
                    {
                      fontFamily: 'Nunito-Medium',
                      color:
                        showFieldErrors && !/^[a-zA-Z\s]{1,}$/.test(registerInfo.name.trim())
                          ? '#FF1769'
                          : '#FFFFFF',
                    },
                  ]}
                >
                  Must have at least 1 character
                </Text>

                {/* Error */}
                {valid ||
                  <View style={tw`w-full py-2 mt-1.5 items-center justify-center bg-[#FF1769] rounded-[2]`}>
                    <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-Bold' }]}>Oops, check your input again 😭</Text>
                  </View>}
              </View>}
            {/* imagePage UI moved to image.tsx */}
          </View>
          {/* Bottom button - fixed at bottom */}
          <TouchableOpacity
            style={[
              tw`rounded-full py-[10] w-full items-center mt-15 mb-4`,
              {
                backgroundColor: (loading || !allFieldsFilled()) ? '#FFFFFF' : '#FFFFFF',
                opacity: (loading || !allFieldsFilled()) ? 0.3 : 1
              }
            ]}
            onPress={async () => {
              if (!imagePage && await checkRegister()) router.replace('/(auth)/image');
            }}
            disabled={loading || !allFieldsFilled()}
          >
            <Text style={[tw`text-black text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>
              {loading ? 'Verifying...' : imagePage ? 'Let\'s start!' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}