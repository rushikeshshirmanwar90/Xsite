import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import TabBarButton from './TabBarButton';

const TabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {

    const [dimensions, setDimensions] = useState({
        width: 20,
        height: 100
    })

    const buttonWidth = dimensions.width / state.routes.length;

    const onTabbarLayout = (e: LayoutChangeEvent) => {
        setDimensions({
            height: e.nativeEvent.layout.height,
            width: e.nativeEvent.layout.width
        })
    }

    const tabPositionX = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{
                translateX: tabPositionX.value
            }]
        }
    })


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

            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label =
                    typeof options.tabBarLabel === 'string'
                        ? options.tabBarLabel
                        : typeof options.title === 'string'
                            ? options.title
                            : route.name;

                const isFocused = state.index === index;

                const onPress = () => {

                    tabPositionX.value = withSpring(buttonWidth * index, { duration: 100 })

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

                    // eslint-disable-next-line react/jsx-key
                    <TabBarButton
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