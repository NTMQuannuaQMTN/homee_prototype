import { router } from "expo-router";
import { View, Text, Touchable, TouchableOpacity, ScrollView } from "react-native";
import tw from "twrnc";

export default function GroupList() {
    return (<View>
        <Text style={[tw`text-white text-2xl mt-1`, { fontFamily: 'Nunito-ExtraBold' }]}>Groups</Text>
        <ScrollView horizontal style={tw`h-32 flex-row mt-2 gap-2`}>
            
            <TouchableOpacity style={tw`h-32 w-32 bg-gray-500 rounded-lg justify-center items-center`}
            onPress={() => router.navigate('/(create)/group')}>
                <Text>+</Text>
            </TouchableOpacity>
        </ScrollView>
    </View>);
}