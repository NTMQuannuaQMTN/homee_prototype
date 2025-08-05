// Handle "Save changes" button press: confirm avatar and background image, and update all fields
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, ImageBackground, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import tw from 'twrnc';
import { useUserStore } from '../store/userStore';
import CustomDatePicker from './customdatepicker';

import { supabase } from '@/utils/supabase';
import Camera from '../../assets/icons/camera_icon.svg';
import FBIcon from '../../assets/icons/fb-icon.svg';
import InstagramIcon from '../../assets/icons/insta-icon.svg';
import SnapchatIcon from '../../assets/icons/snapchat-icon.svg';
import XIcon from '../../assets/icons/x-icon.svg';
import ProfileBackgroundWrapper from './background_wrapper';

const bggreenmodal = '#22C55E';

export default function EditProfile() {
  const [showSuccess, setShowSuccess] = useState(false);
  // Focus state for each input
  const [focus, setFocus] = useState({
    firstname: false,
    lastname: false,
    username: false,
    bio: false,
    instagramurl: false,
    xurl: false,
    snapchaturl: false,
    facebookurl: false,
    birthdate: false,
  });
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const [input, setInput] = useState({
    firstname: user?.firstname || null,
    lastname: user?.lastname || null,
    username: user?.username || null,
    bio: user?.bio || null,
    facebookurl: user?.facebookurl || null,
    instagramurl: user?.instagramurl || null,
    snapchaturl: user?.snapchaturl || null,
    xurl: user?.xurl || null,
  });
  const [dob, setDOB] = useState(user?.birthdate ? new Date(user?.birthdate) : new Date());
  const [dobInput, setDOBInput] = useState(user?.birthdate ? new Date(user?.birthdate) : new Date());
  const [dobAvail, setDOBAvail] = useState(user?.birthdate ? true : false);
  const [dobOpen, setDOBOpen] = useState(false);
  const [bgInput, setBgInput] = useState(user?.background_url || '');
  const [avtInput, setAvtInput] = useState(user?.profile_image || '');
  const [loading, setLoading] = useState(false);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // For modal picker, just set dobInput on change
  const onChangeDOB = (
    event: { type: string },
    date?: Date | undefined
  ) => {
    if (event.type === 'set' && date) {
      setDOBInput(date);
    } else {
      setDOBOpen(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    let d = date;
    if (typeof date === 'string') {
      d = new Date(date);
    }
    if (!(d instanceof Date) || isNaN(d.getTime())) return '';
    let year = d.getFullYear();
    let month = d.getMonth();
    let day = d.getDate();

    const monthToWord = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    return `${monthToWord[month]} ${day}, ${year}`;
  };

  const pickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1
    });
    if (!result.canceled) {
      setAvtInput(result.assets[0].uri);
      setTimeout(() => console.log(input), 0)
    }
  };

  const pickBackground = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 1
    });
    if (!result.canceled) {
      setBgInput(result.assets[0].uri);
      setTimeout(() => console.log(input), 0)
    }
  };

  const handleSave = async () => {

    setLoading(true);
    setFirstNameError(null);
    setLastNameError(null);
    setUsernameError(null);
    try {
      const usernameRegex = /^[a-z0-9_.]{4,}$/;
      let hasError = false;
      let usernameErr = null;
      // Username validation (now inline)
      if (!usernameRegex.test(input.username)) {
        usernameErr = 'Username can only contain a-z, 0-9, "_", ".", and has at least 4 letters.';
        hasError = true;
      } else {
        const { error } = await supabase.from('users').select('*')
          .eq('username', input.username).single();
        if (!error && user.username !== input.username) {
          usernameErr = 'Dang someone has got this username already, too bad!';
          hasError = true;
        }
      }

      const nameRegex = /^[a-zA-Z\s]{2,}$/;
      let firstNameErr = null;
      let lastNameErr = null;
      if (!nameRegex.test(input.firstname.trim())) {
        firstNameErr = 'The first name must be at least two letters and no other symbols than alphabets.';
        hasError = true;
      }
      if (!nameRegex.test(input.lastname.trim())) {
        lastNameErr = 'The last name must be at least two letters and no other symbols than alphabets.';
        hasError = true;
      }
      setFirstNameError(firstNameErr);
      setLastNameError(lastNameErr);
      setUsernameError(usernameErr);
      if (hasError) {
        setLoading(false);
        return false;
      }

      const userID = user?.user_id || user?.id;
      if (!userID) throw new Error('User ID not found');

      // Prepare avatar and background upload promises
      const avatarNeedsUpload = avtInput && avtInput !== user?.profile_image && avtInput.startsWith('file');
      const backgroundNeedsUpload = bgInput && bgInput !== user?.background_url && bgInput.startsWith('file');

      // Helper for uploading an image
      const uploadImage = async (fileUri: string, type: 'avatar' | 'background') => {
        const fileExtension = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${type === 'avatar' ? 'avatar' : 'background'}/${userID}.${fileExtension}`;
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
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('sizzl-profileimg')
          .upload(fileName, uint8Array, {
            contentType: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
            upsert: true,
          });
        if (uploadError) throw uploadError;
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('sizzl-profileimg')
          .getPublicUrl(fileName);
        if (!urlData?.publicUrl) throw new Error(`Failed to get ${type} public URL`);
        return urlData.publicUrl;
      };

      // Run uploads in parallel
      const [avatarResult, backgroundResult] = await Promise.allSettled([
        avatarNeedsUpload ? uploadImage(avtInput, 'avatar') : Promise.resolve(avtInput),
        backgroundNeedsUpload ? uploadImage(bgInput, 'background') : Promise.resolve(bgInput),
      ]);

      let profileImageUrl = avtInput;
      let backgroundUrl = bgInput;

      if (avatarResult.status === 'rejected') {
        Alert.alert('Avatar Upload Error', avatarResult.reason?.message || 'Failed to upload avatar image.');
        setLoading(false);
        return;
      } else if (avatarResult.status === 'fulfilled') {
        profileImageUrl = avatarResult.value;
      }

      if (backgroundResult.status === 'rejected') {
        Alert.alert('Background Upload Error', backgroundResult.reason?.message || 'Failed to upload background image.');
        setLoading(false);
        return;
      } else if (backgroundResult.status === 'fulfilled') {
        backgroundUrl = backgroundResult.value;
      }

      // 3. Update user fields in Supabase
      // Ensure birthdate is a string in YYYY-MM-DD format for Supabase date type (local, not UTC)
      let birthdate: string | null = null;
      if (dob instanceof Date && !isNaN(dob.getTime()) && dobAvail) {
        // Format as YYYY-MM-DD using local time to avoid timezone shift
        const year = dob.getFullYear();
        const month = String(dob.getMonth() + 1).padStart(2, '0');
        const day = String(dob.getDate()).padStart(2, '0');
        birthdate = `${year}-${month}-${day}`;
      } else if (typeof dob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dob) && dobAvail) {
        birthdate = dob;
      } else {
        birthdate = null;
      }

      const updateFields = {
        firstname: input.firstname,
        lastname: input.lastname,
        username: input.username,
        bio: input.bio,
        facebookurl: input.facebookurl,
        instagramurl: input.instagramurl,
        snapchaturl: input.snapchaturl,
        xurl: input.xurl,
        birthdate: birthdate,
        profile_image: profileImageUrl,
        background_url: backgroundUrl,
      };
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update(updateFields)
        .eq('id', userID)
        .select();
      if (updateError) throw updateError;

      // 4. Update local user store
      setUser({
        ...user,
        ...updateFields,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.replace({ pathname: '/(profile)/profile', params: { user_id: user?.id } });
      }, 1200);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = (selectedDate: Date) => {
    setDOBInput(selectedDate);
    setDOBAvail(true);
  };

  return (
    <>
      <ProfileBackgroundWrapper imageUrl={bgInput}>
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            if (dobOpen) {
              setDOB(dobInput);
              setDOBOpen(false);
            }
          }}
          accessible={false}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: Object.values(focus).some(Boolean) ? 20 : 0 }}
            >
              <View style={{ marginTop: 50, paddingTop: 3, marginHorizontal: 'auto', width: '90%', paddingBottom: 20 }}>
                <Text style={[tw`w-full text-center text-white text-[16px] mb-4`, { fontFamily: 'Nunito-ExtraBold' }]}>Edit profile</Text>
                {/* Change background button */}
                <TouchableOpacity
                  style={[
                    tw`flex-row rounded-xl items-center justify-center mb-4 bg-white p-2.5`
                  ]}
                  onPress={pickBackground} // Placeholder for background change logic
                  activeOpacity={0.7}
                >
                  <View style={tw`flex-row gap-2 items-center`}>
                    <Camera></Camera>
                    <Text style={[tw`text-black`, { fontFamily: 'Nunito-ExtraBold', fontSize: 14 }]}>Change background</Text>
                  </View>
                </TouchableOpacity>
                {/* Profile picture */}
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 100, height: 100, position: 'relative' }}>
                    <TouchableOpacity
                      style={[tw`rounded-full border-2 border-white`, { width: 100, height: 100, overflow: 'hidden', backgroundColor: '#222' }]}
                      onPress={pickAvatar}
                      activeOpacity={0.7}
                    >
                      {/* Fast loading profile image with fallback and cache busting */}
                      {avtInput ? (
                        <Image
                          source={{ uri: avtInput + (avtInput.startsWith('file') ? '' : `?cb=${user?.id || ''}`) }}
                          style={{ width: 100, height: 100 }}
                          resizeMode="cover"
                          defaultSource={require('../../assets/icons/pfpdefault.svg')}
                          onError={() => { }}
                        />
                      ) : (
                        <Image
                          source={require('../../assets/icons/pfpdefault.svg')}
                          style={{ width: 100, height: 100 }}
                          resizeMode="cover"
                        />
                      )}
                    </TouchableOpacity>
                    {/* Camera icon absolutely positioned OVER the border and image */}
                    <TouchableOpacity
                      onPress={pickAvatar}
                      activeOpacity={0.7}
                      style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'white', borderRadius: 999, width: 30, height: 30, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, zIndex: 10 }}
                    >
                      <Camera width={18} height={18} />
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Input fields */}
                <View style={{ width: '100%' }}>
                  <View style={tw`flex-row mb-2`}>
                    {/* First name */}
                    <View style={tw`flex-1`}>
                      <ImageBackground
                        source={require('../../assets/images/galaxy.jpg')}
                        imageStyle={{ borderRadius: 8, opacity: focus.firstname ? 0.3 : 0 }}
                        style={{ borderRadius: 8 }}
                      >
                        <TextInput
                          style={[
                            tw`px-4 py-2.5 text-center text-[14px]`,
                            {
                              fontFamily: 'Nunito-Medium',
                              color: input.firstname && input.firstname.trim() ? '#fff' : '#fff',
                              borderWidth: 1,
                              borderColor: focus.firstname ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                              backgroundColor: focus.firstname ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                              borderRadius: 8,
                            }
                          ]}
                          placeholder='First name'
                          value={input.firstname}
                          onChangeText={(newName) => {
                            setInput(input => ({ ...input, firstname: newName }));
                            if (firstNameError) setFirstNameError(null);
                          }}
                          placeholderTextColor={'#9CA3AF'}
                          onFocus={() => setFocus(f => ({ ...f, firstname: true }))}
                          onBlur={() => setFocus(f => ({ ...f, firstname: false }))}
                        />
                      </ImageBackground>
                      {firstNameError && (
                        <Text style={[tw`text-rose-500 text-xs mt-1 leading-1.2`, { fontFamily: 'Nunito-Medium' }]}>{firstNameError}</Text>
                      )}
                    </View>
                    {/* Last name */}
                    <View style={tw`flex-1 ml-2`}>
                      <ImageBackground
                        source={require('../../assets/images/galaxy.jpg')}
                        imageStyle={{ borderRadius: 8, opacity: focus.lastname ? 0.3 : 0 }}
                        style={{ borderRadius: 8 }}
                      >
                        <TextInput
                          style={[
                            tw`px-4 py-2.5 text-center text-[14px]`,
                            {
                              fontFamily: 'Nunito-Medium',
                              color: input.lastname && input.lastname.trim() ? '#fff' : '#fff',
                              borderWidth: 1,
                              borderColor: focus.lastname ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                              backgroundColor: focus.lastname ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                              borderRadius: 8,
                            }
                          ]}
                          placeholder='Last name'
                          value={input.lastname}
                          onChangeText={(newName) => {
                            setInput(input => ({ ...input, lastname: newName }));
                            if (lastNameError) setLastNameError(null);
                          }}
                          placeholderTextColor={'#9CA3AF'}
                          onFocus={() => setFocus(f => ({ ...f, lastname: true }))}
                          onBlur={() => setFocus(f => ({ ...f, lastname: false }))}
                        />
                      </ImageBackground>
                      {lastNameError && (
                        <Text style={[tw`text-rose-500 text-xs mt-1 leading-1.2`, { fontFamily: 'Nunito-Medium' }]}>{lastNameError}</Text>
                      )}
                    </View>
                  </View>
                  <View style={tw`mb-2`}>
                    <ImageBackground
                      source={require('../../assets/images/galaxy.jpg')}
                      imageStyle={{ borderRadius: 8, opacity: focus.username ? 0.3 : 0 }}
                      style={{ borderRadius: 8 }}
                    >
                      <TextInput
                        style={[
                          tw`px-4 py-2.5 text-center text-[14px]`,
                          {
                            fontFamily: 'Nunito-Medium',
                            color: input.username && input.username.trim() ? '#fff' : '#fff',
                            borderWidth: 1,
                            borderColor: focus.username ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                            backgroundColor: focus.username ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                            borderRadius: 8,
                          }
                        ]}
                        placeholder='Username'
                        value={input.username}
                        onChangeText={(newName) => {
                          setInput(input => ({ ...input, username: newName }));
                          if (usernameError) setUsernameError(null);
                        }}
                        placeholderTextColor={'#9CA3AF'}
                        onFocus={() => setFocus(f => ({ ...f, username: true }))}
                        onBlur={() => setFocus(f => ({ ...f, username: false }))}
                      />
                    </ImageBackground>
                    {usernameError && (
                      <Text style={[tw`text-rose-500 text-xs mt-1 leading-1.2`, { fontFamily: 'Nunito-Medium' }]}>{usernameError}</Text>
                    )}
                  </View>
                  
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setDOBOpen(true)}
                    style={tw`mb-2`}
                    accessibilityRole="button"
                    accessibilityLabel="Add your birthday"
                  >
                    <ImageBackground
                      source={require('../../assets/images/galaxy.jpg')}
                      imageStyle={{ borderRadius: 8, opacity: focus.birthdate ? 0.3 : 0 }}
                      style={{ borderRadius: 8 }}
                    >
                      <TextInput
                        style={[
                          tw`px-4 py-2.5 text-center text-[14px]`,
                          {
                            fontFamily: 'Nunito-Medium',
                            color: dobAvail && dob ? '#fff' : '#fff',
                            borderWidth: 1,
                            borderColor: focus.birthdate ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                            backgroundColor: focus.birthdate ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                            borderRadius: 8,
                          }
                        ]}
                        placeholder='Add your birthday (optional)'
                        value={dobAvail ? formatDate(dob) : ''}
                        editable={false}
                        pointerEvents="none"
                        placeholderTextColor={'#9CA3AF'}
                        onFocus={() => setFocus(f => ({ ...f, birthdate: true }))}
                        onBlur={() => setFocus(f => ({ ...f, birthdate: false }))}
                      />
                    </ImageBackground>
                  </TouchableOpacity>

                  <View style={tw`mb-1`}>
                    <ImageBackground
                      source={require('../../assets/images/galaxy.jpg')}
                      imageStyle={{ borderRadius: 8, opacity: focus.bio ? 0.3 : 0 }}
                      style={{ borderRadius: 8 }}
                    >
                      <TextInput
                        style={[
                          tw`px-4 py-2.5 text-[14px]`,
                          {
                            fontFamily: 'Nunito-Medium',
                            color: input.bio && input.bio.trim() ? '#fff' : '#fff',
                            borderWidth: 1,
                            borderColor: focus.bio ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                            backgroundColor: focus.bio ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                            borderRadius: 8,
                            textAlignVertical: 'center',
                            minHeight: 40,
                          },
                        ]}
                        placeholder='Add a bio (optional)'
                        value={input.bio}
                        maxLength={100}
                        onChangeText={(newInp) => setInput(input => ({ ...input, bio: newInp }))}
                        placeholderTextColor={'#9CA3AF'}
                        onFocus={() => setFocus(f => ({ ...f, bio: true }))}
                        onBlur={() => setFocus(f => ({ ...f, bio: false }))}
                        multiline={false}
                        scrollEnabled={true}
                        textAlign="center"
                      />
                    </ImageBackground>
                    <View style={{ alignItems: 'flex-end', marginRight: 4, marginTop: 4 }}>
                      <Text
                        style={[
                          tw`${(input.bio?.length || 0) === 100 ? 'text-rose-600' : 'text-gray-400'} text-[10px]`,
                          { fontFamily: 'Nunito-Medium' }
                        ]}
                      >
                        {(input.bio?.length || 0)}/100
                      </Text>
                    </View>
                  </View>

                  <Text style={[tw`text-white mb-2.5`, { fontFamily: 'Nunito-ExtraBold', fontSize: 15 }]}>
                    Your social media (optional)
                  </Text>
                  <View style={{ gap: 8, marginBottom: 16 }}>
                    {/* Instagram */}
                    <ImageBackground
                      source={require('../../assets/images/galaxy.jpg')}
                      imageStyle={{ borderRadius: 8, opacity: focus.instagramurl ? 0.3 : 0 }}
                      style={{ borderRadius: 8, marginBottom: 0 }}
                    >
                      <View
                        style={[
                          tw`flex-row items-center bg-white/5 rounded-lg`,
                          {
                            borderWidth: 1,
                            borderColor: focus.instagramurl ? '#fff' : 'rgba(255,255,255,0.1)',
                            height: 48,
                            paddingHorizontal: 12,
                            alignItems: 'center',
                          },
                        ]}
                      >
                        <InstagramIcon width={22} height={22} style={{ marginRight: 8, zIndex: 1 }} />
                        <TextInput
                          style={[
                            tw`flex-1 text-left px-2 text-[14px]`,
                            {
                              fontFamily: 'Nunito-Medium',
                              color: input.instagramurl && input.instagramurl.trim() ? '#fff' : '#fff',
                              backgroundColor: 'transparent',
                              borderWidth: 0,
                              height: 40,
                              textAlignVertical: 'center',
                              paddingVertical: 0,
                              zIndex: 1,
                            },
                          ]}
                          placeholder="username"
                          value={input.instagramurl}
                          onChangeText={(newInp) => setInput(input => ({ ...input, instagramurl: newInp }))}
                          placeholderTextColor="#9CA3AF"
                          onFocus={() => setFocus(f => ({ ...f, instagramurl: true }))}
                          onBlur={() => setFocus(f => ({ ...f, instagramurl: false }))}
                        />
                      </View>
                    </ImageBackground>
                    {/* X (Twitter) */}
                    <ImageBackground
                      source={require('../../assets/images/galaxy.jpg')}
                      imageStyle={{ borderRadius: 8, opacity: focus.xurl ? 0.3 : 0 }}
                      style={{ borderRadius: 8, marginBottom: 0 }}
                    >
                      <View
                        style={[
                          tw`flex-row items-center bg-white/5 rounded-lg`,
                          {
                            borderWidth: 1,
                            borderColor: focus.xurl ? '#fff' : 'rgba(255,255,255,0.1)',
                            height: 48,
                            paddingHorizontal: 12,
                            alignItems: 'center',
                          },
                        ]}
                      >
                        <XIcon width={22} height={22} style={{ marginRight: 8, zIndex: 1 }} />
                        <TextInput
                          style={[
                            tw`flex-1 text-left px-2 text-[14px]`,
                            {
                              fontFamily: 'Nunito-Medium',
                              color: input.xurl && input.xurl.trim() ? '#fff' : '#fff',
                              backgroundColor: 'transparent',
                              borderWidth: 0,
                              height: 40,
                              textAlignVertical: 'center',
                              paddingVertical: 0,
                              zIndex: 1,
                            },
                          ]}
                          placeholder="username"
                          value={input.xurl}
                          onChangeText={(newInp) => setInput(input => ({ ...input, xurl: newInp }))}
                          placeholderTextColor="#9CA3AF"
                          onFocus={() => setFocus(f => ({ ...f, xurl: true }))}
                          onBlur={() => setFocus(f => ({ ...f, xurl: false }))}
                        />
                      </View>
                    </ImageBackground>
                    {/* Snapchat */}
                    <ImageBackground
                      source={require('../../assets/images/galaxy.jpg')}
                      imageStyle={{ borderRadius: 8, opacity: focus.snapchaturl ? 0.3 : 0 }}
                      style={{ borderRadius: 8, marginBottom: 0 }}
                    >
                      <View
                        style={[
                          tw`flex-row items-center bg-white/5 rounded-lg`,
                          {
                            borderWidth: 1,
                            borderColor: focus.snapchaturl ? '#fff' : 'rgba(255,255,255,0.1)',
                            height: 48,
                            paddingHorizontal: 12,
                            alignItems: 'center',
                          },
                        ]}
                      >
                        <SnapchatIcon width={22} height={22} style={{ marginRight: 8, zIndex: 1 }} />
                        <TextInput
                          style={[
                            tw`flex-1 text-left px-2 text-[14px]`,
                            {
                              fontFamily: 'Nunito-Medium',
                              color: input.snapchaturl && input.snapchaturl.trim() ? '#fff' : '#fff',
                              backgroundColor: 'transparent',
                              borderWidth: 0,
                              height: 40,
                              textAlignVertical: 'center',
                              paddingVertical: 0,
                              zIndex: 1,
                            },
                          ]}
                          placeholder="username"
                          value={input.snapchaturl}
                          onChangeText={(newInp) => setInput(input => ({ ...input, snapchaturl: newInp }))}
                          placeholderTextColor="#9CA3AF"
                          onFocus={() => setFocus(f => ({ ...f, snapchaturl: true }))}
                          onBlur={() => setFocus(f => ({ ...f, snapchaturl: false }))}
                        />
                      </View>
                    </ImageBackground>
                    {/* Facebook */}
                    <ImageBackground
                      source={require('../../assets/images/galaxy.jpg')}
                      imageStyle={{ borderRadius: 8, opacity: focus.facebookurl ? 0.3 : 0 }}
                      style={{ borderRadius: 8, marginBottom: 0 }}
                    >
                      <View
                        style={[
                          tw`flex-row items-center bg-white/5 rounded-lg`,
                          {
                            borderWidth: 1,
                            borderColor: focus.facebookurl ? '#fff' : 'rgba(255,255,255,0.1)',
                            height: 48,
                            paddingHorizontal: 12,
                            alignItems: 'center',
                          },
                        ]}
                      >
                        <FBIcon width={22} height={22} style={{ marginRight: 8, zIndex: 1 }} />
                        <TextInput
                          style={[
                            tw`flex-1 text-left px-2 text-[14px]`,
                            {
                              fontFamily: 'Nunito-Medium',
                              color: input.facebookurl && input.facebookurl.trim() ? '#fff' : '#fff',
                              backgroundColor: 'transparent',
                              borderWidth: 0,
                              height: 40,
                              textAlignVertical: 'center',
                              paddingVertical: 0,
                              zIndex: 1,
                            },
                          ]}
                          placeholder="username"
                          value={input.facebookurl}
                          onChangeText={(newInp) => setInput(input => ({ ...input, facebookurl: newInp }))}
                          placeholderTextColor="#9CA3AF"
                          onFocus={() => setFocus(f => ({ ...f, facebookurl: true }))}
                          onBlur={() => setFocus(f => ({ ...f, facebookurl: false }))}
                        />
                      </View>
                    </ImageBackground>
                  </View>
                  {/* Save/Not now buttons moved below */}
                </View>
              </View>
              <View style={{ paddingHorizontal: '5%' }}>
                <TouchableOpacity
                  style={[
                    tw`bg-white rounded-full py-[10] w-full items-center`,
                    !(input.firstname && input.firstname.trim() && input.lastname && input.lastname.trim() && input.username && input.username.trim()) && tw`opacity-50`
                  ]}
                  onPress={handleSave}
                  activeOpacity={input.firstname && input.firstname.trim() && input.lastname && input.lastname.trim() && input.username && input.username.trim() ? 0.85 : 1}
                  disabled={!(input.firstname && input.firstname.trim() && input.lastname && input.lastname.trim() && input.username && input.username.trim())}
                >
                  <Text style={[tw`text-black text-[15px]`, { fontFamily: 'Nunito-ExtraBold', opacity: input.firstname && input.firstname.trim() && input.lastname && input.lastname.trim() && input.username && input.username.trim() ? 1 : 0.5 }]}>Save changes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`flex-row items-center justify-center mt-4`}
                  onPress={() => router.replace({ pathname: '/(profile)/profile', params: { user_id: user?.id } })}
                >
                  <Text style={[tw`text-gray-400 text-[13px]`, { fontFamily: 'Nunito-Medium' }]}>Not now</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            {/* Success Toast Modal */}
            {showSuccess && (
              <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999,
              }}
              pointerEvents="none"
              >
              <View style={[tw`px-6 py-2 rounded-full shadow-lg`, { backgroundColor: bggreenmodal, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Profile updated successfully 🥳</Text>
              </View>
              </View>
            )}
            {/* Overlay for date picker (iOS & Android) */}
            {dobOpen && (
              <View style={tw`w-full h-full flex-col-reverse absolute top-0 left-0 bg-black bg-opacity-60 z-[99]`} pointerEvents="box-none">
                <TouchableWithoutFeedback
                  onPress={() => {
                    Keyboard.dismiss();
                    setDOBOpen(false);
                  }}
                  accessible={false}
                >
                  <View style={tw`w-full h-full`} />
                </TouchableWithoutFeedback>
                {/* Animated Date Picker Modal */}
                <AnimatedDatePickerModal
                  visible={dobOpen}
                  onCancel={() => {
                    setDOBInput(dob);
                    setDOBOpen(false);
                  }}
                  onSave={async (date) => {
                    setDOB(date);
                    setDOBAvail(true);
                    setDOBOpen(false);
                    // Update birthdate in database immediately
                    try {
                      const userID = user?.user_id || user?.id;
                      if (!userID) throw new Error('User ID not found');
                      const birthdate = date instanceof Date && !isNaN(date.getTime())
                        ? date.toISOString().split('T')[0]
                        : null;
                      if (birthdate) {
                        await supabase
                          .from('users')
                          .update({ birthdate })
                          .eq('id', userID);
                        setUser({ ...user, birthdate });
                      }
                    } catch (err) {
                      // Optionally show error
                      Alert.alert('Error', 'Failed to update birthdate.');
                    }
                  }}
                  initialDate={dob}
                  onDateChange={setDOBInput}
                  textColor="#FFFFFF"
                  maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 15))}
                  minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 100))}
                />
              </View>
            )}
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback >
      </ProfileBackgroundWrapper>
    </>
  );
}

// AnimatedDatePickerModal: wrapper for CustomDatePicker with slide-up animation and overlay fade
const AnimatedDatePickerModal = ({
  visible,
  onCancel,
  onSave,
  initialDate,
  onDateChange,
  textColor,
  maximumDate,
  minimumDate
}: {
  visible: boolean;
  onCancel: () => void;
  onSave: (date: Date) => void;
  initialDate: Date;
  onDateChange: (date: Date) => void;
  textColor?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}) => {
  const modalHeight = 370;
  const slideAnim = useRef(new Animated.Value(1)).current; // always start hidden
  const overlayAnim = useRef(new Animated.Value(0)).current; // overlay opacity
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => setShouldRender(false));
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <Animated.View style={[tw`w-full h-full flex-col-reverse absolute top-0 left-0 z-[99]`, { opacity: overlayAnim }]} pointerEvents={visible ? 'auto' : 'none'}>
      <TouchableWithoutFeedback
        onPress={onCancel}
        accessible={false}
      >
        <View style={tw`w-full h-full`} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          tw`w-full flex-col absolute left-0`,
          {
            bottom: 0,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, modalHeight],
                }),
              },
            ],
            zIndex: 100,
          },
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableWithoutFeedback onPress={() => { }}>
          <View>
            <CustomDatePicker
              initialDate={initialDate}
              onDateChange={onDateChange}
              onCancel={onCancel}
              onSave={onSave}
              textColor={textColor}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
            />
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Animated.View>
  );
};
