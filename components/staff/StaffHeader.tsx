// components/StaffHeader.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface StaffHeaderProps {
    staffCount: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddPress: () => void;
}

const StaffHeader: React.FC<StaffHeaderProps> = ({
    staffCount,
    searchQuery,
    onSearchChange,
    onAddPress,
}) => {
    return (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <View>
                    <Text style={styles.headerTitle}>Staff Management</Text>
                    <Text style={styles.headerSubtitle}>
                        {staffCount} staff member{staffCount !== 1 ? 's' : ''}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={onAddPress}
                >
                    <LinearGradient
                        colors={['#3B82F6', '#8B5CF6']}
                        style={styles.addButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="add" size={20} color="white" />
                        <Text style={styles.addButtonText}>Add Staff</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search staff members..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={onSearchChange}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => onSearchChange('')}>
                        <Ionicons name="close-circle" size={20} color="#6B7280" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    addButton: {
        borderRadius: 8,
    },
    addButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    addButtonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 6,
        fontSize: 14,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
});

export default StaffHeader;