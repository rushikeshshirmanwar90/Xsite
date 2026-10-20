import { Colors } from '@/constants/theme';
import { styles } from '@/style/details';
import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native';

interface TabSelectorProps {
    activeTab: 'imported' | 'used';
    onSelectTab: (tab: 'imported' | 'used') => void;
}

const PILL_INSET = 4;

const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onSelectTab }) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const slideAnim = useRef(new Animated.Value(activeTab === 'imported' ? 0 : 1)).current;

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: activeTab === 'imported' ? 0 : 1,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [activeTab]);

    const pillWidth = containerWidth > 0 ? (containerWidth - PILL_INSET * 2) / 2 : 0;

    return (
        <View
            style={styles.tabContainer}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
            {pillWidth > 0 && (
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: PILL_INSET,
                        bottom: PILL_INSET,
                        left: PILL_INSET,
                        width: pillWidth,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 10,
                        shadowColor: '#0F172A',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08,
                        shadowRadius: 2,
                        elevation: 2,
                        transform: [{
                            translateX: slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, pillWidth],
                            }),
                        }],
                    }}
                />
            )}
            <TouchableOpacity
                style={styles.tab}
                onPress={() => onSelectTab('imported')}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'imported' }}
            >
                <Ionicons
                    name="download-outline"
                    size={16}
                    color={activeTab === 'imported' ? '#0F172A' : Colors.textSecondary}
                />
                <Text
                    style={[styles.tabText, activeTab === 'imported' && styles.activeTabText]}
                    numberOfLines={1}
                >
                    Available
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.tab}
                onPress={() => onSelectTab('used')}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'used' }}
            >
                <Ionicons
                    name="trending-down-outline"
                    size={16}
                    color={activeTab === 'used' ? '#0F172A' : Colors.textSecondary}
                />
                <Text
                    style={[styles.tabText, activeTab === 'used' && styles.activeTabText]}
                    numberOfLines={1}
                >
                    Used
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default TabSelector;
