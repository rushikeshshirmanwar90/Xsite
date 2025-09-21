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
    ] as const;

    // Robust gradient selection: support string or number _id
    const idNumber = typeof project._id === 'number'
        ? project._id
        : typeof project._id === 'string'
            ? (project._id as string).split('').reduce((acc: number, ch: string) => acc + ch.charCodeAt(0), 0)
            : 0;
    const gradient = gradients[idNumber % gradients.length];

    return (
        <View style={styles.card}>
            <LinearGradient
                colors={gradient}
                style={styles.cardHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
            </LinearGradient>

            <View style={styles.cardBody}>
                <Text style={styles.projectTitle}>{project.name}</Text>

                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>{project.address}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoTextBold}>
                        {Array.isArray(project.assignedStaff) && project.assignedStaff.length > 0
                            ? project.assignedStaff.length === 1
                                ? `${project.assignedStaff.length} staff member assigned`
                                : `${project.assignedStaff.length} staff members assigned`
                            : 'No staff assigned'
                        }
                    </Text>
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
    );
};

export default ProjectCard;