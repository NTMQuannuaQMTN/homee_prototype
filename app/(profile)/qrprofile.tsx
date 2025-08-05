import { supabase } from '@/utils/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import tw from 'twrnc';
import BackIcon from '../../assets/icons/back.svg';
import DownloadIcon from '../../assets/icons/download-icon.svg';
import { useUserStore } from '../store/userStore';
import ProfileBackgroundWrapper from './background_wrapper';

const tabInactive = 'rgba(255,255,255,0.05)';
const tabActive = '#7A5CFA';
const tabTextActive = '#fff';
const tabTextInactive = '#fff';
const bgpopup = '#080B32';
const bggreenmodal = '#22C55E';

// This page expects to be used as a route, so get params from router
import { useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

const QRProfile: React.FC = () => {
  const { username, userId } = useLocalSearchParams<{ username?: string; userId?: string }>();
  const [tab, setTab] = useState<'qr' | 'scan'>('qr');
  const router = useRouter();
  const { user } = useUserStore();
  const qrRef = useRef<any>(null);
  const cardRef = useRef<any>(null);
  const [saving, setSaving] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showQrErrorModal, setShowQrErrorModal] = useState(false);
  const [qrErrorTitle, setQrErrorTitle] = useState('');
  const [qrErrorMessage, setQrErrorMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Camera related states
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    // Camera permissions are handled by useCameraPermissions hook
    if (tab === 'scan' && !permission?.granted) {
      requestPermission();
    }
  }, [tab, permission, requestPermission]);

  const handleSaveQr = async () => {
    if (!cardRef.current) {
      Alert.alert('Error', 'QR card not ready.');
      return;
    }
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photos to save the QR card.');
        setSaving(false);
        return;
      }
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
      });
      await MediaLibrary.saveToLibraryAsync(uri);
      setShowSavedModal(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      Alert.alert('Error', 'Could not save QR card.');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowSavedModal(false));
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);

    // Only allow scanning Sizzl profile QR codes
    const sizzlProfileRegex = /^https?:\/\/(www\.)?sizzl\.app\/profile\/[\w-]+$/i;
    if (sizzlProfileRegex.test(data)) {
      const profileIdentifier = data.split('sizzl.app/profile/')[1];
      try {
        // Check if the identifier is a username or user ID
        let userId = profileIdentifier;
        // If it's not a UUID format, assume it's a username and look up the user ID
        if (!profileIdentifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // It's a username, look up the user ID from the database
          const { data: userData, error } = await supabase
            .from('users')
            .select('id')
            .eq('username', profileIdentifier)
            .single();
          if (error || !userData) {
            setQrErrorTitle('Profile Not Found');
            setQrErrorMessage(`Could not find user with username: ${profileIdentifier}`);
            setShowQrErrorModal(true);
            setScanned(false);
            return;
          }
          userId = userData.id;
        }
        // Navigate directly to the profile using the user ID
        router.replace({ 
          pathname: '/(profile)/profile', 
          params: { user_id: userId } 
        });
      } catch (error) {
        console.error('Error processing QR code:', error);
        setQrErrorTitle('Error');
        setQrErrorMessage('Could not process the QR code. Please try again.');
        setShowQrErrorModal(true);
        setScanned(false);
      }
    } else {
      setQrErrorTitle('Invalid QR Code 😢');
      setQrErrorMessage('This QR code is not a valid Sizzl profile link. Scan a valid one to connect!');
      setShowQrErrorModal(true);
      setScanned(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setShowQrErrorModal(false);
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <LinearGradient
        colors={['#080B32', '#0E1241', '#291C56', '#392465', '#51286A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <View style={[tw`flex-1 items-center justify-center`]}>
          <Text style={[tw`text-white text-lg`, { fontFamily: 'Nunito-Medium' }]}>Loading camera...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient
        colors={['#080B32', '#0E1241', '#291C56', '#392465', '#51286A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <View style={[tw`flex-1 items-center justify-center px-8`]}>
          <Text style={[tw`text-white text-lg text-center mb-4`, { fontFamily: 'Nunito-Bold' }]}>Camera access denied</Text>
          <Text style={[tw`text-white text-center mb-6`, { fontFamily: 'Nunito-Medium' }]}>Please enable camera permission in your device settings to scan QR codes.</Text>
          <TouchableOpacity
            style={[tw`bg-white/10 border border-white/20 rounded-xl px-6 py-3`]}
            onPress={requestPermission}
          >
            <Text style={[tw`text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#080B32', '#0E1241', '#291C56', '#392465', '#51286A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={[tw`flex-1 items-center pt-13 justify-start`]}> 
        {/* Customizable QR Error Modal (always rendered at root) */}
        {showQrErrorModal && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 101,
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={resetScanner}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <TouchableOpacity
              activeOpacity={1}
              style={{ backgroundColor: '#222', borderRadius: 16, padding: 24, alignItems: 'center', maxWidth: 320, width: '80%' }}
              onPress={e => e.stopPropagation()}
            >
              <Text style={[tw`text-white text-[16px] mb-2`, { fontFamily: 'Nunito-ExtraBold', textAlign: 'center' }]}>{qrErrorTitle}</Text>
              <Text style={[tw`text-white mb-4`, { fontFamily: 'Nunito-Medium', textAlign: 'center', fontSize: 14 }]}>{qrErrorMessage}</Text>
              <TouchableOpacity
                style={[tw`flex-row items-center justify-center bg-white/10 border border-white/20 rounded-xl px-6 py-1.5`]}
                onPress={resetScanner}
              >
                <Text style={[tw`text-white`, { fontFamily: 'Nunito-ExtraBold', fontSize: 13 }]}>OK</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Back button */}
        <View style={tw`w-full flex-row items-center mb-2 px-3`}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={tw`p-2 mr-2`}
            accessibilityLabel="Back to profile"
          >
            <BackIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Sizzl QR</Text>
        </View>

        {/* Tabs */}
        <View style={[tw`flex-row w-full mt-2 mb-6 px-8`, { gap: 8 }]}> 
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={[
                tw`rounded-xl items-center justify-center`,
                { backgroundColor: tab === 'qr' ? tabActive : tabInactive, height: 36 },
              ]}
              onPress={() => setTab('qr')}
            >
              <Text style={{ color: tab === 'qr' ? tabTextActive : tabTextInactive, fontFamily: 'Nunito-ExtraBold', fontSize: 14 }}>My code</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={[
                tw`rounded-xl items-center justify-center`,
                { backgroundColor: tab === 'scan' ? tabActive : tabInactive, height: 36 },
              ]}
              onPress={() => setTab('scan')}
            >
              <Text style={{ color: tab === 'scan' ? tabTextActive : tabTextInactive, fontFamily: 'Nunito-ExtraBold', fontSize: 14 }}>Scan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab content */}
        {tab === 'qr' && (
          <>
            <View ref={cardRef} collapsable={false} style={{ width: '100%', alignItems: 'center', marginTop: 20, minHeight: 500 }}>
              <ProfileBackgroundWrapper imageUrl={user?.background_url} borderRadius={14}>
                <View style={[tw`flex-1 justify-center items-center p-10`, { backgroundColor: user?.background_url ? '' : bgpopup }]}> 
                  <Text style={[tw`text-white text-[15px] mb-8`, { fontFamily: 'Nunito-ExtraBold', textAlign: 'center' }]}>Add me on Sizzl 🔥</Text>
                  <QRCode
                    value={`https://sizzl.app/profile/${username || userId}`}
                    size={240}
                    color="#fff"
                    backgroundColor="transparent"
                    getRef={c => { qrRef.current = c; }}
                  />
                  <Text style={[tw`text-white mt-8`, { fontFamily: 'Nunito-Bold', fontSize: 13, textAlign: 'center' }]}>@{username}</Text>
                </View>
              </ProfileBackgroundWrapper>
            </View>
            <TouchableOpacity
              style={[tw`mt-8 flex-row items-center bg-white/5 border border-white/10 rounded-xl py-2 px-4`]}
              onPress={handleSaveQr}
              disabled={saving}
            >
              <DownloadIcon width={20} height={20} style={{ marginRight: 6 }} />
              <Text style={[tw`text-white`, { fontFamily: 'Nunito-ExtraBold', fontSize: 13 }]}>Save your QR Card</Text>
            </TouchableOpacity>

            {/* Custom Saved Modal */}
            {showSavedModal && (
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 100,
                  opacity: fadeAnim,
                }}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={closeModal}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <TouchableOpacity
                  activeOpacity={1}
                  style={{ backgroundColor: bggreenmodal, borderRadius: 16, padding: 24, alignItems: 'center', maxWidth: 320, width: '80%' }}
                  onPress={e => e.stopPropagation()}
                >
                  <Text style={[tw`text-white text-[16px] mb-2`, { fontFamily: 'Nunito-ExtraBold', textAlign: 'center' }]}>Your QR Card is saved 🥳</Text>
                  <Text style={[tw`text-white mb-4`, { fontFamily: 'Nunito-Medium', textAlign: 'center', fontSize: 14 }]}>You can now find your QR card in your Photos/Gallery. Share it with friends to connect on Sizzl! 🎉</Text>
                  <TouchableOpacity
                    style={[tw`flex-row items-center justify-center bg-white/10 border border-white/20 rounded-xl px-6 py-2`]}
                    onPress={closeModal}
                  >
                    <Text style={[tw`text-white`, { fontFamily: 'Nunito-ExtraBold', fontSize: 14 }]}>Got it</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            )}
          </>
        )}
        {tab === 'scan' && (
          <View style={[tw`flex-1 w-full items-center`, { marginTop: 24 }]}> 
            <Text style={[tw`text-white text-[15px] mb-3`, { fontFamily: 'Nunito-ExtraBold', textAlign: 'center' }]}>Scan QR Code 📷</Text>
            <Text style={[tw`text-white text-[13px] mb-6 px-10 leading-[1.25]`, { fontFamily: 'Nunito-Medium', textAlign: 'center' }]}>Point your camera at your friend's QR Card to connect with them 🤝</Text>
            
            <View style={[styles.cameraContainer]}>
              <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
              >
                <View style={styles.overlay}>
                  <View style={styles.unfocusedContainer}></View>
                  <View style={styles.middleContainer}>
                    <View style={styles.unfocusedContainer}></View>
                    <View style={styles.focusedContainer}>
                      <View style={[styles.corner, styles.topLeft]} />
                      <View style={[styles.corner, styles.topRight]} />
                      <View style={[styles.corner, styles.bottomLeft]} />
                      <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                    <View style={styles.unfocusedContainer}></View>
                  </View>
                  <View style={styles.unfocusedContainer}></View>
                </View>
              </CameraView>
            </View>

            {scanned && (
              <TouchableOpacity
                style={[tw`mt-8 bg-white/10 border border-white/20 rounded-xl px-6 py-2`]}
                onPress={resetScanner}
              >
                <Text style={[tw`text-white`, { fontFamily: 'Nunito-ExtraBold', fontSize: 14 }]}>Scan again</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  cameraContainer: {
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    borderRadius: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  unfocusedContainer: {
    flex: 0.5,
    // backgroundColor: 'rgba(0,0,0,0.7)',
  },
  middleContainer: {
    flexDirection: 'row',
    flex: 10,
    borderRadius: 16,
  },
  focusedContainer: {
    flex: 10,
    position: 'relative',
    borderRadius: 20,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#7A5CFA',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
});

export default QRProfile;