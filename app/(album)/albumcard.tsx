import { View, Text, Image, TouchableOpacity, Dimensions, Alert } from "react-native";
import tw from "twrnc";
import { supabase } from "@/utils/supabase";
import defaultImages from "../(group)/group_defaultimg";
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
    // Use default4, default1, and default3 as fallback images in order
    const fallbackImages = [
        require('../../assets/default_images/default4.png'),
        require('../../assets/default_images/default1.png'),
        require('../../assets/default_images/default5.png'),
    ];
    const displayImages = [...images];
    for (let i = displayImages.length; i < 3; i++) {
        displayImages.push(fallbackImages[i]);
    }
    return (
        <TouchableOpacity
            style={[tw`rounded-xl`, { width: cardWidth, aspectRatio: 1 / 1 }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={tw`flex-1 justify-end`}>
                {/* Display up to 3 images, stacked with rotation */}
                {displayImages.slice(0,3).map((img, idx) => (
                    <Image
                        key={idx}
                        source={typeof img === 'string' ? { uri: img } : img}
                        style={[
                            tw`absolute rounded-lg shadow-xl`,
                            idx === 0 && { left: '65%', top: '35%', width: (width - 64) / 4, height: (width - 64) / 4, transform: [{translateX: '-50%'}, {translateY: '-50%'}, {rotateZ: '10deg'}] },
                            idx === 1 && { left: '35%', top: '40%', width: (width - 64) / 4, height: (width - 64) / 4, transform: [{translateX: '-50%'}, {translateY: '-50%'}, {rotateZ: '-10deg'}] },
                            idx === 2 && { left: '50%', top: '52%', width: (width - 50) / 3.8, height: (width - 50) / 3.8, transform: [{translateX: '-50%'}, {translateY: '-50%'}] },
                        ]}
                    />
                ))}
                <Text style={[tw`text-white text-[16px] text-center`, { fontFamily: 'Nunito-ExtraBold' }]} numberOfLines={2}>
                    {title}
                </Text>
            </View>
        </TouchableOpacity>
    );
}
