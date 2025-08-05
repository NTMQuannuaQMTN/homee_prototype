import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ImageBackground, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useUserStore } from '../app/store/userStore';
import CreateTab from '../assets/icons/createtab.svg';
import CreateTabActive from '../assets/icons/createtab_active.svg';
import HomeTab from '../assets/icons/hometab.svg';
import HomeTabActive from '../assets/icons/hometab_active.svg';
import DefaultAvatar from '../assets/icons/pfpdefault.svg';

export default function BotBar({ currentTab = 'home', selfView = false }: { currentTab?: 'home' | 'create' | 'profile' | 'noti', selfView?: boolean }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, setUser } = useUserStore();
  // Use the user store's profile_image immediately for fast initial load
  const [avatarUri, setAvatarUri] = useState(user?.profile_image || '');
  const [userID, setUserID] = useState('');

  // Only update avatarUri from Supabase in the background, but show local immediately
  useEffect(() => {
    let isMounted = true;
    // Show local user image immediately, then update in background
    setAvatarUri(user?.profile_image || '');
    const fetchUserProfile = async () => {
      const session = await supabase.auth.getSession();
      const email = session.data.session?.user?.email;
      if (email) {
        const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
        if (!error && data && isMounted) {
          setUser(data);
          setAvatarUri(data.profile_image || '');
          setUserID(data.id || '');
        }
      }
    };
    fetchUserProfile();
    return () => { isMounted = false; };
  }, [user?.profile_image]);

  useEffect(() => {
    setAvatarUri(user?.profile_image || '');
  }, [user]);
  return (
    <ImageBackground
      source={require('../assets/images/galaxy.jpg')}
      imageStyle={{ borderRadius: 24, opacity: 0.7 }}
      style={tw`flex-row justify-around items-center mx-4 mb-[${insets.bottom ? insets.bottom : 12}px] h-14 absolute left-0 right-0 bottom-0 shadow-lg shadow-black/15 z-10`}
    >
      <View style={tw`flex-row flex-1 items-center justify-around bg-black/60 rounded-3xl h-full`}>
        {/* Home Tab */}
        <TouchableOpacity
          onPress={() => {
            if (currentTab !== 'home') router.replace('/home/homepage');
          }}
          style={tw`flex-1 items-center justify-center`}
          disabled={currentTab === 'home'}
        >
          {currentTab === 'home' ? <HomeTabActive width={24} height={24} /> : <HomeTab width={24} height={24} />}
        </TouchableOpacity>
        {/* Center Add Button */}
        <TouchableOpacity
          onPress={() => {
            if (currentTab !== 'create') router.replace('/(create)/create');
          }}
          style={tw`flex-1 items-center justify-center`}
          disabled={currentTab === 'create'}
        >
          {currentTab === 'create' ? <CreateTabActive width={24} height={24} /> : <CreateTab width={24} height={24} />}
        </TouchableOpacity>
        {/* Profile Tab */}
        <TouchableOpacity
          onPress={() => {
            router.replace({ pathname: '/(profile)/profile', params: { user_id: userID } });
          }}
          style={tw`flex-1 items-center justify-center`}
          disabled={currentTab === 'profile' && selfView}
        >
          {avatarUri && avatarUri !== '' ? (
            <Image
              source={{ uri: avatarUri }}
              style={{
                width: 26,
                height: 26,
                borderRadius: 18,
                borderWidth: currentTab === 'profile' ? 2 : 0,
                borderColor: '#fff',
              }}
              defaultSource={require('../assets/images/pfp-default.png')}
              onError={() => setAvatarUri('')}
            />
          ) : (
            <View style={{
              width: 26,
              height: 26,
              borderRadius: 18,
              backgroundColor: '#222',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: currentTab === 'profile' ? 2 : 0,
              borderColor: '#fff',
              overflow: 'hidden',
            }}>
              <DefaultAvatar width={20} height={20} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}
