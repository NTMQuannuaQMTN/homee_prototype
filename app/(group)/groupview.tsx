import { router, useLocalSearchParams } from "expo-router";
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert, Animated } from "react-native";
import { Share as RNShare } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from "react";
import tw from "twrnc";
import { supabase } from "@/utils/supabase";
import GradientBackground from "../components/GradientBackground";
import defaultImages from "../(create)/defaultimage";
import BackIcon from '../../assets/icons/back.svg';
import EditIcon from '../../assets/icons/edit-icon.svg';
import ShareIcon from '../../assets/icons/share-icon.svg';
import ThreeDotsIcon from '../../assets/icons/threedots.svg';
import IconFun from '../../assets/icons/icon-fun.svg';
import { useUserStore } from "../store/userStore";
import AlbumCard from "../(album)/albumcard";
import DraggableModal from "../components/DraggableModal";
import { Ionicons } from '@expo/vector-icons';
import IconSad from '../../assets/icons/icon-sad.svg';

interface Group {
  id: string;
  title: string;
  bio?: string;
  creator: string;
  group_image: string;
  public: string;
  member_count: number;
  created_at?: string;
}

interface Album {
  id: string;
  title: string;
}

interface User {
  id: string;
  name: string;
  profile_image: string;
}

export default function GroupView() {
  // Custom state for delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteModalAnim] = useState(new Animated.Value(0));

  // Fade in/out effect for delete modal
  useEffect(() => {
    if (showDeleteConfirm) {
      setDeleteModalVisible(true);
      Animated.timing(deleteModalAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else if (deleteModalVisible) {
      Animated.timing(deleteModalAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setDeleteModalVisible(false));
    }
  }, [showDeleteConfirm]);
  // Only one set of state/variable declarations:
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'album' | 'details' | 'requests'>('album');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const width = Dimensions.get('screen').width;
  const { user } = useUserStore();
  const [creatorInfo, setCreatorInfo] = useState<User>({
    id: '',
    name: '',
    profile_image: '',
  });
  const [creator, setCreator] = useState<boolean>(false);
  const [reqStat, setReqStat] = useState<string>('');
  const [members, setMembers] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  // Friend status for each member (for MEMBERS section)
  const [friendStats, setFriendStats] = useState<{ [id: string]: string }>({});
  useEffect(() => {
    const fetchStatuses = async () => {
      if (!user?.id) return;
      const allMembers = [creatorInfo, ...members.filter(m => m.id !== creatorInfo.id)];
      const stats: { [id: string]: string } = {};
      for (const member of allMembers) {
        if (member.id === user?.id) continue;
        // Check friend status
        const { error: friendError } = await supabase.from('friends')
          .select('id').eq('user_id', user.id).eq('friend', member.id).single();
        if (!friendError) {
          stats[member.id] = 'friend';
          continue;
        }
        const { error: requestingError } = await supabase.from('friend_requests')
          .select('id').eq('user_id', user.id).eq('requestee', member.id).single();
        if (!requestingError) {
          stats[member.id] = 'requesting';
          continue;
        }
        const { error: requestedError } = await supabase.from('friend_requests')
          .select('id').eq('user_id', member.id).eq('requestee', user.id).single();
        if (!requestedError) {
          stats[member.id] = 'requested';
          continue;
        }
        stats[member.id] = '';
      }
      setFriendStats(stats);
    };
    fetchStatuses();
  }, [members, user?.id, creatorInfo]);

  useEffect(() => {
    // Fetch group requests if tab is 'requests' and user is creator
    const fetchRequests = async () => {
      if (!group || !creator) return;
      const { data, error } = await supabase
        .from('group_requests')
        .select('id, user_id, users(id, name, profile_image)')
        .eq('group_id', group.id);
      if (!error && data) {
        setRequests(data);
      } else {
        setRequests([]);
      }
    };
    if (tab === 'requests') fetchRequests();
  }, [tab, group, creator]);

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("groups")
        .select("id, title, bio, creator, group_image, public, member_count, created_at")
        .eq("id", id)
        .single();
      if (!error && data) {
        setGroup(data);
      }
      setLoading(false);
    };
    if (id) fetchGroup();
  }, [id]);

  useEffect(() => {
    const fetchAlbums = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("albums")
        .select("id, title")
        .eq("group", id);
      if (!error && data) {
        setAlbums(data);
      } else {
        console.log(error);
      }
    };
    fetchAlbums();
  }, [id]);

  useEffect(() => {
    const fetchCreator = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("users")
        .select("id, name, profile_image")
        .eq("id", group?.creator).single();
      if (!error && data) {
        setCreatorInfo(data);
      }
    };
    const fetchMembers = async () => {
      if (!group) return;
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id, users(id, name, profile_image)')
        .eq('group_id', group.id);
      if (!error && data) {
        // Flatten and filter valid users
        const memberList = data
          .map((m: any) => m.users)
          .filter((u: any) => u && u.id);
        setMembers(memberList);
      } else {
        setMembers([]);
      }
    };
    fetchCreator();
    fetchMembers();
  }, [group])

  useEffect(() => {
    const checkJoin = async () => {
      if (!group || !user?.id) return;
      const { data, error } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (group.public) {
          setReqStat('Nothing');
        } else {
          const { data, error } = await supabase.from('group_requests')
            .select('id')
            .eq('group_id', group.id)
            .eq('user_id', user.id).single();

          if (error) setReqStat('Nothing');
          else setReqStat('Requested');
        }
      } else setReqStat('Joined');
    }

    if (group) setCreator(group.creator === user.id);
    if (group?.creator !== user.id) {
      checkJoin();
    }
  }, [group]);

  const toggleJoin = async () => {
    if (reqStat === 'Nothing') {
      if (group?.public) {
        const { error } = await supabase.from('group_members')
          .insert({ user_id: user.id, group_id: group.id });

        if (error) {
          Alert.alert('Cannot join due to err', error.message);
        } else {
          setReqStat('Joined')
        }
      } else {
        const { error } = await supabase.from('group_requests')
          .insert({ user_id: user.id, group_id: group?.id });

        if (error) {
          Alert.alert('Cannot join due to err', error.message);
        } else {
          setReqStat('Requested');
        }
      }
    } else {
      if (reqStat === 'Requested') {
        const { error } = await supabase.from('group_requests')
          .delete()
          .eq('user_id', user.id).eq('group_id', group?.id);
        if (error) {
          Alert.alert('error removin');
        }
      } else {
        const { error } = await supabase.from('group_members')
          .delete()
          .eq('user_id', user.id).eq('group_id', group?.id);
        if (error) {
          Alert.alert('error removin');
        }
      }
      setReqStat('Nothing');
    }
  }

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-[#080B32]`}>
        {/* ActivityIndicator removed as requested */}
      </View>
    );  
  }

  if (!group) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-[#080B32]`}>
        <Text style={[tw`text-white text-lg`, { fontFamily: "Nunito-ExtraBold" }]}>
          Group not found.
        </Text>
      </View>
    );
  }

  // Default image logic: match group.tsx and imageModal.tsx
  let isDefault = false;
  let defaultImage;
  if (group.group_image === 'default') {
    // Use group id to consistently pick a default image
    let defaultIndex = 0;
    if (group.id && group.id.length > 2) {
      defaultIndex = Math.abs(Array.from(group.id).reduce((acc, c) => acc + c.charCodeAt(0), 0)) % defaultImages.length;
    } else {
      defaultIndex = Math.floor(Math.random() * defaultImages.length);
    }
    defaultImage = defaultImages[defaultIndex];
    isDefault = true;
  } else if (group.group_image && group.group_image.startsWith('default')) {
    // Try to find the matching image in defaultImages by filename
    const found = defaultImages.find(img => {
      if (typeof img === 'number') return false;
      if (img && img.uri && typeof img.uri === 'string') {
        return img.uri.includes(group.group_image);
      }
      return false;
    });
    if (found) {
      defaultImage = found;
      isDefault = true;
    } else {
      defaultImage = defaultImages[0];
      isDefault = true;
    }
  }

  return (
    <GradientBackground style={tw`flex-1`}>
      <Image
        source={{ uri: group.group_image === 'default' ? defaultImage : group.group_image }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          bottom: 0,
          height: undefined,
          minHeight: '100%',
          resizeMode: 'cover',
          zIndex: 0,
          backgroundColor: '#000000', opacity: isDefault ? 0 : 0.5,
        }}
        blurRadius={8}
        onError={e => {
          console.log('Background image failed to load:', e.nativeEvent);
        }}
      />
      <View style={tw`w-full h-full absolute top-0 left-0`}/>
      <DraggableModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        buttons={creator
          ? [{
            label: 'Delete group',
            color: 'bg-red-600',
            textColor: 'text-white',
            onPress: () => {
              setModalVisible(false);
              setTimeout(() => setShowDeleteConfirm(true), 250);
            },
          }]
          : [{
            label: 'Report group',
            color: 'bg-yellow-600',
            textColor: 'text-white',
            onPress: () => {
              setModalVisible(false);
              Alert.alert('Report group', 'Group report logic goes here.');
            },
          }]
        }
      />

      {/* Custom Delete Confirmation Modal with fade animation */}
      {deleteModalVisible && (
        <Animated.View
          style={[
            tw`bg-black/50 absolute top-0 left-0 w-full h-full justify-center items-center z-50`,
            { opacity: deleteModalAnim }
          ]}
        >
          <View style={tw`bg-[#080B32] rounded-xl p-7 w-80 items-center`}>
            <Text style={[tw`text-white text-xl mb-3`, { fontFamily: 'Nunito-Black', textAlign: 'center' }]}>Delete group?</Text>
            <Text style={[tw`text-white text-base mb-4.5 leading-[1.3]`, { fontFamily: 'Nunito-Medium', textAlign: 'center', opacity: 0.8 }]}>Your group members will no longer have access to the albums or photos of this group.</Text>
            <View style={tw`flex-row gap-3 w-full justify-center`}>
              <TouchableOpacity
                style={tw`flex-1 bg-white/10 rounded-full px-4 py-2 items-center`}
                activeOpacity={0.7}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Not now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-red-600 rounded-full px-4 py-2 items-center`}
                activeOpacity={0.7}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  // Group deletion logic
                  (async () => {
                    if (!group?.id) return;
                    // Delete group image from storage if not default
                    if (group.group_image && group.group_image !== 'default') {
                      try {
                        // Extract bucket and path from group_image URL
                        // Example: https://<project>.supabase.co/storage/v1/object/public/group_images/filename.png
                        const url = group.group_image;
                        const match = url.match(/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
                        if (match) {
                          const bucket = match[1];
                          const path = match[2];
                          await supabase.storage.from(bucket).remove([path]);
                        }
                      } catch (e) {
                        // Ignore image deletion errors
                      }
                    }
                    // Remove group from database
                    const { error } = await supabase.from('groups').delete().eq('id', group.id);
                    if (error) {
                      Alert.alert('Error', 'Failed to delete group: ' + error.message);
                    } else {
                      Alert.alert('Deleted!', 'Group has been deleted.');
                      // Navigate to group list
                      router.replace({ pathname: '/(group)/grouplist_all' });
                    }
                  })();
                }}
              >
                <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        {/* Topbar (now scrolls with content) */}
        <View style={tw`flex-row items-center justify-between px-4 pt-14`}>
          <TouchableOpacity onPress={() => router.back()} style={tw``}>
            <BackIcon width={24} height={24} />
          </TouchableOpacity>
          <View style={tw`flex-row items-center gap-x-2`}>
            {creator && (
              <TouchableOpacity onPress={() => { }} style={tw`flex-row items-center bg-white/10 rounded-full px-3 py-1.5`}>
                <EditIcon width={18} height={18} />
                <Text style={[tw`text-white ml-1.5 text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Edit</Text>
              </TouchableOpacity>
            )}
            {/* Show Invite button only if public group, or user is member, or creator */}
            { (group.public || reqStat === 'Joined' || creator) && (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    // Share group link instead of image
                    const groupUrl = `https://homee.app/group/${group.id}`;
                    const message = `Join me in "${group.title}" on Homee to share photos together!\n${groupUrl}`;
                    await RNShare.share({
                      message,
                    });
                  } catch (error) {
                    Alert.alert('Error', 'Could not open share dialog.');
                  }
                }}
                style={tw`flex-row items-center bg-white/10 rounded-full px-3 py-1.5`}
              >
                <ShareIcon width={20} height={20} />
                <Text style={[tw`text-white ml-1.5 text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Invite</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <ThreeDotsIcon width={20} height={20} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Main scrollable content */}
        <View style={tw`items-center pt-4 pb-4 px-6`}>
          <View style={{ position: 'relative', width: width - 100, height: width - 100 }}>
            {isDefault ? (
              <Image
                source={defaultImage}
                style={[tw`rounded-xl mb-4`, { width: width - 100, height: width - 100, opacity: 1 }]}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={{ uri: group.group_image }}
                style={[tw`rounded-xl mb-4`, { width: width - 100, height: width - 100, opacity: 1 }]}
                resizeMode="cover"
              />
            )}
            <View style={tw`absolute w-full h-full bg-black bg-opacity-50 top-0 left-0 rounded-xl`}/>
            {/* Top left corner: creator/join/joined button */}
            <View style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
              {creator ? (
                <LinearGradient
                  colors={["#A57C01", "#D4AF37", "#B8860B", "#996515"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[tw`rounded-full px-3 py-1.5`, { alignItems: 'center', justifyContent: 'center' }]}
                >
                  <Text style={[tw`text-white text-base`, { fontFamily: "Nunito-ExtraBold" }]}>Creator</Text>
                </LinearGradient>
              ) : (
                <TouchableOpacity onPress={toggleJoin}>
                  <Text
                    style={[tw`text-base px-3 py-1.5 rounded-full`,
                    reqStat === 'Nothing'
                      ? tw`bg-[#7A5CFA] text-white`
                      : reqStat === 'Join'
                        ? tw`bg-white text-black`
                        : tw`bg-white/20 text-white`,
                    { fontFamily: "Nunito-ExtraBold" }
                    ]}
                  >
                    {reqStat === 'Nothing' ? 'Join' : reqStat}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ position: 'absolute', top: 0, left: 0, width: width - 100, height: width - 100 }} pointerEvents="box-none">
              {/* Centered content */}
              <View style={{ width: width - 100, justifyContent: 'center', alignItems: 'flex-start', height: width - 100 }}>
                <View style={{ width: width - 100, alignItems: 'center', justifyContent: 'center', height: width - 100 }}>
                  <Text
                    style={[tw`text-white text-[24px] px-4 rounded-xl text-center max-w-[${width - 100}px] flex-wrap`, { fontFamily: "Nunito-Black" }]}
                    numberOfLines={0}
                    ellipsizeMode="tail"
                  >
                    {group.title}
                  </Text>
                  <View style={tw`flex-row mt-2`}>
                    <Text style={[tw`text-white bg-white/10 rounded-full px-2.5 py-1.5 text-[15px]`, { fontFamily: "Nunito-Medium" }]}>
                      <Text style={{ fontFamily: "Nunito-ExtraBold" }}>{albums.length}</Text> albums
                    </Text>
                    <Text style={[tw`text-white bg-white/10 rounded-full px-2.5 py-1.5 text-[15px] ml-1.5`, { fontFamily: "Nunito-Medium" }]}>
                      <Text style={{ fontFamily: "Nunito-ExtraBold" }}>0</Text> photos
                    </Text>
                  </View>
                  {/* Member profile images row */}
                  <View style={[tw`flex-row items-center`, { position: 'absolute', bottom: 16, left: -4, width: width - 100, justifyContent: 'center' }]}>
                    {(() => {
                      // Combine creator and members, remove duplicates by id
                      const allMembers = [creatorInfo, ...members.filter(m => m.id !== creatorInfo.id)];
                      return allMembers.slice(0, 4).map((member, idx) => (
                        <Image
                          key={member.id || idx}
                          source={member.profile_image ? { uri: member.profile_image } : require('../../assets/default_images/default1.png')}
                          style={[tw`w-8 h-8 rounded-full mr-[-12px] shadow-lg`]}
                        />
                      ));
                    })()}
                    {(() => {
                      const allMembers = [creatorInfo, ...members.filter(m => m.id !== creatorInfo.id)];
                      return allMembers.length > 4 ? (
                        <View style={[tw`w-8 h-8 rounded-full bg-[#080B32]/90 border-[1px] border-white/10 justify-center items-center mr-[-12px]`]}>
                          <Text style={[tw`text-white text-[12px]`, { fontFamily: "Nunito-ExtraBold" }]}>+{allMembers.length - 4}</Text>
                        </View>
                      ) : null;
                    })()}
                  </View>
                </View>
              </View>
            </View>
          </View>
          {/* Bio removed from here. Will be shown in details tab. */}
        </View>
        {/* Tabs for Album and Details */}
        <View style={tw`flex-row justify-center mb-4 gap-2 px-6`}>
          <TouchableOpacity
            style={[
              tw`flex-1 py-2 rounded-full items-center`,
              tab === 'album' ? tw`bg-[#7A5CFA]` : tw``
            ]}
            onPress={() => setTab('album')}
          >
            <Text style={[
              tw`text-[16px]`,
              { fontFamily: "Nunito-ExtraBold", color: tab === 'album' ? '#fff' : '#9ca3af' }
            ]}>
              Album
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              tw`flex-1 py-2 rounded-full items-center`,
              tab === 'details' ? tw`bg-[#7A5CFA]` : tw``
            ]}
            onPress={() => setTab('details')}
          >
            <Text style={[
              tw`text-[16px]`,
              { fontFamily: "Nunito-ExtraBold", color: tab === 'details' ? '#fff' : '#9ca3af' }
            ]}>
              Details
            </Text>
          </TouchableOpacity>
          {creator && !group.public && <TouchableOpacity
            style={[
              tw`flex-1 py-2 rounded-full items-center`,
              tab === 'requests' ? tw`bg-[#7A5CFA]` : tw``
            ]}
            onPress={() => setTab('requests')}
          >
            <Text style={[tw`text-base flex-row items-center`, { fontFamily: "Nunito-ExtraBold", color: tab === 'requests' ? '#fff' : '#9ca3af' }]}>
              Requests
              {requests.length > 0 && (
                <Ionicons name="ellipse" size={10} color="#E11D48" style={{ marginLeft: 4, marginTop: 1 }} />
              )}
            </Text>
          </TouchableOpacity>}
        </View>
        <View style={tw`px-6 pb-10`}>
          {tab === 'album' ? (
            // If group is private and user is not a member or creator, hide albums
            (!group.public && reqStat !== 'Joined' && !creator) ? (
              <View style={tw`items-center justify-center py-10`}>
                <View style={tw``}>
                  <IconSad width={100} height={100} />
                </View>
                <Text style={[tw`text-white text-[22px] mb-1.5`, { fontFamily: 'Nunito-ExtraBold', textAlign: 'center' }]}>Invite only group</Text>
                <Text style={[tw`text-white text-[16px] px-4`, { fontFamily: 'Nunito-Medium', textAlign: 'center' }]}>You must join this group to view its albums.</Text>
              </View>
            ) : (
              <View style={tw`flex-row flex-wrap gap-4`}>
                {albums && albums.map(album => (
                  <AlbumCard key={album.id}
                    id={album.id}
                    title={album.title}
                    onPress={() => { router.navigate({ pathname: '/(album)/albumview', params: { id: album.id } }) }} />
                ))}
                {(reqStat === 'Joined' || creator) &&
                  <TouchableOpacity
                    style={[tw`bg-white/10 rounded-xl justify-center items-center`, { width: (width - 64) / 2, height: (width - 64) / 2 }]}
                    onPress={() => router.navigate({ pathname: '/(create)/album', params: { groupId: id as string, name: group.title, img: group.group_image } })}
                  >
                    <View style={tw`flex-row items-center border border-white/50 rounded-full px-2.5 py-2`}>
                      <Text style={[tw`text-white text-xl mr-1.5 -mt-0.5`, { fontFamily: 'Nunito-ExtraBold' }]}>+</Text>
                      <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Create album</Text>
                    </View>
                  </TouchableOpacity>}
              </View>
            )
          ) : tab === 'details' ? (
            <View>
              {/* Bio box: full width, row 1 */}
              {group.bio ? (
                <View style={tw`mb-2 w-full bg-black/20 rounded-xl p-4`}>
                  <Text style={[tw`text-white text-[11px] mb-1.5`, { fontFamily: "Nunito-Bold", textAlign: 'left' }]}>ABOUT THIS GROUP</Text>
                  <Text style={[tw`text-white text-[18px]`, { fontFamily: "Nunito-ExtraBold", textAlign: 'left' }]}>
                    {group.bio}
                  </Text>
                </View>
              ) : null}
              {/* Creator and Days since created: row 2, side by side */}
              <View style={tw`flex-row gap-2 w-full mb-2`}>
                <View style={tw`flex-1 bg-black/20 rounded-xl p-4`}>
                  <Text style={[tw`text-white text-[11px] mb-1.5`, { fontFamily: "Nunito-Bold", textAlign: 'left' }]}>CREATED BY</Text>
                  <LinearGradient
                    colors={["#A57C01", "#D4AF37", "#B8860B", "#996515"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[tw`rounded-xl mt-1`, { padding: 2 }]}
                  >
                    <TouchableOpacity
                      style={tw`flex-row items-center p-2`}
                      activeOpacity={0.7}
                      onPress={() => { router.navigate({ pathname: '/(profile)/profile', params: { user_id: creatorInfo.id } }) }}
                    >
                      <Image
                        source={{ uri: creatorInfo.profile_image || undefined }}
                        style={tw`w-8 h-8 rounded-full mr-2 shadow-lg`}
                      />
                      <Text style={[tw`text-white text-[18px]`, { fontFamily: "Nunito-ExtraBold" }]} numberOfLines={1} ellipsizeMode="tail">
                        {creatorInfo.name}
                      </Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
                <View style={tw`flex-[1.2] bg-black/20 rounded-xl p-4`}>
                  <Text style={[tw`text-white text-[11px] mb-1.5`, { fontFamily: "Nunito-Bold", textAlign: 'left' }]}>DAYS SINCE CREATED</Text>
                  <LinearGradient
                    colors={["#A57C01", "#D4AF37", "#B8860B", "#996515"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[tw`rounded-xl mt-1`, { padding: 2 }]}
                  >
                    <View style={tw`flex-row items-center justify-center p-2`}>
                      <Text style={[tw`text-white text-[23px]`, { fontFamily: "Nunito-Black" }]}>
                        {(() => {
                          if (!group.created_at) return '-';
                          const createdDate = new Date(group.created_at);
                          const now = new Date();
                          const diff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                          return diff >= 0 ? diff : '-';
                        })()}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              </View>
              {/* Members: row 3, full width */}
              <View style={tw`w-full bg-black/20 rounded-xl p-4`}>
                {(() => {
                  const allMembers = [creatorInfo, ...members.filter(m => m.id !== creatorInfo.id)];
                  return (
                    <Text style={[tw`text-white text-[11px] mb-2 flex-row`, { fontFamily: "Nunito-Bold", textAlign: 'left' }]}>MEMBERS  <Text style={[tw`text-[12px]`, { fontFamily: "Nunito-Black" }]}>{allMembers.length}</Text></Text>
                  );
                })()}
                <View style={tw`flex-col`}>
                  {(!group.public && reqStat !== 'Joined' && !creator) ? (
                    <Text style={[tw`text-gray-400 text-[14px]`, { fontFamily: "Nunito-Medium", textAlign: 'left' }]}>You must join this group to view its members.</Text>
                  ) : (() => {
                    // Combine creator and members, remove duplicates by id
                    const allMembers = [creatorInfo, ...members.filter(m => m.id !== creatorInfo.id)];
                    if (allMembers.length === 0 || !allMembers[0].id) {
                      return (
                        <Text style={[tw`text-white text-[15px]`, { fontFamily: "Nunito-Medium", textAlign: 'center' }]}>No members found.</Text>
                      );
                    }
                    return allMembers.map((member, idx) => {
                      const isCreator = member.id === creatorInfo.id;
                      return (
                        <TouchableOpacity
                          key={member.id || idx}
                          style={tw`p-3 flex-row items-center mb-2 bg-black/20 rounded-xl`}
                          activeOpacity={0.7}
                          onPress={() => router.navigate({ pathname: '/(profile)/profile', params: { user_id: member.id } })}
                        >
                          <Image
                            source={member.profile_image ? { uri: member.profile_image } : require('../../assets/default_images/default1.png')}
                            style={tw`w-8 h-8 rounded-full mr-2 shadow-lg`}
                          />
                          <Text style={[tw`text-white text-[16px] mr-2.5`, { fontFamily: "Nunito-ExtraBold" }]}>{member.name}</Text>
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </View>
              </View>
            </View>
          ) : tab === 'requests' ? (
            <View>
              {requests.length === 0 ? (
                <>
                  <View style={tw`items-center mb-2`}>
                    <IconFun width={80} height={80} />
                  </View>
                  <Text style={[tw`text-white text-[22px] mb-2`, { fontFamily: "Nunito-ExtraBold", textAlign: 'center' }]}>No requests yet!</Text>
                  <Text style={[tw`text-white text-[16px] px-10`, { fontFamily: "Nunito-Medium", textAlign: 'center' }]}>People's requests to join your group will appear here!</Text>
                </>
              ) : (
                requests.map((req, idx) => (
                  <View key={req.id || idx} style={tw`flex-row items-center bg-black/20 rounded-xl p-3 mb-2`}>
                    <Image
                      source={req.users?.profile_image ? { uri: req.users.profile_image } : require('../../assets/default_images/default1.png')}
                      style={tw`w-8 h-8 rounded-full mr-2 shadow-lg`}
                    />
                    <Text style={[tw`text-white text-[16px] mr-2`, { fontFamily: "Nunito-ExtraBold" }]}>{req.users?.name || 'Unknown'}</Text>
                    <View style={tw`ml-auto flex-row gap-2`}>
                      <TouchableOpacity
                        style={tw`bg-green-600 rounded-full px-3 py-1.5`}
                        activeOpacity={0.7}
                        onPress={async () => {
                          // Accept: add to group_members, remove from group_requests
                          await supabase.from('group_members').insert({ user_id: req.user_id, group_id: group.id });
                          await supabase.from('group_requests').delete().eq('id', req.id);
                          setRequests(requests.filter(r => r.id !== req.id));
                        }}
                      >
                        <Text style={[tw`text-white text-[14px]`, { fontFamily: "Nunito-ExtraBold" }]}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={tw`bg-rose-600 rounded-full px-3 py-1.5`}
                        activeOpacity={0.7}
                        onPress={async () => {
                          // Reject: just remove from group_requests
                          await supabase.from('group_requests').delete().eq('id', req.id);
                          setRequests(requests.filter(r => r.id !== req.id));
                        }}
                      >
                        <Text style={[tw`text-white text-[14px]`, { fontFamily: "Nunito-ExtraBold" }]}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          ) : (<View>
            {/* Details content goes here */}
            <Text style={[tw`text-white text-sm mb-1`, { fontFamily: "Nunito-Medium" }]}>
              Members: {group.member_count}
            </Text>
          </View>)}
        </View>
        {/* You can add more group details or actions here */}
      </ScrollView>
    </GradientBackground>
  );
}
