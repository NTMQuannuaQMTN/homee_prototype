

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ImageBackground, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from 'expo-router';
import { supabase } from '../../utils/supabase';
import GradientBackground from '../components/GradientBackground';
import tw from 'twrnc';
import Ionicons from 'react-native-vector-icons/Ionicons';

import BackIcon from '../../assets/icons/back.svg';



const ErrorModal = ({ visible, title, message, onClose }: { visible: boolean, title: string, message: string, onClose: () => void }) => {
  if (!visible) return null;
  return (
    <View style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    }}>
      <TouchableOpacity
        activeOpacity={1}
        style={{ backgroundColor: '#222', borderRadius: 16, padding: 24, alignItems: 'center', maxWidth: 320, width: '80%' }}
        onPress={e => e.stopPropagation && e.stopPropagation()}
      >
        <Text style={[tw`text-white text-[17px] mb-2`, { fontFamily: 'Nunito-ExtraBold', textAlign: 'center' }]}>{title}</Text>
        <Text style={[tw`text-white mb-4`, { fontFamily: 'Nunito-Medium', textAlign: 'center', fontSize: 15 }]}>{message}</Text>
        <TouchableOpacity
          style={[tw`flex-row items-center justify-center bg-white/10 border border-white/20 rounded-xl px-6 py-1.5`]}
          onPress={onClose}
        >
          <Text style={[tw`text-white`, { fontFamily: 'Nunito-ExtraBold', fontSize: 16 }]}>OK</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const SuccessModal = ({ visible, title, message, onClose }: { visible: boolean, title: string, message: string, onClose: () => void }) => {
  if (!visible) return null;
  return (
    <View style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    }}>
      <TouchableOpacity
        activeOpacity={1}
        style={{ backgroundColor: tw.color('green-500'), borderRadius: 16, padding: 18, alignItems: 'center', maxWidth: 320, width: '80%' }}
        onPress={e => e.stopPropagation && e.stopPropagation()}
      >
        <ExpoImage
          source={require('../../assets/gifs/happycat.gif')}
          style={{ width: 100, height: 100, marginBottom: 12, borderRadius: 12 }}
          contentFit="cover"
        />
        <Text style={[tw`text-white text-[17px] mb-2`, { fontFamily: 'Nunito-ExtraBold', textAlign: 'center' }]}>{title}</Text>
        <Text style={[tw`text-white mb-4`, { fontFamily: 'Nunito-Medium', textAlign: 'center', fontSize: 15 }]}>{message}</Text>
        <TouchableOpacity
          style={[tw`flex-row items-center justify-center bg-white/10 border border-white/20 rounded-xl px-6 py-1.5`]}
          onPress={onClose}
        >
          <Text style={[tw`text-white`, { fontFamily: 'Nunito-ExtraBold', fontSize: 16 }]}>OK</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const ChangePassword = () => {
  const navigation = useNavigation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFocusedOld, setIsFocusedOld] = useState(false);
  const [isFocusedNew, setIsFocusedNew] = useState(false);
  const [isFocusedConfirm, setIsFocusedConfirm] = useState(false);
  // Password rule state
  const [passRule, setPassRule] = useState([false, false, false, false]);
  const [valid, setValid] = useState(true);
  // Error modal state
  const [errorModal, setErrorModal] = useState<{ visible: boolean, title: string, message: string }>({ visible: false, title: '', message: '' });
  // Success modal state
  const [successModal, setSuccessModal] = useState<{ visible: boolean, title: string, message: string }>({ visible: false, title: '', message: '' });

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorModal({ visible: true, title: 'Missing fields', message: 'Please fill in all fields.' });
      return;
    }
    if (passRule.indexOf(false) >= 0) {
      setValid(false);
      setErrorModal({ visible: true, title: 'Password requirements', message: "New password doesn't meet requirements." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorModal({ visible: true, title: 'Password mismatch', message: 'New passwords do not match.' });
      return;
    }
    setLoading(true);
    try {
      // Get current user email
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const email = userData.user?.email;
      if (!email) {
        setErrorModal({ visible: true, title: 'Error', message: 'Unable to get user email.' });
        setLoading(false);
        return;
      }
      // Re-authenticate user by signing in with old password
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: oldPassword,
      });
      if (signInError || !user) {
        setErrorModal({ visible: true, title: 'Old password incorrect', message: 'The old password you entered is incorrect. Please try again.' });
        setLoading(false);
        return;
      }
      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setErrorModal({ visible: true, title: 'Error', message: error.message });
      } else {
        setSuccessModal({ visible: true, title: 'Password changed!', message: 'Your password was changed successfully.' });
      }
    } catch (e) {
      setErrorModal({ visible: true, title: 'Error', message: 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>
        {/* Error Modal Overlay */}
        <ErrorModal
          visible={errorModal.visible}
          title={errorModal.title}
          message={errorModal.message}
          onClose={() => setErrorModal({ ...errorModal, visible: false })}
        />
        {/* Success Modal Overlay */}
        <SuccessModal
          visible={successModal.visible}
          title={successModal.title}
          message={successModal.message}
          onClose={() => {
            setSuccessModal({ ...successModal, visible: false });
            navigation.goBack();
          }}
        />
        <GradientBackground style={{ flex: 1 }}>
          {/* Top bar copied from settings.tsx */}
          <View style={tw`flex-row items-center px-4 pt-14 pb-4 w-full`}>
            <TouchableOpacity
              style={tw`mr-2`}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
            >
              <BackIcon width={24} height={24} />
            </TouchableOpacity>
            <View style={tw`flex-1 items-center`}>
              <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Change password</Text>
            </View>
            {/* Empty view for spacing on right */}
            <View style={tw`w-7`} />
          </View>
          <View style={tw`mx-4`}>
            <Text style={[tw`text-white mb-2 text-[16px]`, { fontFamily: 'Nunito-Bold' }]}>Old password</Text>
            <ImageBackground
              source={require('../../assets/images/galaxy.jpg')}
              imageStyle={{ borderRadius: 8, opacity: isFocusedOld ? 0.3 : 0 }}
              style={tw`w-full rounded-[2] mb-4`}
            >
              <View style={tw`flex-row items-center`}>
                <TextInput
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="Enter old password"
                  placeholderTextColor={'#9CA3AF'}
                  secureTextEntry={!showOldPassword}
                  style={[
                    tw`flex-1 px-3 py-3 text-white text-[15px]`,
                    {
                      fontFamily: 'Nunito-Medium',
                      borderWidth: 1,
                      borderColor: isFocusedOld ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                      backgroundColor: isFocusedOld ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                      borderRadius: 8,
                    }
                  ]}
                  onFocus={() => setIsFocusedOld(true)}
                  onBlur={() => setIsFocusedOld(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowOldPassword((prev) => !prev)}
                  style={tw`absolute right-0 px-3 py-3`}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showOldPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
            </ImageBackground>

            <Text style={[tw`text-white mb-2 text-[16px]`, { fontFamily: 'Nunito-Bold' }]}>New password</Text>

            <ImageBackground
              source={require('../../assets/images/galaxy.jpg')}
              imageStyle={{ borderRadius: 8, opacity: isFocusedNew ? 0.3 : 0 }}
              style={tw`w-full rounded-[2] mb-4`}
            >
              <View style={tw`flex-row items-center`}>
                <TextInput
                  value={newPassword}
                  onChangeText={(val) => {
                    setNewPassword(val);
                    setValid(true);
                    setPassRule([
                      /[A-Z]/.test(val),      // At least one uppercase letter
                      /[a-z]/.test(val),      // At least one lowercase letter
                      /[0-9]/.test(val),      // At least one number
                      val.length >= 6         // At least 6 characters
                    ]);
                  }}
                  placeholder="Enter new password"
                  placeholderTextColor={'#9CA3AF'}
                  secureTextEntry={!showNewPassword}
                  style={[
                    tw`flex-1 px-3 py-3 text-white text-[15px]`,
                    {
                      fontFamily: 'Nunito-Medium',
                      borderWidth: 1,
                      borderColor: isFocusedNew ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                      backgroundColor: isFocusedNew ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                      borderRadius: 8,
                    }
                  ]}
                  onFocus={() => setIsFocusedNew(true)}
                  onBlur={() => setIsFocusedNew(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword((prev) => !prev)}
                  style={tw`absolute right-0 px-3 py-3`}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
            </ImageBackground>

            {/* Password rules UI */}
            {isFocusedNew && (
              <View style={tw`w-full mb-2.5`}>
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

            {/* Error message for password rules disabled as passRule UI is sufficient */}

            <Text style={[tw`text-white mb-2 text-[16px]`, { fontFamily: 'Nunito-Bold' }]}>Confirm new password</Text>
            <ImageBackground
              source={require('../../assets/images/galaxy.jpg')}
              imageStyle={{ borderRadius: 8, opacity: isFocusedConfirm ? 0.3 : 0 }}
              style={tw`w-full rounded-[2] mb-6`}
            >
              <View style={tw`flex-row items-center`}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={'#9CA3AF'}
                  secureTextEntry={!showConfirmPassword}
                  style={[
                    tw`flex-1 px-3 py-3 text-white text-[15px]`,
                    {
                      fontFamily: 'Nunito-Medium',
                      borderWidth: 1,
                      borderColor: isFocusedConfirm ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                      backgroundColor: isFocusedConfirm ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                      borderRadius: 8,
                    }
                  ]}
                  onFocus={() => setIsFocusedConfirm(true)}
                  onBlur={() => setIsFocusedConfirm(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  style={tw`absolute right-0 px-3 py-3`}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
            </ImageBackground>

            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={loading || !oldPassword || !newPassword || !confirmPassword}
              style={[
                tw`rounded-full bg-[#7A5CFA] py-3`,
                (loading || !oldPassword || !newPassword || !confirmPassword) && { opacity: 0.3 }
              ]}
            >
              <Text style={[tw`text-white text-center text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}> 
                {loading ? 'Changing...' : 'Change password'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={loading}
              style={tw`rounded-full py-3 mt-2.5 bg-white/5`}
            >
              <Text style={[tw`text-white text-center text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Not now</Text>
            </TouchableOpacity>
          </View>
        </GradientBackground>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ChangePassword;
