import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { icons } from '../constants/icons';

interface TabBarButtonProps {
    onPress: () => void;
    onLongPress: () => void;
    isFocused: boolean;
    routeName: string;
    color: string;
    label: string;
}

const TabBarButton = ({
    onPress,
    onLongPress,
    isFocused,
    routeName,
    color,
    label
}: TabBarButtonProps) => {
    const scale = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(typeof isFocused === 'boolean' ? (isFocused ? 1 : 0) : isFocused, {
            duration: 350
        });
    }, [scale, isFocused]);

    const animatedTextStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scale.value, [0, 1], [1, 0]);
        return {
            opacity
        };
    });

    const animatedIconStyle = useAnimatedStyle(() => {
        const scaleValue = interpolate(scale.value, [0, 1], [1, 1.2]);
        const top = interpolate(scale.value, [0, 1], [0, 9]);
        return {
            transform: [{
                scale: scaleValue
            }],
            top: top
        };
    });

    // Check if the icon exists for the current route
    const IconComponent = (icons as Record<string, (props: any) => JSX.Element>)[routeName];
    if (!IconComponent) {
        console.warn(`No icon found for route: ${routeName}`);
        return null;
    }

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabBarItem}
        >
            <Animated.View style={animatedIconStyle}>
                {IconComponent({
                    color: isFocused ? "#222" : "#222"
                })}
            </Animated.View>
            <Animated.Text style={[{ color: color, fontSize: 12 }, animatedTextStyle]}>
                {label}
            </Animated.Text>
        </Pressable>
    );
};

export default TabBarButton;

const styles = StyleSheet.create({
    tabBarItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5
    }
});