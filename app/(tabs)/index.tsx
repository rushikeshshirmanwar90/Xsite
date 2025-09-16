// App.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

// Types
interface Project {
    id: number;
    name: string;
    address: string;
    assignedStaff: string;
    status: 'active' | 'planning' | 'completed';
    startDate: string;
    endDate: string;
    progress: number;
    totalMaterials: number;
    materialsReceived: number;
    materialsIssued: number;
    recentActivities: Activity[];
}

interface Activity {
    type: 'received' | 'issued' | 'ordered';
    material: string;
    quantity: string;
    date: string;
}

// Dummy data
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

const staffMembers: string[] = [
    "Rajesh Kumar",
    "Priya Sharma",
    "Amit Patel",
    "Sneha Reddy",
    "Vikram Singh",
    "Kavya Nair",
    "Rohit Gupta"
];

// Project Card Component
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

// Add Project Modal Component
interface AddProjectModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (project: Omit<Project, 'id'>) => void;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ visible, onClose, onAdd }) => {
    const [projectName, setProjectName] = useState('');
    const [projectAddress, setProjectAddress] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [showStaffDropdown, setShowStaffDropdown] = useState(false);

    const handleSubmit = () => {
        if (projectName && projectAddress && assignedTo) {
            const newProject: Omit<Project, 'id'> = {
                name: projectName,
                address: projectAddress,
                assignedStaff: assignedTo,
                status: 'planning',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                progress: 0,
                totalMaterials: 0,
                materialsReceived: 0,
                materialsIssued: 0,
                recentActivities: []
            };
            onAdd(newProject);
            setProjectName('');
            setProjectAddress('');
            setAssignedTo('');
            onClose();
        } else {
            Alert.alert('Error', 'Please fill all fields');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add New Project</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Project Name</Text>
                        <TextInput
                            style={styles.input}
                            value={projectName}
                            onChangeText={setProjectName}
                            placeholder="Enter project name"
                        />

                        <Text style={styles.label}>Project Address</Text>
                        <TextInput
                            style={styles.input}
                            value={projectAddress}
                            onChangeText={setProjectAddress}
                            placeholder="Enter project address"
                            multiline
                            numberOfLines={2}
                        />

                        <Text style={styles.label}>Assign To</Text>
                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() => setShowStaffDropdown(!showStaffDropdown)}
                        >
                            <Text style={assignedTo ? styles.dropdownText : styles.dropdownPlaceholder}>
                                {assignedTo || 'Select staff member'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#6B7280" />
                        </TouchableOpacity>

                        {showStaffDropdown && (
                            <View style={styles.dropdownList}>
                                {staffMembers.map((staff, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            setAssignedTo(staff);
                                            setShowStaffDropdown(false);
                                        }}
                                    >
                                        <Text style={styles.dropdownItemText}>{staff}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
                            <LinearGradient
                                colors={['#3B82F6', '#8B5CF6']}
                                style={styles.addButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.addButtonText}>Add Project</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Main App Component
const Index: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>(dummyProjects);
    const [showAddModal, setShowAddModal] = useState(false);

    const router = useRouter();

    const handleViewDetails = (project: Project) => {
        // Navigate to the details page outside the (tabs) group
        router.push({
            pathname: '../details',
            params: {
                projectId: project.id.toString(),
                projectData: JSON.stringify(project) // Pass entire project as string
            }
        });
    };

    const handleAddProject = (newProject: Omit<Project, 'id'>) => {
        const projectWithId: Project = {
            ...newProject,
            id: projects.length + 1
        };
        setProjects([...projects, projectWithId]);
    };

    // Navigation is now handled by the router

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

export default Index;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 25,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 20,
    },
    addButton: {
        alignSelf: 'flex-end',
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
        marginLeft: 8,
    },
    projectsList: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        height: 120,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        padding: 16,
        justifyContent: 'space-between',
    },
    cardHeaderContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    progressText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'right',
    },
    cardBody: {
        padding: 20,
    },
    projectTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    infoTextBold: {
        marginLeft: 8,
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
        flex: 1,
    },
    progressContainer: {
        marginTop: 16,
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    progressValue: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    viewButton: {
        borderRadius: 8,
    },
    viewButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    viewButtonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    form: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: '#F9FAFB',
    },
    dropdown: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        marginBottom: 16,
    },
    dropdownText: {
        fontSize: 16,
        color: '#374151',
    },
    dropdownPlaceholder: {
        fontSize: 16,
        color: '#9CA3AF',
    },
    dropdownList: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        backgroundColor: 'white',
        marginTop: -16,
        marginBottom: 16,
        maxHeight: 200,
    },
    dropdownItem: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#374151',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        marginRight: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    },
    detailsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        marginRight: 16,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    detailsContent: {
        flex: 1,
    },
    projectHeader: {
        padding: 24,
        alignItems: 'center',
    },
    projectHeaderTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 8,
    },
    projectHeaderSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    statCard: {
        width: '48%',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
        marginRight: '2%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        textAlign: 'center',
    },
    section: {
        backgroundColor: 'white',
        margin: 20,
        marginTop: 8,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    infoTable: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tableLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    tableValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    activityContent: {
        flex: 1,
        marginLeft: 12,
    },
    activityMaterial: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    activityQuantity: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 2,
    },
    activityDate: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    }
})