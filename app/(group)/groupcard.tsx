import { View, Text, Image, TouchableOpacity } from "react-native";
import tw from "twrnc";

interface GroupCardProps {
  id: string;
  title: string;
  bio?: string;
  creator: string;
//   created: string;
  group_image: string;
  member_count: number;
  onPress?: () => void;
}

export default function GroupCard({ id, title, bio, creator, group_image, member_count, onPress }: GroupCardProps) {
  const isDefault = group_image === "default";
  return (
    <TouchableOpacity
      style={tw`w-32 h-32 rounded-lg overflow-hidden`}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {isDefault ? (
        <View style={tw`flex-1 bg-gray-500 justify-center items-center`}>
          <Text style={[tw`text-white text-lg text-center`, { fontFamily: 'Nunito-ExtraBold' }]} numberOfLines={2}>
            {title}
          </Text>
          {bio ? (
            <Text style={[tw`text-white text-xs text-center mt-1`, { fontFamily: 'Nunito-Medium' }]} numberOfLines={2}>
              {bio}
            </Text>
          ) : null}
        </View>
      ) : (
        <Image
          source={{ uri: group_image }}
          style={tw`w-full h-full`}
          resizeMode="cover"
        >
          {/* Fallback for RN <Image> not supporting children: */}
        </Image>
      )}
      {!isDefault && (
        <View style={tw`absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1`}>
          <Text style={[tw`text-white text-xs font-bold`, { fontFamily: 'Nunito-ExtraBold' }]} numberOfLines={1}>
            {title}
          </Text>
          {bio ? (
            <Text style={[tw`text-white text-[10px]`, { fontFamily: 'Nunito-Medium' }]} numberOfLines={1}>
              {bio}
            </Text>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}
