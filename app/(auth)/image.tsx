import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
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
      // Find user by email
      console.log('Looking for user with email:', signupInfo.email);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, profile_image')
        .eq('email', signupInfo.email)
        .single();
      
      if (userError) {
        console.log('User lookup error:', userError);
        throw userError;
      }
      
      const userID = userData?.id;
      if (!userID) throw new Error('User not found');
      
      console.log('Found user data:', userData);
      console.log('User ID:', userID);
      console.log('Current profile_image:', userData?.profile_image);

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
        .from('sizzl-profileimg')
        .upload(fileName, uint8Array, {
          contentType: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
          upsert: true
        });

      if (uploadError) {
        console.log('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('sizzl-profileimg')
        .getPublicUrl(fileName);
      
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error('Failed to get public URL');

      // Update user profile with image URL
      console.log('Attempting to update profile_image for user:', userID);
      console.log('New profile_image URL:', publicUrl);
      
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ profile_image: publicUrl })
        .eq('id', userID)
        .select();

      if (updateError) {
        console.log('Database update error:', updateError);
        throw updateError;
      }

      console.log('Update response data:', updateData);
      console.log('Number of rows updated:', updateData?.length || 0);

      if (updateData?.length === 0) {
        throw new Error('No rows were updated - this might be a policy issue');
      }

      console.log('Profile image updated successfully:', publicUrl);
      Alert.alert('Success', 'Profile image uploaded successfully!');
      router.replace('/(home)/home/homepage');
    } catch (err) {
      console.log('Full error:', err);
      const errorMessage = (err instanceof Error && err.message) ? err.message : String(err);
      Alert.alert('Image upload failed', errorMessage);
    }
    setLoading(false);
  };

  return (
    <LinearGradient
      colors={['#080B32', '#0E1241', '#291C56', '#392465', '#51286A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1, padding: 24 }}
    >
      {/* Center content */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={tw`mb-20`}>
            <Text style={[tw`text-white text-sm text-center mb-2`, { fontFamily: 'Nunito-Medium' }]}>Add your profile image</Text>
            <Text style={[tw`text-white text-lg text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>Make it easier to find your friends 💛</Text>
        </View>
        <TouchableOpacity style={tw`w-32 h-32 items-center justify-center rounded-full mb-6 relative`}
          onPress={pickImage}>
          {imageInput ? (
            <Image style={tw`w-full h-full rounded-full`} resizeMode="contain" source={{ uri: imageInput }} />
          ) : (
            <>
              <DefaultProfileSVG width={150} height={150} style={tw`rounded-full`} />
              <View style={tw`absolute bottom--2 right-0 bg-white rounded-full w-8 h-8 items-center justify-center shadow-lg`}>
                <Ionicons name="camera" size={16} color="#080B32" />
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Bottom buttons */}
      <View style={tw`items-center`}>
        <TouchableOpacity
          style={tw`bg-white rounded-full py-3 w-full items-center mb-4`}
          onPress={imageInput ? confirmImage : pickImage}
          disabled={loading}
        >
          <Text style={[tw`text-black`, { fontFamily: 'Nunito-ExtraBold' }]}>
            {loading ? 'Uploading...' : imageInput ? "Let's start!" : "Add image"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`mb-10`}
          onPress={() => router.replace('/')}
        >
          <Text style={[tw`text-gray-400 text-[12px]`, { fontFamily: 'Nunito-Medium' }]}>Hmm... I'll do this later</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
