// App.tsx
import { Ionicons } from '@expo/vector-icons';
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

// Utility function to generate initials from company name
const generateInitials = (companyName: string): string => {
    if (!companyName) return 'XX';
    
    const words = companyName
        .split(/[\s\-_&]+/)
        .filter(word => word.length > 0)
        .map(word => word.trim());
    
    if (words.length === 0) return 'XX';
    
    if (words.length === 1) {
        const word = words[0];
        return word.length >= 2 ? word.substring(0, 2).toUpperCase() : word.toUpperCase();
    }
    
    const skipWords = ['and', 'the', 'of', 'in', 'at', 'on', '&'];
    const significantWords = words.filter(word => 
        !skipWords.includes(word.toLowerCase()) && word.length > 0
    );
    
    if (significantWords.length === 0) {
        return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
    }
    
    return significantWords
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();
};

// Company configuration
const COMPANY_CONFIG = {
    name: "Sharda Constructions",
    subtitle: "Project Management"
};

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
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return { bg: '#06B6D4', text: '#ffffff' }; // Cyan 500
            case 'planning': return { bg: '#8B5CF6', text: '#ffffff' }; // Violet 500
            case 'completed': return { bg: '#10B981', text: '#ffffff' }; // Emerald 500
            default: return { bg: '#6B7280', text: '#ffffff' };
        }
    };

    const statusColor = getStatusColor(project.status);

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderTop}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                        <Text style={[styles.statusText, { color: statusColor.text }]}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </Text>
                    </View>
                    <Text style={styles.progressText}>{project.progress}% Complete</Text>
                </View>
                <Text style={styles.projectTitle}>{project.name}</Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="location-outline" size={18} color="#F59E0B" />
                    </View>
                    <Text style={styles.infoText} numberOfLines={2}>{project.address}</Text>
                </View>

                <View style={styles.infoRow}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="person-outline" size={18} color="#06B6D4" />
                    </View>
                    <Text style={styles.infoTextBold}>{project.assignedStaff}</Text>
                </View>

                <View style={styles.infoRow}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="calendar-outline" size={18} color="#8B5CF6" />
                    </View>
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
                        <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => onViewDetails(project)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-forward" size={18} color="white" />
                    <Text style={styles.viewButtonText}>View Details</Text>
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

// const AddProjectModal: React.FC<AddProjectModalProps> = ({ visible, onClose, onAdd }) => {
//     const [projectName, setProjectName] = useState('');
//     const [projectAddress, setProjectAddress] = useState('');
//     const [assignedTo, setAssignedTo] = useState('');
//     const [showStaffDropdown, setShowStaffDropdown] = useState(false);

//     const handleSubmit = () => {
//         if (projectName && projectAddress && assignedTo) {
//             const newProject: Omit<Project, 'id'> = {
//                 name: projectName,
//                 address: projectAddress,
//                 assignedStaff: assignedTo,
//                 status: 'planning',
//                 startDate: new Date().toISOString().split('T')[0],
//                 endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//                 progress: 0,
//                 totalMaterials: 0,
//                 materialsReceived: 0,
//                 materialsIssued: 0,
//                 recentActivities: []
//             };
//             onAdd(newProject);
//             setProjectName('');
//             setProjectAddress('');
//             setAssignedTo('');
//             onClose();
//         } else {
//             Alert.alert('Error', 'Please fill all fields');
//         }
//     };

//     return (
//         <Modal visible={visible} animationType="slide" transparent>
//             <View style={styles.modalOverlay}>
//                 <View style={styles.modalContent}>
//                     <View style={styles.modalHeader}>
//                         <Text style={styles.modalTitle}>Add New Project</Text>
//                         <TouchableOpacity onPress={onClose}>
//                             <Ionicons name="close" size={24} color="#374151" />
//                         </TouchableOpacity>
//                     </View>

//                     <View style={styles.form}>
//                         <Text style={styles.label}>Project Name</Text>
//                         <TextInput
//                             style={styles.input}
//                             value={projectName}
//                             onChangeText={setProjectName}
//                             placeholder="Enter project name"
//                             placeholderTextColor="#9CA3AF"
//                         />

