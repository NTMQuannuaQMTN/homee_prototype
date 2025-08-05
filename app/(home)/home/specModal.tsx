import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

interface SpecModalProps {
    visible: boolean;
    color: string;
    title: string;
    spec: string;
    onClose: () => void;
}

const SpecModal: React.FC<SpecModalProps> = ({ visible, color, title, spec, onClose }) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
            onPress={onClose}>
                <View style={tw`${color} w-full absolute bottom-0 left-0 p-4`}>
                    <Text style={{ marginBottom: 16, fontWeight: 'bold', fontSize: 18 }}>{title}</Text>
                    <Text style={{ marginBottom: 16, fontWeight: 'bold', fontSize: 18 }}>{spec}</Text>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default SpecModal;
