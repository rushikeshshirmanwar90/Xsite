import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const LoadingState: React.FC = () => {
    return (
        <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingTitle}>Loading notifications...</Text>
            <Text style={styles.loadingMessage}>
                Fetching material requests and updates
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    loadingState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 32,
        flex: 1,
    },
    loadingTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    loadingMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default LoadingState;