import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, Dimensions, TouchableOpacity, ScrollView, Animated, TextInput } from "react-native";
import tw from "twrnc";
import { useImageStore } from "../store/imageStore";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import Back from '../../assets/icons/back.svg';

export default function ImageAlbum() {
    const { images, removeImage, setImages } = useImageStore();

    const [slide, setSlide] = useState(0);

    const width = Dimensions.get('window').width;
    const height = Dimensions.get('window').height;

    useEffect(() => {
        if (images.length < 1) {
            router.back();
        }
    }, [images]);

    return (
        <View style={tw`flex-1 bg-[#080B32]`}>
            {/* Top bar */}
            <View style={tw`relative flex-row items-center px-4 mt-13 mb-2 h-10`}>
                {/* Back button and title - left */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[tw`flex-row items-center`, { zIndex: 2 }]}
                >
                    <Back />
                </TouchableOpacity>
                {/* Done and Edit buttons - right */}
                <View style={[tw`absolute right-4 flex-row items-center`, { zIndex: 2 }]}> 
                    <TouchableOpacity
                        style={[tw`rounded-full px-4 py-1.5 bg-white/10 mr-2`]}
                        onPress={async () => {
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
                                        }))
                                    ]);
                                }
                            } catch (e) {
                                // Optionally handle error
                            }
                        }}
                    >
                        <Text style={[tw`text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Edit selection</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[tw`rounded-full px-4 py-1.5 bg-[#7A5CFA]`]}
                        onPress={() => router.back()}
                    >
                        <Text style={[tw`text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <Animated.FlatList
                data={images.map((_, idx) => idx)}
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
                    scale = 1 - 0.1 * (slide - item) * (slide - item);
                    img = (item !== images.length) ? images[item].uri : '';

                    return (
                        <Animated.View style={[{ width: 0.8 * width, height: '100%', justifyContent: 'center', alignItems: 'center', transform: [{ scale }] }]}>
                            <Image
                                source={{ uri: img }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    resizeMode: 'contain',
                                }}
                            />
                        </Animated.View>
                    );
                }}
            />
            {/* This view is now placed directly under the FlatList */}
            <View style={{ position: 'absolute', top: 0.7 * height + 64, left: 0, right: 0, alignItems: 'center', zIndex: 10 }}>
                <TouchableOpacity
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: 24,
                        padding: 12,
                        elevation: 3,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 2,
                    }}
                    onPress={() => {
                        removeImage(images[slide].uri);
                    }}
                >
                    {/* Trash can icon (SVG) */}
                    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 22, color: '#7A5CFA' }}>🗑️</Text>
                    </View>
                </TouchableOpacity>
                <View style={{ marginTop: 16, width: '80%' }}>
                    <TextInput
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: 12,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            fontSize: 16,
                            color: '#222',
                        }}
                        placeholder="Add a caption..."
                        placeholderTextColor="#888"
                        value={images[slide]?.caption || ''}
                        onChangeText={text => {
                            const updatedImages = images.map((img, idx) =>
                                idx === slide ? { ...img, caption: text } : img
                            );
                            setImages(updatedImages);
                        }}
                    />
                </View>
            </View>
        </View>
    );
}
