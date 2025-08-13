import { router, useLocalSearchParams } from "expo-router";
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from "react-native";
import { useEffect, useState } from "react";
import tw from "twrnc";
import { supabase } from "@/utils/supabase";
import { useUserStore } from "../store/userStore";
import AlbumCard from "../(album)/albumcard";

interface Group {
  id: string;
  title: string;
  bio?: string;
  creator: string;
  group_image: string;
  public: string;
  member_count: number;
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'album' | 'details' | 'requests'>('album');
  const [albums, setAlbums] = useState<Album[]>([]);
  const width = Dimensions.get('screen').width;
  const { user } = useUserStore();
  const [creatorInfo, setCreatorInfo] = useState<User>({
    id: '',
    name: '',
    profile_image: '',
  });
  const [creator, setCreator] = useState<boolean>(false);
  const [reqStat, setReqStat] = useState<string>('');

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("groups")
        .select("id, title, bio, creator, group_image, public, member_count")
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
        console.log('event', data, id);
        setCreatorInfo(data);
      } else {
        console.log(error);
      }
    };
    fetchCreator();
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
        <ActivityIndicator size="large" color="#7A5CFA" />
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

  const isDefault = group.group_image === "default";

  return (
    <ScrollView style={tw`flex-1 bg-[#080B32]`}>
      <View style={tw`items-center pt-10 px-6`}>
        {isDefault ? (
          <View style={[tw`rounded-lg bg-gray-500 justify-center items-center mb-4`, { width: width - 40, aspectRatio: 1 / 1 }]}>
            <Text style={[tw`text-white text-2xl text-center`, { fontFamily: "Nunito-ExtraBold" }]}>
              {group.title}
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: group.group_image }}
            style={[tw`rounded-lg mb-4`, { width: width - 40, aspectRatio: 1 / 1 }]}
            resizeMode="cover"
          />
        )}
        <Text style={[tw`text-white text-2xl mb-2 text-center`, { fontFamily: "Nunito-ExtraBold" }]}>
          {group.title}
        </Text>
        {creator ? <View>
          <Text style={[tw`text-white text-2xl mb-2 text-center`, { fontFamily: "Nunito-ExtraBold" }]}>
            Creator
          </Text>
        </View> : <TouchableOpacity onPress={toggleJoin}>
          <Text style={[tw`text-white text-2xl mb-2 text-center`, { fontFamily: "Nunito-ExtraBold" }]}>
            {reqStat === 'Nothing' ? 'Join' : reqStat}
          </Text>
        </TouchableOpacity>}
        {group.bio ? (
          <Text style={[tw`text-white text-base mb-2 text-center`, { fontFamily: "Nunito-Medium" }]}>
            {group.bio}
          </Text>
        ) : null}
      </View>
      {/* Tabs for Album and Details */}
      <View style={tw`flex-row justify-center mb-4 gap-2 px-2`}>
        <TouchableOpacity
          style={[
            tw`flex-1 py-2 rounded-t-lg items-center`,
            tab === 'album' ? tw`bg-[#7A5CFA]` : tw`bg-gray-700`
          ]}
          onPress={() => setTab('album')}
        >
          <Text style={[
            tw`text-base`,
            { fontFamily: "Nunito-Bold", color: tab === 'album' ? '#fff' : '#c7c7c7' }
          ]}>
            Album
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            tw`flex-1 py-2 rounded-t-lg items-center`,
            tab === 'details' ? tw`bg-[#7A5CFA]` : tw`bg-gray-700`
          ]}
          onPress={() => setTab('details')}
        >
          <Text style={[
            tw`text-base`,
            { fontFamily: "Nunito-Bold", color: tab === 'details' ? '#fff' : '#c7c7c7' }
          ]}>
            Details
          </Text>
        </TouchableOpacity>
        {creator && !group.public && <TouchableOpacity
          style={[
            tw`flex-1 py-2 rounded-t-lg items-center`,
            tab === 'requests' ? tw`bg-[#7A5CFA]` : tw`bg-gray-700`
          ]}
          onPress={() => setTab('requests')}
        >
          <Text style={[
            tw`text-base`,
            { fontFamily: "Nunito-Bold", color: tab === 'requests' ? '#fff' : '#c7c7c7' }
          ]}>
            Requests
          </Text>
        </TouchableOpacity>}
      </View>
      <View style={tw`px-6 pb-10`}>
        {tab === 'album' ? (
          <View style={tw`flex-row flex-wrap gap-4`}>
            {albums && albums.map(album => (
              <AlbumCard key={album.id}
                id={album.id}
                title={album.title}
                onPress={() => { }} />
            ))}
            {(reqStat === 'Joined' || creator) && <TouchableOpacity
              style={[tw`bg-gray-500 rounded-lg justify-center items-center`, { width: (width - 64) / 2, height: (width - 64) / 2 }]}
              onPress={() => router.navigate({ pathname: '/(create)/album', params: { groupId: id as string, name: group.title } })}
            >
              <Text style={tw`text-white text-2xl`}>+</Text>
            </TouchableOpacity>}
          </View>
        ) : tab === 'details' ? (
          <View>
            {/* Details content goes here */}
            <Text style={[tw`text-white text-sm mb-1`, { fontFamily: "Nunito-Medium" }]}>
              Members: {group.member_count}
            </Text>
            <View style={tw`flex-row items-center mt-1`}>
              <Text style={[tw`text-white text-sm mr-2`, { fontFamily: "Nunito-Medium" }]}>
                Created by:
              </Text>
              <TouchableOpacity
                style={tw`flex-row items-center bg-gray-700 p-2 rounded-xl`}
                activeOpacity={0.7}
                onPress={() => { router.navigate({ pathname: '/(profile)/profile', params: { user_id: creatorInfo.id } }) }}
              >
                <Image
                  source={{ uri: creatorInfo.profile_image || undefined }}
                  style={tw`w-6 h-6 rounded-full mr-2 bg-gray-400`}
                />
                <Text style={[tw`text-white text-sm`, { fontFamily: "Nunito-Bold" }]}>
                  {creatorInfo.name}
                </Text>
              </TouchableOpacity>
            </View>
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
  );
}