//                         <Text style={styles.label}>Project Address</Text>
//                         <TextInput
//                             style={styles.input}
//                             value={projectAddress}
//                             onChangeText={setProjectAddress}
//                             placeholder="Enter project address"
//                             placeholderTextColor="#9CA3AF"
//                             multiline
//                             numberOfLines={2}
//                         />

//                         <Text style={styles.label}>Assign To</Text>
//                         <TouchableOpacity
//                             style={styles.dropdown}
//                             onPress={() => setShowStaffDropdown(!showStaffDropdown)}
//                         >
//                             <Text style={assignedTo ? styles.dropdownText : styles.dropdownPlaceholder}>
//                                 {assignedTo || 'Select staff member'}
//                             </Text>
//                             <Ionicons name="chevron-down" size={20} color="#06B6D4" />
//                         </TouchableOpacity>

//                         {showStaffDropdown && (
//                             <View style={styles.dropdownList}>
//                                 {staffMembers.map((staff, index) => (
//                                     <TouchableOpacity
//                                         key={index}
//                                         style={styles.dropdownItem}
//                                         onPress={() => {
//                                             setAssignedTo(staff);
//                                             setShowStaffDropdown(false);
//                                         }}
//                                     >
//                                         <Text style={styles.dropdownItemText}>{staff}</Text>
//                                     </TouchableOpacity>
//                                 ))}
//                             </View>
//                         )}
//                     </View>

//                     <View style={styles.modalActions}>
//                         <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
//                             <Text style={styles.cancelButtonText}>Cancel</Text>
//                         </TouchableOpacity>
//                         <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
//                             <Text style={styles.addButtonText}>Add Project</Text>
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//             </View>
//         </Modal>
//     );
// };

// Main App Component
const Index: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>(dummyProjects);
    const [showAddModal, setShowAddModal] = useState(false);

    const router = useRouter();
    const companyInitials = generateInitials(COMPANY_CONFIG.name);

    const handleViewDetails = (project: Project) => {
        router.push({
            pathname: '../details',
            params: {
                projectId: project.id.toString(),
                projectData: JSON.stringify(project)
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />

            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>{companyInitials}</Text>
                        </View>
                        <View style={styles.userDetails}>
                            <Text style={styles.userName}>{COMPANY_CONFIG.name}</Text>
                            <Text style={styles.userSubtitle}>{COMPANY_CONFIG.subtitle}</Text>
                        </View>
                    </View>
                </View>
                
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{projects.length}</Text>
                        <Text style={styles.statLabel}>Total Projects</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{projects.filter(p => p.status === 'active').length}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{projects.filter(p => p.status === 'completed').length}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Projects</Text>
            </View>

            <ScrollView 
                style={styles.projectsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.projectsListContent}
            >
                {projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        onViewDetails={handleViewDetails}
                    />
                ))}
                
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Powered by Exponentor</Text>
                    <View style={styles.footerDivider} />
                    <Text style={styles.footerSubtext}>Building the future, one project at a time</Text>
                </View>
            </ScrollView>

            {/* <AddProjectModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddProject}
            /> */}
        </SafeAreaView>
    );
};

