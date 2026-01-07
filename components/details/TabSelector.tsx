import { styles } from '@/style/details';
import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface TabSelectorProps {
    activeTab: 'imported' | 'used';
    onSelectTab: (tab: 'imported' | 'used') => void;
}

const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onSelectTab }) => {
    return (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'imported' && styles.activeTab]}
                onPress={() => onSelectTab('imported')}
                activeOpacity={0.8}
            >
                <Ionicons
                    name="download-outline"
                    size={16}
                    color={activeTab === 'imported' ? '#000' : '#6B7280'}
                />
                <Text
                    style={[styles.tabText, activeTab === 'imported' && styles.activeTabText]}
                >
                    Material Availability
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'used' && styles.activeTab]}
                onPress={() => onSelectTab('used')}
                activeOpacity={0.8}
            >
                <Ionicons
                    name="trending-down-outline"
                    size={16}
                    color={activeTab === 'used' ? '#000' : '#6B7280'}
                />
                <Text
                    style={[styles.tabText, activeTab === 'used' && styles.activeTabText]}
                >
                    Material Used
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default TabSelector;