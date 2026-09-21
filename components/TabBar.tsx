import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import TabBarButton from './TabBarButton';

type BottomTabBarProps = {
    state: any;
    descriptors: any;
    navigation: any;
};

const TabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    if (!state || !state.routes || state.routes.length === 0) return null;

    const [dimensions, setDimensions] = useState({
        width: 20,
        height: 100
    });

    const buttonWidth = dimensions.width / (state.routes.length || 1);

    const onTabbarLayout = (e: LayoutChangeEvent) => {
        setDimensions({
            height: e.nativeEvent.layout.height,
            width: e.nativeEvent.layout.width
        });
    };

    const tabPositionX = useSharedValue(0);

    useEffect(() => {
        if (state.index !== undefined) {
            tabPositionX.value = withSpring(buttonWidth * state.index, { duration: 100 });
        }
    }, [state.index, buttonWidth, tabPositionX]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{
                translateX: tabPositionX.value
            }]
        };
    });

    return (
        <View onLayout={onTabbarLayout} style={styles.tabBar}>

            <Animated.View style={
                [{
                    position: 'absolute',
                    top: 33,
                    left: -0,
                    marginHorizontal: 40,
                    width: 25,
                    height: 25,
                    borderLeftWidth: 4,
                    borderBottomWidth: 4,
                    borderColor: '#CC5500',
                    borderRadius: 5,
                }, animatedStyle]
            }>

            </Animated.View>

            <Animated.View style={
                [{
                    position: 'absolute',
                    top: 15,
                    left: 18,
                    marginHorizontal: 40,
                    width: 25,
                    height: 25,
                    borderRightWidth: 4,
                    borderTopWidth: 4,
                    borderColor: '#CC5500',
                    borderRadius: 5
                }, animatedStyle]
            }>

            </Animated.View>

            {state.routes.map((route: any, index: number) => {
                const descriptor = descriptors?.[route.key];
                const options = descriptor?.options || {};
                const rawLabel =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;
                const label = typeof rawLabel === 'string' ? rawLabel : String(rawLabel || route.name);

                const isFocused = state.index === index;

                const onPress = () => {
                    tabPositionX.value = withSpring(buttonWidth * index, { duration: 100 });

                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                return (

                    <TabBarButton
                        key={route.key}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        isFocused={isFocused}
                        routeName={route.name}
                        color={isFocused ? '#673ab7' : '#222'}
                        label={label}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: "relative",
        width: "100%",
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: "center",
        backgroundColor: "#fff",
        paddingVertical: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 20,
            height: 10
        },
        shadowRadius: 50,
        shadowOpacity: 0.5,
        elevation: 2,
    },

    leftTriangle: {
        position: 'absolute',
        bottom: 0,
        width: 12,
        height: 12,
        borderLeftWidth: 2,
        borderBottomWidth: 2,
        borderColor: '#CC5500',
        transform: [{ rotate: '-45deg' }],
    },
    rightTriangle: {
        position: 'absolute',
        bottom: 0,
        width: 12,
        height: 12,
        borderRightWidth: 2,
        borderBottomWidth: 2,
        borderColor: '#CC5500',
        transform: [{ rotate: '45deg' }],
    },

    tabBarItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5
    }
})

export default TabBar