import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import GradientBackground from '../components/GradientBackground';
import IconLogo from '../../assets/logo/icon.svg';
import { useRouter } from 'expo-router';
import { useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import tw from 'twrnc';
import { useAuthStore } from '../store/authStore';

import DefaultProfileSVG from '../../assets/icons/pfpdefault.svg';

export default function ImagePage() {
  const router = useRouter();
  const { signupInfo } = useAuthStore();
  const [imageInput, setImageInput] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1
    });
    if (!result.canceled) {
      setImageInput(result.assets[0].uri);
    }
  };

  const confirmImage = async () => {
    if (!imageInput || !signupInfo) return;
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, profile_image')
        .eq('email', signupInfo.email)
        .single();
      
      if (userError) {
        throw userError;
      }
      
      const userID = userData?.id;
      if (!userID) throw new Error('User not found');

      // Get file info and determine file extension
      const fileUri = imageInput;
      const fileExtension = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `avatar/${userID}.${fileExtension}`;
      
      // Read file as ArrayBuffer for proper binary upload
      const fileArrayBuffer = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Convert base64 to Uint8Array
      const byteCharacters = atob(fileArrayBuffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const uint8Array = new Uint8Array(byteNumbers);

      // Upload file as binary data
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('homee-img')
        .upload(fileName, uint8Array, {
          contentType: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('homee-img')
        .getPublicUrl(fileName);
      
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error('Failed to get public URL');
      
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ profile_image: publicUrl })
        .eq('id', userID)
        .select();

      if (updateError) {
        throw updateError;
      }

      if (updateData?.length === 0) {
        throw new Error('No rows were updated - this might be a policy issue');
      }

      Alert.alert('Success', 'Profile image uploaded successfully!');
      router.replace('/(home)/home/homepage');
    } catch (err) {
      const errorMessage = (err instanceof Error && err.message) ? err.message : String(err);
      Alert.alert('Image upload failed', errorMessage);
    }
    setLoading(false);
  };

  return (
    <GradientBackground>
      <View style={{ flex: 1 }}>
        {/* Center content - similar to signup.tsx */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={tw`mb-8 items-center`}>
            <IconLogo width={80} height={80} />
            <Text style={[tw`text-white text-[22px] text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>Add your profile image</Text>
            <Text style={[tw`text-white text-[15px] text-center mt-2`, { fontFamily: 'Nunito-Bold' }]}>Make it easier for friends to find you 💛</Text>
          </View>
          <TouchableOpacity
            style={tw`mt-5 w-32 h-32 items-center justify-center rounded-full mb-6 relative bg-white/10 border-2 border-white/20`}
            onPress={pickImage}
            activeOpacity={0.7}
          >
            {imageInput ? (
              <Image style={[tw`rounded-full border border-[#7A5CFA]`, { width: 160, height: 160 }]} resizeMode="cover" source={{ uri: imageInput }} />
            ) : (
              <DefaultProfileSVG width={160} height={160} style={tw`rounded-full`} />
            )}
            <View style={tw`absolute bottom--4 right--2 bg-[#7A5CFA] rounded-full w-10 h-10 items-center justify-center shadow-xl`}>
              <Ionicons name="camera" size={20} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>
        {/* Bottom content - similar to signup.tsx */}
        <View style={tw`items-center`}>
          <TouchableOpacity
            style={tw`rounded-full py-3 w-full items-center mb-4 bg-white`}
            onPress={imageInput ? confirmImage : pickImage}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={[tw`text-black text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}> 
              {loading ? 'Uploading...' : imageInput ? "Let’s start!" : "Add image"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`mb-10`}
            onPress={() => router.replace('/home/homepage')}
            activeOpacity={0.7}
          >
            <Text style={[tw`text-white text-[13px]`, { fontFamily: 'Nunito-Medium' }]}>I’ll do this later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
}
