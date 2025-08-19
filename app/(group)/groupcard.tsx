import { View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import tw from "twrnc";
import defaultImages from "../(create)/defaultimage";
import GoldGradient from "../components/GoldGradient";
import { useAsyncFeaturedGroupsStore } from '../store/asyncFeaturedGroupsStore';

interface GroupCardProps {
  id: string;
  title: string;
  bio?: string;
  creator: string;
  publicGroup: boolean;
  created_at?: string;
  group_image: string;
  member_count: number;
  onPress?: () => void;
  featured?: boolean; // If true, show GoldGradient behind title
}

export default function GroupCard({ id, title, bio, creator, group_image, publicGroup, member_count, onPress, featured, created_at }: GroupCardProps) {
  const width = Dimensions.get('screen').width;
  const cardWidth = width / 2 - 20;

  // Get featured group IDs from store
  const featuredGroupIds = useAsyncFeaturedGroupsStore(state => state.featuredGroupIds);
  const isFeatured = featuredGroupIds.includes(id);

  // Calculate days since created
  let daysSinceCreated = '-';
  if (created_at) {
    const createdDate = new Date(created_at);
    const now = new Date();
    if (!isNaN(createdDate.getTime())) {
      const diff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      daysSinceCreated = diff >= 0 ? diff.toString() : '-';
    }
  }

  // Default image logic: match group.tsx and imageModal.tsx
  let isDefault = false;
  let defaultImage;
  if (group_image === 'default') {
    // Use id to consistently pick a default image
    let defaultIndex = 0;
    if (id && id.length > 2) {
      defaultIndex = Math.abs(Array.from(id).reduce((acc, c) => acc + c.charCodeAt(0), 0)) % defaultImages.length;
    } else {
      defaultIndex = Math.floor(Math.random() * defaultImages.length);
    }
    defaultImage = defaultImages[defaultIndex];
    isDefault = true;
  } else if (group_image && group_image.startsWith('default')) {
    // Try to find the matching image in defaultImages by filename
    const found = defaultImages.find(img => {
      if (typeof img === 'number') return false;
      if (img && img.uri && typeof img.uri === 'string') {
        return img.uri.includes(group_image);
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
    <TouchableOpacity
      style={[tw`rounded-xl overflow-hidden`, {width: cardWidth, aspectRatio: 1/1}]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Days Since Created badge */}
      <View style={tw`absolute top-2 left-2 z-10`}>
        <GoldGradient style={tw`px-2 py-1 rounded-lg`}>
          <Text style={[tw`text-white text-[12px]`, { fontFamily: 'Nunito-Black' }]}>{daysSinceCreated} days</Text>
        </GoldGradient>
      </View>
      {isDefault ? (
        <View style={tw`flex-1 justify-center items-center shadow-lg`}>
          <Image
            source={defaultImage}
            style={tw`w-full h-full absolute`}
            resizeMode="cover"
          />
          {isFeatured ? (
            <GoldGradient style={tw`absolute bottom-0 left-0 right-0 pb-2.5 pt-2 px-2.5`}>
              <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-Black' }]} numberOfLines={1}>
                {title}
              </Text>
            </GoldGradient>
          ) : (
            <View style={tw`absolute bottom-0 left-0 right-0 bg-black/60 pb-2.5 pt-2 px-2.5`}>
              <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-Black' }]} numberOfLines={1}>
                {title}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <>
          <Image
            source={{ uri: group_image }}
            style={tw`w-full h-full`}
            resizeMode="cover"
          />
          {isFeatured ? (
            <GoldGradient style={tw`absolute bottom-0 left-0 right-0 pb-2.5 pt-2 px-2.5`}>
              <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-Black' }]} numberOfLines={1}>
                {title}
              </Text>
            </GoldGradient>
          ) : (
            <View style={tw`absolute bottom-0 left-0 right-0 bg-black/60 pb-2.5 pt-2 px-2.5`}>
              <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-Black' }]} numberOfLines={1}>
                {title}
              </Text>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
