import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface StatCardProps {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
    value: number | string;
    label: string;
    style?: StyleProp<ViewStyle>;
}

const StatCard: React.FC<StatCardProps> = ({ icon, color, value, label, style }) => {
    return (
        <View style={[styles.card, style]}>
            <View style={[styles.iconCircle, { backgroundColor: `${color}1A` }]}>
                <Ionicons name={icon} size={16} color={color} />
            </View>
            <View style={styles.textBlock}>
                <Text style={styles.value} numberOfLines={1}>{value}</Text>
                <Text style={styles.label} numberOfLines={1}>{label}</Text>
            </View>
        </View>
    );
};

export default StatCard;

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 10,
        minWidth: 140,
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textBlock: {
        flexShrink: 1,
    },
    value: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.3,
    },
    label: {
        fontSize: 10.5,
        fontWeight: '600',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
});
