import styles from '@/style/project';
import { Project } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ProjectCardProps {
    project: Project;
    onViewDetails: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onViewDetails }) => {
    const gradients = [
        ['#3B82F6', '#8B5CF6'],
        ['#10B981', '#14B8A6'],
        ['#F59E0B', '#EF4444'],
        ['#8B5CF6', '#EC4899'],
        ['#14B8A6', '#3B82F6']
    ];

    const gradient = gradients[project.id % gradients.length];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return { bg: '#DCFCE7', text: '#166534' };
            case 'planning': return { bg: '#FEF3C7', text: '#92400E' };
            case 'completed': return { bg: '#DBEAFE', text: '#1E40AF' };
            default: return { bg: '#F3F4F6', text: '#374151' };
        }
    };

    const statusColor = getStatusColor(project.status);

    return (
        <View style={styles.card}>
            <LinearGradient
                colors={gradient}
                style={styles.cardHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.cardHeaderContent}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                        <Text style={[styles.statusText, { color: statusColor.text }]}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </Text>
                    </View>
                    <Text style={styles.progressText}>{project.progress}% Complete</Text>
                </View>
            </LinearGradient>

            <View style={styles.cardBody}>
                <Text style={styles.projectTitle}>{project.name}</Text>

                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>{project.address}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoTextBold}>{project.assignedStaff}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>
                        {new Date(project.startDate).toLocaleDateString('en-IN')} - {new Date(project.endDate).toLocaleDateString('en-IN')}
                    </Text>
                </View>

                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <Text style={styles.progressValue}>{project.progress}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <LinearGradient
                            colors={['#3B82F6', '#8B5CF6']}
                            style={[styles.progressFill, { width: `${project.progress}%` }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => onViewDetails(project)}
                >
                    <LinearGradient
                        colors={['#3B82F6', '#8B5CF6']}
                        style={styles.viewButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="eye-outline" size={18} color="white" />
                        <Text style={styles.viewButtonText}>View Details</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ProjectCard;