import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator, TextInput, ScrollView, Animated, Dimensions } from "react-native";
import * as ImagePicker from "expo-image-picker";
import tw from "twrnc";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/utils/supabase";
import { useImageStore } from "../store/imageStore";

type TabType = "upload" | "camera";

interface Group {
  id: string;
  title: string;
  group_image: string;
}

interface Album {
  id: string;
  title: string;
}

export default function CreateImage() {
  const [tab, setTab] = useState<TabType>("upload");
  const [loading, setLoading] = useState(false);

  const { images, setImages } = useImageStore();

  const [slide, setSlide] = useState(0);

  const width = Dimensions.get('window').width;
  const height = Dimensions.get('window').height;

  const pickImage = async () => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 0, // 0 means unlimited in Expo SDK 49+
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages([
          ...images,
          ...result.assets.map(asset => ({
            uri: asset.uri,
            caption: "",
            group: { id: '', title: '' },
            album: []
          }))
        ]);
        console.log(...result.assets.map(asset => ({
          uri: asset.uri,
          caption: "",
          group: { id: '', title: '' },
          album: []
        })));
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
        setImages([...images, {
          uri: result.assets[0].uri, caption: "",
          group: { id: '', title: '' }, album: []
        }]);
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
      <View style={tw`flex-1 items-center justify-center`}>
        {loading ? (
          <ActivityIndicator size="large" color="#7A5CFA" />
        ) : images.length > 0 ? (
          <Animated.FlatList
            data={[...images.map((_, idx) => idx), images.length]}
            keyExtractor={item => item.toString()}
            horizontal
            pagingEnabled
            snapToInterval={0.8 * width}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              height: 0.6 * height,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 0.1 * width,
              marginTop: 40,
            }}
            style={{ height: 0.6 * height, width: width }}
            onScroll={e => {
              // Optionally, update slide index for UI logic (not for animation)
              const x = e.nativeEvent.contentOffset.x;
              setSlide(x / (0.8 * width));
            }}
            scrollEventThrottle={16}
            renderItem={({ item }) => {
              let scale, img;
              scale = 1 - 0.1 * Math.abs(slide - item);
              img = (item !== images.length) ? images[item].uri : '';

              return (
                (item === images.length) ?
                  <TouchableOpacity
                    onPress={() => { if (slide === item) { pickImage(); setSlide(0) } else { setSlide(item); } }}
                    style={{ width: 0.8 * width, height: '100%', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Animated.View style={[tw`bg-gray-500`, { borderRadius: 20, width: 0.8 * width, height: '100%', justifyContent: 'center', alignItems: 'center', transform: [{ scale }] }]}>
                      <Text>+</Text>
                    </Animated.View>
                  </TouchableOpacity> :
                  <TouchableOpacity
                    onPress={() => { setSlide(item); }}
                    activeOpacity={1}
                    style={{ width: 0.8 * width, height: '100%', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Animated.View style={[{ width: 0.8 * width, height: '100%', justifyContent: 'center', alignItems: 'center', transform: [{ scale }] }]}>
                      <Image
                        source={{ uri: img }}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 20,
                          resizeMode: 'contain',
                        }}
                      />
                    </Animated.View>
                  </TouchableOpacity>
              );
            }}
          />
          // <ScrollView
          //   horizontal
          //   pagingEnabled
          //   showsHorizontalScrollIndicator={false}
          //   snapToInterval={256} // width of each image card (w-64 = 256px)
          //   decelerationRate="fast"
          //   contentContainerStyle={{ alignItems: "center" }}
          // >
          //   {images.map((img, idx) => (
          //     <View
          //       key={img.uri || idx}
          //       style={[
          //         tw`w-64 h-96 rounded-xl mb-6 items-center justify-center`,
          //         { overflow: "hidden", marginRight: idx < images.length - 1 ? 16 : 0 }
          //       ]}
          //     >
          //       <Image
          //         source={{ uri: img.uri }}
          //         style={tw`rounded-xl w-64 h-96`}
          //         resizeMode="cover"
          //       />
          //     </View>
          //   ))}
          // </ScrollView>
        ) : (
          <View style={tw`w-64 h-64 rounded-xl mb-6 bg-gray-800 items-center justify-center`}>
            <Text style={tw`text-gray-400 text-lg`}>No image selected</Text>
          </View>
        )}
        {images.length <= 0 && (tab === "upload" ? (
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
        ))}
      </View>
    </View >
  );
}