export default Index;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC', // Slate 50 - Clean, light background
    },
    header: {
        backgroundColor: '#ffffffff', // Keep original header color as requested
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
        // borderBottomLeftRadius: 24,
        // borderBottomRightRadius: 24,
        // shadowColor: '#1e40af',
        // shadowOffset: { width: 0, height: 4 },
        // shadowOpacity: 0.15,
        // shadowRadius: 8,
        // elevation: 8,
    },
    headerContent: {
        marginBottom: 20,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 52,
        height: 52,
        backgroundColor: '#ffffff',
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    avatarText: {
        color: '#F59E0B', // Amber 500 - Warm and energetic
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'System',
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000000ff',
        fontFamily: 'System',
        marginBottom: 4,
    },
    userSubtitle: {
        fontSize: 14,
        color: '#3d3d3dff',
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: 16,
        padding: 16,
        backdropFilter: 'blur(10px)',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '800',
        color: '#000000ff',
        fontFamily: 'System',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#000000ff',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1.5,
        backgroundColor: 'rgba(0, 0, 0, 0.47)',
        marginHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#374151', // Gray 700 - Professional dark text
        fontFamily: 'System',
    },
    addProjectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0000', // Cyan 500 - Fresh and modern
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    addProjectButtonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 6,
        fontSize: 14,
    },
    projectsList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    projectsListContent: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20, // Slightly more rounded
        marginBottom: 16,
        shadowColor: '#E5E7EB', // Gray 200 - Softer shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6', // Gray 100 - Very subtle border
    },
    cardHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB', // Gray 50
    },
    cardHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#059669', // Emerald 600 - Success green
    },
    projectTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151', // Gray 700
        fontFamily: 'System',
    },
    cardBody: {
        padding: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    iconContainer: {
        width: 36, // Slightly larger
        height: 36,
        backgroundColor: '#FEF3C7', // Amber 100 - Soft background
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    infoText: {
        fontSize: 14,
        color: '#6B7280', // Gray 500
        flex: 1,
        lineHeight: 20,
    },
    infoTextBold: {
        fontSize: 14,
        color: '#374151', // Gray 700
        fontWeight: '600',
        flex: 1,
    },
    progressContainer: {
        marginTop: 20,
        marginBottom: 24,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    progressLabel: {
        fontSize: 14,
        color: '#6B7280', // Gray 500
        fontWeight: '600',
    },
    progressValue: {
        fontSize: 14,
        color: '#059669', // Emerald 600
        fontWeight: '700',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E5E7EB', // Gray 200
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#06B6D4', // Cyan 500 - Beautiful progress color
        borderRadius: 4,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#303030ff', // Violet 500 - Eye-catching action color
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000000ff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    viewButtonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 15,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 40,
        marginTop: 20,
    },
    footerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F59E0B', // Amber 500 - Warm brand color
        marginBottom: 8,
    },
    footerDivider: {
        width: 40,
        height: 2,
        backgroundColor: '#FCD34D', // Amber 300 - Lighter amber
        marginBottom: 8,
        borderRadius: 1,
    },
    footerSubtext: {
        fontSize: 13,
        color: '#6B7280', // Gray 500
        fontStyle: 'italic',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(139, 92, 246, 0.3)', // Violet with opacity - softer overlay
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 24, // More rounded
        padding: 28,
        width: '90%',
        maxHeight: '80%',
        shadowColor: '#8B5CF6', // Violet shadow
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: '#F3F4F6', // Gray 100
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#374151', // Gray 700
    },
    form: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#059669', // Emerald 600 - Fresh green
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        borderWidth: 2,
        borderColor: '#E5E7EB', // Gray 200
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#F9FAFB', // Gray 50
        color: '#374151', // Gray 700
        fontWeight: '500',
    },
    dropdown: {
        borderWidth: 2,
        borderColor: '#E5E7EB', // Gray 200
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB', // Gray 50
        marginBottom: 20,
    },
    dropdownText: {
        fontSize: 16,
        color: '#374151', // Gray 700
        fontWeight: '500',
    },
    dropdownPlaceholder: {
        fontSize: 16,
        color: '#9CA3AF', // Gray 400
    },
    dropdownList: {
        borderWidth: 2,
        borderColor: '#E5E7EB', // Gray 200
        borderRadius: 12,
        backgroundColor: 'white',
        marginTop: -20,
        marginBottom: 20,
        maxHeight: 200,
        shadowColor: '#6B7280', // Gray 500
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    dropdownItem: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6', // Gray 100
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#374151', // Gray 700
        fontWeight: '500',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB', // Gray 200
        alignItems: 'center',
        backgroundColor: '#F9FAFB', // Gray 50
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#6B7280', // Gray 500
        fontWeight: '600',
    },
    addButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: 'black', // Emerald 500 - Fresh success color
        shadowColor: '#0c0c0cff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    addButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: '700',
    }});