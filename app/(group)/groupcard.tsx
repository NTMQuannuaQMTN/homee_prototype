import { View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import tw from "twrnc";
import defaultImages from "./group_defaultimg";

interface GroupCardProps {
  id: string;
  title: string;
  bio?: string;
  creator: string;
  publicGroup: boolean;
//   created: string;
  group_image: string;
  member_count: number;
  onPress?: () => void;
}

export default function GroupCard({ id, title, bio, creator, group_image, publicGroup, member_count, onPress }: GroupCardProps) {
  const isDefault = group_image === "default";
  const width = Dimensions.get('screen').width;

  const cardWidth = width / 2 - 20;
  // Use id to get a consistent random image for each group, but if id is missing or too short, use random
  let defaultIndex = 0;
  if (isDefault) {
    if (id && id.length > 2) {
      defaultIndex = Math.abs(Array.from(id).reduce((acc, c) => acc + c.charCodeAt(0), 0)) % defaultImages.length;
    } else {
      defaultIndex = Math.floor(Math.random() * defaultImages.length);
    }
  }
  const defaultImage = defaultImages[defaultIndex];
  return (
    <TouchableOpacity
      style={[tw`rounded-xl overflow-hidden`, {width: cardWidth, aspectRatio: 1/1}]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isDefault ? (
        <View style={tw`flex-1 justify-center items-center shadow-lg`}>
          <Image
            source={defaultImage}
            style={tw`w-full h-full absolute`}
            resizeMode="cover"
          />
          <View style={tw`absolute bottom-0 left-0 right-0 bg-black/60 pb-2.5 pt-2 px-2.5`}>
            <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-Black' }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
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
        <View style={tw`absolute bottom-0 left-0 right-0 bg-black/60 pb-2.5 pt-2 px-2.5`}>
          <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-Black' }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
