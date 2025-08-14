import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import tw from "twrnc";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "upload" | "camera";

export default function CreateImage() {
  const [tab, setTab] = useState<TabType>("upload");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    <SafeAreaView style={tw`flex-1 bg-[#080B32]`}>
      <View style={tw`flex-row justify-center mt-6 mb-4`}>
        <TouchableOpacity
          style={[
            tw`flex-1 py-3 items-center rounded-t-lg`,
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
            tw`flex-1 py-3 items-center rounded-t-lg`,
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
          <Image
            source={{ uri: image }}
            style={tw`w-64 h-64 rounded-xl mb-6 bg-gray-800`}
            resizeMode="cover"
          />
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
    </SafeAreaView>
  );
}
