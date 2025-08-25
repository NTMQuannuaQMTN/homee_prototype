import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, Dimensions, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { supabase } from "@/utils/supabase";
import tw from "twrnc";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import BackIcon from '../../assets/icons/back.svg';

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AlbumView() {
    const { id: albumId } = useLocalSearchParams();
    const [images, setImages] = useState<
        {
            id: string;
            image: string;
            created_at: any;
        }[]>([]);
    const [loading, setLoading] = useState(true);
    const [albumName, setAlbumName] = useState<string>("");

    useEffect(() => {
        const fetchImages = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("images")
                .select("id, image, created_at")
                .eq("album", albumId)
                .order("created_at", { ascending: false });

            if (error) {
                Alert.alert("Error", error.message);
                setImages([]);
            } else {
                setImages(data || []);
            }
            setLoading(false);
        };

        const fetchAlbumName = async () => {
            const { data, error } = await supabase
                .from("albums")
                .select("title")
                .eq("id", albumId)
                .single();

            if (error) {
                console.error("Error fetching album name:", error);
                setAlbumName("Album View");
            } else {
                setAlbumName(data?.title || "Album View");
            }
        };

        if (albumId) {
            fetchImages();
            fetchAlbumName();
        }
    }, [albumId]);

    // Group images by day of week
    const imagesByDay: { [key: string]: typeof images } = daysOfWeek.reduce((acc, day) => {
        acc[day] = [];
        return acc;
    }, {} as { [key: string]: typeof images });
    images.forEach(img => {
        const date = new Date(img.created_at);
        const day = daysOfWeek[date.getDay()];
        imagesByDay[day].push(img);
    });

    const width = Dimensions.get("window").width;
    const imageSize = (width - 40) / 2; // 3 images per row, 16px padding

    return (
        <SafeAreaView style={tw`flex-1 bg-[#080B32]`}>
            <View style={tw`flex-row items-center justify-between px-4 pb-2 border-b border-gray-700 mb-3`}>
                <TouchableOpacity onPress={() => router.back()} style={tw``}>
                    <BackIcon width={24} height={24} />
                </TouchableOpacity>
                <Text style={[tw`text-white text-lg`, { fontFamily: "Nunito-Bold" }]}>
                    {albumName}
                </Text>
            </View>

            {/* Calendar Days of the Week */}
            {/* Calendar: Show week of first image, highlight that date */}
            {images.length > 0 && (() => {
                // Find the date of the first image (most recent, since ordered descending)
                const firstImageDate = new Date(images[0].created_at);
                // Get the start of the week (Sunday)
                const weekStart = new Date(firstImageDate);
                weekStart.setDate(firstImageDate.getDate() - firstImageDate.getDay());
                // Build the week days array (dates)
                const weekDates = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(weekStart);
                    d.setDate(weekStart.getDate() + i);
                    return d;
                });
                return (
                    <View style={tw`flex-row items-center justify-between px-4 pb-2`}>
                        {weekDates.map((date, idx) => {
                            const isHighlighted =
                                date.getFullYear() === firstImageDate.getFullYear() &&
                                date.getMonth() === firstImageDate.getMonth() &&
                                date.getDate() === firstImageDate.getDate();

                            return (
                                <View key={idx} style={tw`flex-1 items-center`}>
                                    <View>
                                        <Text style={[tw`text-md ${isHighlighted ? 'text-white' : 'text-gray-400'}`, {fontFamily: 'Nunito-Medium'}]}>
                                            {daysOfWeek[idx]}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            tw`w-9 h-9 justify-center items-center`,
                                            isHighlighted
                                                ? tw`bg-[#7A5CFA] rounded-full`
                                                : null
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                tw`text-base`,
                                                { fontFamily: "Nunito-Bold" },
                                                isHighlighted ? tw`text-white` : tw`text-gray-400`
                                            ]}
                                        >
                                            {date.getDate()}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                );
            })()}

            {/* Freely display all images in a grid */}
            <FlatList
                data={images}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={tw`px-4`}
                renderItem={({ item }) => (
                    <View style={{ marginBottom: 12, marginRight: 8, width: imageSize }}>
                        <Image
                            source={{ uri: item.image }}
                            style={{
                                width: imageSize,
                                height: imageSize,
                                borderRadius: 10,
                                backgroundColor: "#222"
                            }}
                            resizeMode="cover"
                        />
                    </View>
                )}
                showsVerticalScrollIndicator={false}
            />
            {loading && (
                <View style={tw`absolute inset-0 justify-center items-center bg-black/40`}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}
        </SafeAreaView>
    );
}
