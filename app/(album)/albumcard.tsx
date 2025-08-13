import { View, Text, Image, TouchableOpacity, Dimensions, Alert } from "react-native";
import tw from "twrnc";
import { supabase } from "@/utils/supabase";
import { useEffect, useState } from "react";

interface AlbumCardProps {
    id: string;
    title: string;
    onPress?: () => void;
}

export default function AlbumCard({ id, title, onPress }: AlbumCardProps) {
    const width = Dimensions.get('screen').width;

    const [images, setImages] = useState<string[]>([]);

    useEffect(() => {
        const fetchImages = async () => {
            const { data, error } = await supabase
                .from('images')
                .select('image')
                .eq('album', id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (error) {
                Alert.alert(error.message);
            } else {
                setImages(data.map(e => e.image));
            }
        }
        fetchImages();
    }, [id]);

    const cardWidth = width / 2 - 32;
    return (
        <TouchableOpacity
            style={[tw`rounded-xl overflow-hidden`, { width: cardWidth, aspectRatio: 1 / 1 }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={tw`flex-1 justify-end`}>
                {images.length < 3 && <View style={[tw`absolute bg-gray-500 left-[65%] top-[35%] rounded-md shadow-2xl`, { width: (width - 64) / 4, aspectRatio: 1 / 1, transform: [{translateX: '-50%'}, {translateY: '-50%'}, {rotateZ: '10deg'}] }]}/>}
                {images.length < 2 && <View style={[tw`absolute bg-gray-500 left-[35%] top-[40%] rounded-md shadow-2xl`, { width: (width - 64) / 4, aspectRatio: 1 / 1, transform: [{translateX: '-50%'}, {translateY: '-50%'}, {rotateZ: '-10deg'}] }]}/>}
                {images.length < 1 && <View style={[tw`absolute bg-gray-500 left-[50%] top-[50%] rounded-md shadow-2xl`, { width: (width - 64) / 3.8, aspectRatio: 1 / 1, transform: [{translateX: '-50%'}, {translateY: '-50%'}] }]}/>}
                <Text style={[tw`text-white text-[16px] text-center`, { fontFamily: 'Nunito-ExtraBold' }]} numberOfLines={2}>
                    {title}
                </Text>
            </View>
        </TouchableOpacity>
    );
}
