import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, Dimensions, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { supabase } from "@/utils/supabase";
import tw from "twrnc";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

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
        if (albumId) fetchImages();
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
    const imageSize = (width - 48) / 3; // 3 images per row, 16px padding

    return (
        <SafeAreaView style={tw`flex-1 bg-[#080B32]`}>
            {/* Calendar Days of the Week */}
            <View style={tw`flex-row justify-between px-4 pb-2`}>
                {daysOfWeek.map(day => (
                    <View key={day} style={tw`flex-1 items-center`}>
                        <Text style={[tw`text-white text-xs`, { fontFamily: "Nunito-Bold" }]}>{day}</Text>
                    </View>
                ))}
            </View>
            <View style={tw`flex-row px-4`}>
                {daysOfWeek.map(day => (
                    <View key={day} style={[tw`flex-1`, { minHeight: 120 }]}>
                        {imagesByDay[day].length > 0 ? (
                            <FlatList
                                data={imagesByDay[day]}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <View style={{ marginBottom: 8 }}>
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
                        ) : (
                            <View style={{ height: imageSize, justifyContent: "center", alignItems: "center" }}>
                                <Text style={tw`text-gray-600 text-xs`}> </Text>
                            </View>
                        )}
                    </View>
                ))}
            </View>
            {loading && (
                <View style={tw`absolute inset-0 justify-center items-center bg-black/40`}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}
        </SafeAreaView>
    );
}
