import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator, TextInput } from "react-native";
import * as ImagePicker from "expo-image-picker";
import tw from "twrnc";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/utils/supabase";
import { useUserStore } from "../store/userStore";

type TabType = "upload" | "camera";

export default function CreateImage() {
  const [tab, setTab] = useState<TabType>("upload");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aspect, setAspect] = useState(1);

  const [showCaptionAlbum, setShowCaptionAlbum] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showAlbumDropdown, setShowAlbumDropdown] = useState(false);
  const [groupList, setGroupList] = useState<string[]>([]);
  const [group, setGroup] = useState<string>('');
  const [albumList, setAlbumList] = useState<string[]>([]);
  const [album, setAlbum] = useState<string[]>([]);
  const [caption, setCaption] = useState('');

  const { user } = useUserStore();

  useEffect(() => {
    if (image) Image.getSize(image, (width, height) => setAspect(height / width), (error) => { });
  }, [image]);

  useEffect(() => {
    const getAlbums = async () => {
      const { data } = await supabase.from('albums')
        .select('id')
        .eq('group', group);

      if (data) setAlbumList(data.map(a => a.id));
    }
    getAlbums();
  }, [group]);

  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!user?.id) return;

      // Get groups where user is creator
      const { data: createdGroups, error: createdError } = await supabase
        .from('groups')
        .select('id, title, group_image')
        .eq('creator', user.id);

      // Get group memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      let joinedGroups: { id: string; title: string; group_image: string; }[] = [];
      if (memberships && memberships.length > 0) {
        const groupIds = memberships.map(m => m.group_id);
        const { data: joined, error: joinedError } = await supabase
          .from('groups')
          .select('id, title, group_image')
          .in('id', groupIds);

        if (joined) {
          joinedGroups = joined;
        }
      }

      // Merge and deduplicate groups
      const allGroups = [
        ...(createdGroups || []),
        ...joinedGroups
      ];
      // Remove duplicates by group id
      const uniqueGroups = allGroups.map(g => g.id);
      setGroupList(uniqueGroups);
    };

    fetchUserGroups();
  }, [user?.id]);

  const pickImage = async () => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (e) {
      // handle error
    }
    setLoading(false);
  };

  const takePhoto = async () => {
    setLoading(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setLoading(false);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (e) {
      // handle error
    }
    setLoading(false);
  };

  return (
    <View style={tw`flex-1 bg-[#080B32]`}>
      <Text style={[tw`text-white text-[22px] text-center mt-12`, { fontFamily: 'Nunito-ExtraBold' }]}>Add an image</Text>
      <View style={tw`flex-row justify-center mt-2 px-4 gap-4 mb-4`}>
        <TouchableOpacity
          style={[
            tw`flex-1 py-2 items-center rounded-lg`,
            tab === "upload" ? tw`bg-[#7A5CFA]` : tw`bg-gray-700`
          ]}
          onPress={() => setTab("upload")}
        >
          <Text style={[tw`text-base`, { fontFamily: "Nunito-Bold", color: tab === "upload" ? "#fff" : "#c7c7c7" }]}>
            Upload
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            tw`flex-1 py-2 items-center rounded-lg`,
            tab === "camera" ? tw`bg-[#7A5CFA]` : tw`bg-gray-700`
          ]}
          onPress={() => setTab("camera")}
        >
          <Text style={[tw`text-base`, { fontFamily: "Nunito-Bold", color: tab === "camera" ? "#fff" : "#c7c7c7" }]}>
            Camera
          </Text>
        </TouchableOpacity>
      </View>
      <View style={tw`flex-1 items-center justify-center px-6`}>
        {loading ? (
          <ActivityIndicator size="large" color="#7A5CFA" />
        ) : image ? (
          <View style={[tw`w-64 rounded-xl mb-6 bg-gray-800 items-center justify-center`, { overflow: "hidden", height: 256 * aspect }]}>
            <Image
              source={{ uri: image }}
              style={[
                tw`rounded-xl w-full h-full`,
              ]}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={tw`w-64 h-64 rounded-xl mb-6 bg-gray-800 items-center justify-center`}>
            <Text style={tw`text-gray-400 text-lg`}>No image selected</Text>
          </View>
        )}
        {tab === "upload" ? (
          <TouchableOpacity
            style={tw`bg-[#7A5CFA] px-8 py-3 rounded-lg`}
            onPress={pickImage}
          >
            <Text style={[tw`text-white text-lg`, { fontFamily: "Nunito-Bold" }]}>Choose from Gallery</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={tw`bg-[#7A5CFA] px-8 py-3 rounded-lg`}
            onPress={takePhoto}
          >
            <Text style={[tw`text-white text-lg`, { fontFamily: "Nunito-Bold" }]}>Take a Photo</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Next Button */}
      {image && (
        <TouchableOpacity
          style={tw`bg-green-600 px-8 py-3 rounded-lg mt-6`}
          onPress={() => setShowCaptionAlbum(true)}
        >
          <Text style={[tw`text-white text-lg`, { fontFamily: "Nunito-Bold" }]}>Next</Text>
        </TouchableOpacity>
      )}

      {/* Caption & Album Modal/Page */}
      {showCaptionAlbum && (
        <View style={[tw`absolute top-0 left-0 w-full h-full bg-black bg-opacity-90 items-center justify-center px-6`]}>
          <View style={tw`bg-gray-900 rounded-xl p-6 w-full max-w-md`}>
            <Text style={[tw`text-white text-xl mb-4`, { fontFamily: "Nunito-Bold" }]}>Add Details</Text>
            <Text style={[tw`text-white mb-2`, { fontFamily: "Nunito-Medium" }]}>Caption</Text>
            <TextInput
              style={[
                tw`bg-gray-800 text-white rounded-lg px-4 py-2 mb-4`,
                { fontFamily: "Nunito-Medium" }
              ]}
              placeholder="Enter a caption..."
              placeholderTextColor="#aaa"
              value={caption}
              onChangeText={setCaption}
            />
            <Text style={[tw`text-white mb-2`, { fontFamily: "Nunito-Medium" }]}>Album</Text>
            <TouchableOpacity
              style={[
                tw`bg-gray-800 text-white rounded-lg px-4 py-2 mb-6 flex-row items-center justify-between`,
                { fontFamily: "Nunito-Medium" }
              ]}
              onPress={() => setShowGroupDropdown(!showGroupDropdown)}
            >
              <Text style={[tw`text-white`, { fontFamily: "Nunito-Medium" }]}>
                {group ? group : "Choose group..."}
              </Text>
              <Text style={tw`text-white text-lg`}>
                {showGroupDropdown ? "▲" : "▼"}
              </Text>
            </TouchableOpacity>
            {showGroupDropdown && (
              <View style={tw`bg-gray-800 rounded-lg mt-2 px-2 py-2 mb-6`}>
                {groupList
                  .filter(Boolean)
                  .map((g, idx) => (
                    <TouchableOpacity
                      key={g + idx}
                      style={tw`py-2`}
                      onPress={() => {
                        setGroup(g);
                        setShowGroupDropdown(false);
                      }}
                    >
                      <Text style={[
                        tw`text-white`,
                        { fontFamily: "Nunito-Medium", fontWeight: group === g ? "bold" : "normal" }
                      ]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
            {/* Album Dropdown with Checkboxes */}
            <View style={tw`mb-6`}>
              <TouchableOpacity
                style={[
                  tw`bg-gray-800 rounded-lg px-4 py-2 flex-row items-center justify-between`,
                  { minHeight: 48 }
                ]}
                onPress={() => setShowAlbumDropdown(!showAlbumDropdown)}
              >
                <Text style={[tw`text-white`, { fontFamily: "Nunito-Medium" }]}>
                  {album && album.length > 0
                    ? album.join(", ")
                    : "Select albums..."}
                </Text>
                <Text style={tw`text-white text-lg`}>
                  {showAlbumDropdown ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>
              {showAlbumDropdown && (
                <View style={tw`bg-gray-800 rounded-lg mt-2 px-2 py-2`}>
                  {albumList
                    .map((a, idx) => (
                      <TouchableOpacity
                        key={a + idx}
                        style={tw`flex-row items-center py-2`}
                        onPress={() => {
                          if (album.includes(a)) {
                            setAlbum(album.filter(i => i !== a));
                          } else {
                            setAlbum([...album, a]);
                          }
                        }}
                      >
                        <View
                          style={[
                            tw`w-5 h-5 rounded border border-white mr-3 items-center justify-center`,
                            { backgroundColor: album.includes(a) ? "#7A5CFA" : "transparent" }
                          ]}
                        >
                          {album.includes(a) && (
                            <Text style={tw`text-white text-xs`}>✓</Text>
                          )}
                        </View>
                        <Text style={[tw`text-white`, { fontFamily: "Nunito-Medium" }]}>{album}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </View>
            <View style={tw`flex-row justify-between`}>
              <TouchableOpacity
                style={tw`bg-gray-700 px-6 py-2 rounded-lg`}
                onPress={() => setShowCaptionAlbum(false)}
              >
                <Text style={[tw`text-white`, { fontFamily: "Nunito-Bold" }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`bg-[#7A5CFA] px-6 py-2 rounded-lg`}
              // onPress={handleSubmit}
              >
                <Text style={[tw`text-white`, { fontFamily: "Nunito-Bold" }]}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
