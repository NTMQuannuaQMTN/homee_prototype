import { useLocalSearchParams } from "expo-router";
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import tw from "twrnc";
import { supabase } from "@/utils/supabase";

interface Group {
  id: string;
  title: string;
  bio?: string;
  creator: string;
  group_image: string;
  member_count: number;
}

export default function GroupView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("groups")
        .select("id, title, bio, creator, group_image, member_count")
        .eq("id", id)
        .single();
      if (!error && data) {
        setGroup(data);
      }
      setLoading(false);
    };
    if (id) fetchGroup();
  }, [id]);

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
      <View style={tw`items-center pt-10 pb-6 px-6`}>
        {isDefault ? (
          <View style={tw`w-32 h-32 rounded-lg bg-gray-500 justify-center items-center mb-4`}>
            <Text style={[tw`text-white text-2xl text-center`, { fontFamily: "Nunito-ExtraBold" }]}>
              {group.title}
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: group.group_image }}
            style={tw`w-32 h-32 rounded-lg mb-4`}
            resizeMode="cover"
          />
        )}
        <Text style={[tw`text-white text-2xl mb-2 text-center`, { fontFamily: "Nunito-ExtraBold" }]}>
          {group.title}
        </Text>
        {group.bio ? (
          <Text style={[tw`text-white text-base mb-2 text-center`, { fontFamily: "Nunito-Medium" }]}>
            {group.bio}
          </Text>
        ) : null}
        <Text style={[tw`text-white text-sm mb-1`, { fontFamily: "Nunito-Medium" }]}>
          Members: {group.member_count}
        </Text>
        <Text style={[tw`text-white text-xs`, { fontFamily: "Nunito-Medium" }]}>
          Created by: {group.creator}
        </Text>
      </View>
      {/* You can add more group details or actions here */}
    </ScrollView>
  );
}
