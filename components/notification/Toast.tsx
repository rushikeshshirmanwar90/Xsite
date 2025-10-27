import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { ToastProps } from './types';

const Toast: React.FC<ToastProps> = ({ visible, message, onUndo, onHide, type = 'info' }) => {
    const translateY = useRef(new Animated.Value(100)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();

            // Auto hide after 3 seconds
            const timer = setTimeout(() => {
                hideToast();
            }, 3000);

            return () => clearTimeout(timer);
        } else {
            hideToast();
        }
    }, [visible]);

    const hideToast = () => {
        Animated.timing(translateY, {
            toValue: 100,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            onHide();
        });
    };

    if (!visible) return null;

    const getToastColor = () => {
        switch (type) {
            case 'success': return '#10B981';
            case 'error': return '#EF4444';
            default: return '#1F2937';
        }
    };

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                {
                    transform: [{ translateY }],
                    backgroundColor: getToastColor()
                }
            ]}
        >
            <Text style={styles.toastMessage}>{message}</Text>
            {onUndo && (
                <TouchableOpacity onPress={onUndo} style={styles.undoButton}>
                    <Text style={styles.undoText}>UNDO</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 1000,
    },
    toastMessage: {
        color: '#FFFFFF',
        fontSize: 14,
        flex: 1,
    },
    undoButton: {
        marginLeft: 16,
    },
    undoText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default Toast;