import React, { useState } from 'react';
import AddProjectModal from '@/components/AddProjectModel';
import ProjectCard from '@/components/ProjectCard';
import styles from '@/style/project';
import { Project } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ProjectDetailsProps {
    project: Project;
    onBack: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onBack }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#3A78B5" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Project Details</Text>
                <View style={{ width: 24 }} />
            </View>
            <ScrollView style={styles.detailsContainer}>
                <Text style={styles.projectName}>{project.name}</Text>
                <Text style={styles.projectAddress}>{project.address}</Text>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Assigned To:</Text>
                    <Text style={styles.detailValue}>
                        {Array.isArray(project.assignedStaff)
                            ? project.assignedStaff
                                .map((staff) => (typeof staff === 'string' ? staff : staff.fullName))
                                .filter(Boolean)
                                .join(', ')
                            : (typeof project.assignedStaff === 'string' ? project.assignedStaff : 'Unassigned')}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: project.status === 'active' ? '#DCFCE7' : project.status === 'planning' ? '#FEF3C7' : '#C4D8FC' }]}>
                        <Text style={[styles.statusText, { color: project.status === 'active' ? '#166534' : project.status === 'planning' ? '#92400E' : '#1E40AF' }]}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </Text>
                    </View>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Progress:</Text>
                    <Text style={styles.detailValue}>{project.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Materials Summary</Text>
                    <View style={styles.metricsContainer}>
                        <View style={styles.metricItem}>
                            <Text style={styles.metricValue}>{project.totalMaterials}</Text>
                            <Text style={styles.metricLabel}>Total</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Text style={styles.metricValue}>{project.materialsReceived}</Text>
                            <Text style={styles.metricLabel}>Received</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Text style={styles.metricValue}>{project.materialsIssued}</Text>
                            <Text style={styles.metricLabel}>Issued</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activities</Text>
                    {project.recentActivities.map((activity, index) => (
                        <View key={index} style={styles.activityItem}>
                            <View style={styles.activityIcon}>
                                <Ionicons
                                    name={activity.type === 'received' ? 'download' : activity.type === 'issued' ? 'send' : 'cart'}
                                    size={16}
                                    color="#6B7280"
                                />
                            </View>
                            <View style={styles.activityContent}>
                                <Text style={styles.activityText}>
                                    {activity.material} ({activity.quantity}) - {activity.date}
                                </Text>
                                <Text style={styles.activityType}>
                                    {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const handleViewDetails = (project: Project) => {
        setSelectedProject(project);
    };

    const handleAddProject = (newProject: Omit<Project, 'id'>) => {
        const projectWithId: Project = {
            ...newProject,
            id: projects.length + 1
        };
        setProjects([...projects, projectWithId]);
    };

    if (selectedProject) {
        return (
            <ProjectDetails
                project={selectedProject}
                onBack={() => setSelectedProject(null)}
            />
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Construction Materials</Text>
                <Text style={styles.headerSubtitle}>Project Management</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddModal(true)}
                >
                    <View style={[styles.addButtonGradient, { backgroundColor: '#3A78B5' }]}>
                        <Ionicons name="add" size={20} color="white" />
                        <Text style={styles.addButtonText}>Add Project</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.projectsList}>
                {projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        onViewDetails={handleViewDetails}
                    />
                ))}
            </ScrollView>

            <AddProjectModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddProject}
            />
        </SafeAreaView>
    );
};

export default App;