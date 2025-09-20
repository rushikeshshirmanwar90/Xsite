// components/StaffCard.tsx
import { StaffCardProps } from '@/types/staff';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const StaffCard: React.FC<StaffCardProps> = ({ staff, onPress }) => {
    const getInitials = (firstName: string, lastName: string): string => {
        return (firstName[0] + lastName[0]).toUpperCase();
    };

    const getRandomColor = (id: number): string[] => {
        const colors = [
            ['#3B82F6', '#1D4ED8'],
            ['#10B981', '#059669'],
            ['#F59E0B', '#D97706'],
            ['#EF4444', '#DC2626'],
            ['#8B5CF6', '#7C3AED'],
            ['#06B6D4', '#0891B2'],
            ['#84CC16', '#65A30D'],
            ['#F97316', '#EA580C']
        ];
        return colors[id % colors.length];
    };

    const avatarColors = getRandomColor(staff.id);
    const fullName = `${staff.firstName} ${staff.lastName}`;

    return (
        <TouchableOpacity
            style={styles.staffCard}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.staffCardContent}>
                <View style={styles.staffInfo}>
                    <LinearGradient
                        colors={avatarColors}
                        style={styles.avatar}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.avatarText}>
                            {getInitials(staff.firstName, staff.lastName)}
                        </Text>
                    </LinearGradient>

                    <View style={styles.staffDetails}>
                        <Text style={styles.staffName}>{fullName}</Text>
                        <Text style={styles.staffRole}>{staff.role}</Text>

                        <View style={styles.contactInfo}>
                            <View style={styles.contactItem}>
                                <Ionicons name="call" size={12} color="#6B7280" />
                                <Text style={styles.contactText}>{staff.phoneNumber}</Text>
                            </View>

                            <View style={styles.contactItem}>
                                <Ionicons name="mail" size={12} color="#6B7280" />
                                <Text style={styles.contactText} numberOfLines={1}>{staff.email}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.projectsSection}>
                    <Text style={styles.projectsLabel}>
                        Assigned Projects ({staff.assignedProjects.length})
                    </Text>
                    {staff.assignedProjects.length > 0 ? (
                        <View style={styles.projectsList}>
                            {staff.assignedProjects.slice(0, 2).map((project, index) => (
                                <View key={index} style={styles.projectTag}>
                                    <Text style={styles.projectTagText} numberOfLines={1}>
                                        {project}
                                    </Text>
                                </View>
                            ))}
                            {staff.assignedProjects.length > 2 && (
                                <View style={[styles.projectTag, styles.moreProjectsTag]}>
                                    <Text style={styles.moreProjectsText}>
                                        +{staff.assignedProjects.length - 2}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <Text style={styles.noProjectsText}>No projects assigned</Text>
                    )}
                </View>
            </View>

            <View style={styles.cardAction}>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    staffCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        flexDirection: 'row',
        alignItems: 'center',
    },
    staffCardContent: {
        flex: 1,
        padding: 16,
    },
    staffInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    staffDetails: {
        flex: 1,
    },
    staffName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    staffRole: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 8,
    },
    contactInfo: {
        gap: 4,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contactText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 6,
        flex: 1,
    },
    projectsSection: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    projectsLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    projectsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    projectTag: {
        backgroundColor: '#EBF8FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        maxWidth: 120,
    },
    projectTagText: {
        fontSize: 11,
        color: '#1E40AF',
        fontWeight: '500',
    },
    moreProjectsTag: {
        backgroundColor: '#F3F4F6',
    },
    moreProjectsText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
    },
    noProjectsText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    cardAction: {
        paddingRight: 16,
        paddingLeft: 8,
    },
});

export default StaffCard;