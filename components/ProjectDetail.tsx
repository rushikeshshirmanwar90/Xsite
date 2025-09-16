import AddProjectModal from '@/components/AddProjectModel';
import ProjectCard from '@/components/ProjectCard';
import styles from '@/style/project';
import { Project } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';

interface ProjectDetailsProps {
    project: Project;
    onBack: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onBack }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#3B82F6" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Project Details</Text>
                <View style={{ width: 24 }} />
            </View>
            <ScrollView style={styles.detailsContainer}>
                <Text style={styles.projectName}>{project.name}</Text>
                <Text style={styles.projectAddress}>{project.address}</Text>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Assigned To:</Text>
                    <Text style={styles.detailValue}>{project.assignedStaff}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: project.status === 'active' ? '#DCFCE7' : project.status === 'planning' ? '#FEF3C7' : '#DBEAFE' }]}>
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

const dummyProjects: Project[] = [
    {
        id: 1,
        name: "Manthan Tower A",
        address: "Baner Road, Pune, Maharashtra 411045",
        assignedStaff: "Rajesh Kumar",
        status: "active",
        startDate: "2024-10-01",
        endDate: "2026-03-01",
        progress: 45,
        totalMaterials: 156,
        materialsReceived: 124,
        materialsIssued: 89,
        recentActivities: [
            { type: "received", material: "Modular Bricks", quantity: "10,000 pcs", date: "2024-09-10" },
            { type: "issued", material: "Cement Bags", quantity: "150 bags", date: "2024-09-09" },
            { type: "ordered", material: "Steel Bars", quantity: "5 tons", date: "2024-09-08" }
        ]
    },
    {
        id: 2,
        name: "Skyline Apartments B",
        address: "Hinjewadi Phase 2, Pune, Maharashtra 411057",
        assignedStaff: "Priya Sharma",
        status: "active",
        startDate: "2024-08-15",
        endDate: "2025-12-15",
        progress: 65,
        totalMaterials: 203,
        materialsReceived: 189,
        materialsIssued: 156,
        recentActivities: [
            { type: "received", material: "Ready Mix Concrete", quantity: "50 m³", date: "2024-09-12" },
            { type: "issued", material: "Sand", quantity: "25 m³", date: "2024-09-11" },
            { type: "ordered", material: "Tiles", quantity: "2,000 sq ft", date: "2024-09-10" }
        ]
    },
    {
        id: 3,
        name: "Metro Plaza Complex",
        address: "Wakad, Pune, Maharashtra 411057",
        assignedStaff: "Amit Patel",
        status: "planning",
        startDate: "2024-11-01",
        endDate: "2026-08-01",
        progress: 15,
        totalMaterials: 89,
        materialsReceived: 12,
        materialsIssued: 8,
        recentActivities: [
            { type: "ordered", material: "Foundation Steel", quantity: "15 tons", date: "2024-09-13" },
            { type: "received", material: "Survey Equipment", quantity: "1 set", date: "2024-09-12" }
        ]
    },
    {
        id: 4,
        name: "Green Valley Villas",
        address: "Kothrud, Pune, Maharashtra 411038",
        assignedStaff: "Sneha Reddy",
        status: "active",
        startDate: "2024-06-01",
        endDate: "2025-10-01",
        progress: 78,
        totalMaterials: 178,
        materialsReceived: 165,
        materialsIssued: 142,
        recentActivities: [
            { type: "issued", material: "Paint", quantity: "200 liters", date: "2024-09-13" },
            { type: "received", material: "Door Frames", quantity: "45 units", date: "2024-09-12" },
            { type: "issued", material: "Electrical Wires", quantity: "500 meters", date: "2024-09-11" }
        ]
    }
];

const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>(dummyProjects);
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
                    <LinearGradient
                        colors={['#3B82F6', '#8B5CF6']}
                        style={styles.addButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="add" size={20} color="white" />
                        <Text style={styles.addButtonText}>Add Project</Text>
                    </LinearGradient>
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