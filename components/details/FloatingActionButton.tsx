import { styles } from '@/style/details';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';

interface FloatingActionButtonProps {
    onPress: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onPress }) => {
    return (
        <TouchableOpacity
            style={styles.floatingActionButton}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
    );
};

export default FloatingActionButton;