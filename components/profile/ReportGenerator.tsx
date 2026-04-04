import { domain } from '@/lib/domain';
import { getClientId } from '@/functions/clientId';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    ScrollView,
    TextInput
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PDFReportGenerator } from '@/utils/pdfReportGenerator';

interface ReportGeneratorProps {
    visible: boolean;
    onClose: () => void;
    clientData: any;
    userData: any;
}

type ActivityFilter = 'all' | 'imported' | 'used' | 'transferred';

interface Section {
    _id: string;
    sectionId: string;
    name: string;
    miniSections?: MiniSection[];
}

interface MiniSection {
    _id: string;
    name: string;
}

interface Project {
    _id: string;
    name: string;
    createdAt: string;
    section?: Section[];
}

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

interface ProjectsResponse {
    projects: Project[];
}

interface MaterialActivityResponse {
    activities: any[];
    summary: {
        totalCost: number;
    };
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
    visible,
    onClose,
    clientData,
    userData
}) => {
    const [startDate, setStartDate] = useState<Date>(() => {
        // Default to 1 year ago to capture all activities
        const date = new Date();
        date.setFullYear(date.getFullYear() - 1);
        return date;
    });
    
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
    const [selectedProjectId, setSelectedProjectId] = useState<string>(''); // Will be set to first project when loaded
    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [generating, setGenerating] = useState(false);
    
    // Section selection state
    const [selectedSections, setSelectedSections] = useState<string[]>([]);
    const [showSectionSelector, setShowSectionSelector] = useState(false);
    const [projectSections, setProjectSections] = useState<Section[]>([]);

    // Fetch projects when modal opens
    useEffect(() => {
        if (visible) {
            fetchProjects();
        }
    }, [visible]);

    const fetchProjects = async () => {
        try {
            setLoadingProjects(true);
            
            const clientId = await getClientId();
            if (!clientId) {
                console.warn('No client ID found for fetching projects');
                return;
            }

            console.log('📋 Fetching projects for client:', clientId);
            
            const response = await axios.get<ApiResponse<ProjectsResponse>>(`${domain}/api/client-projects?clientId=${clientId}`);
            
            if (response.data.success && response.data.data) {
                const projectsList = response.data.data.projects;
                setProjects(projectsList);
                
                // Auto-select first project if no project is selected and projects exist
                if (projectsList.length > 0 && !selectedProjectId) {
                    setSelectedProjectId(projectsList[0]._id);
                    // Fetch sections for the first project
                    await fetchProjectSections(projectsList[0]._id);
                }
                
                console.log('✅ Loaded projects:', projectsList.length);
            } else {
                console.error('Failed to fetch projects:', response.data.error);
                setProjects([]);
            }
        } catch (error: any) {
            console.error('Error fetching projects:', error);
            setProjects([]);
        } finally {
            setLoadingProjects(false);
        }
    };

    const fetchProjectSections = async (projectId: string) => {
        try {
            const clientId = await getClientId();
            if (!clientId) return;

            console.log('📋 Fetching sections for project:', projectId);
            
            const response = await axios.get<ApiResponse<any>>(`${domain}/api/project?id=${projectId}&clientId=${clientId}`);
            
            if (response.data.success && response.data.data) {
                const project = response.data.data;
                const sections = project.section || [];
                setProjectSections(sections);
                
                // Auto-select all sections by default
                if (sections.length > 0) {
                    setSelectedSections(sections.map((s: Section) => s.sectionId || s._id));
                } else {
                    setSelectedSections([]);
                }
                
                console.log('✅ Loaded sections:', sections.length);
            }
        } catch (error: any) {
            console.error('Error fetching project sections:', error);
            setProjectSections([]);
            setSelectedSections([]);
        }
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleStartDateChange = (event: any, selectedDate?: Date) => {
        setShowStartDatePicker(false);
        if (selectedDate) {
            // Ensure start date is not after end date
            if (selectedDate <= endDate) {
                setStartDate(selectedDate);
            } else {
                Alert.alert('Invalid Date', 'Start date cannot be after end date.');
            }
        }
    };

    const handleEndDateChange = (event: any, selectedDate?: Date) => {
        setShowEndDatePicker(false);
        if (selectedDate) {
            // Ensure end date is not before start date
            if (selectedDate >= startDate) {
                setEndDate(selectedDate);
            } else {
                Alert.alert('Invalid Date', 'End date cannot be before start date.');
            }
        }
    };

    const generateReport = async () => {
        try {
            // Validate that a project is selected
            if (!selectedProjectId) {
                Alert.alert('Project Required', 'Please select a project to generate the report.');
                return;
            }

            // Check if project has multiple sections and if any are selected
            if (projectSections.length > 1 && selectedSections.length === 0) {
                Alert.alert(
                    'Section Required', 
                    'This project has multiple sections. Please select at least one section to generate the report.',
                    [{ text: 'OK' }]
                );
                return;
            }

            setGenerating(true);
            
            console.log('\n========================================');
            console.log('📊 GENERATING MATERIAL ACTIVITY REPORT');
            console.log('========================================');
            console.log('Report Parameters:');
            console.log('  - Start Date:', startDate.toISOString().split('T')[0]);
            console.log('  - End Date:', endDate.toISOString().split('T')[0]);
            console.log('  - Activity Filter:', activityFilter);
            console.log('  - Project Filter:', selectedProjectId);
            console.log('  - Selected Sections:', selectedSections);
            console.log('  - Client Data:', clientData?.companyName || 'N/A');
            console.log('  - User Data:', userData?.name || 'N/A');

            // Get client ID
            const clientId = await getClientId();
            if (!clientId) {
                Alert.alert('Error', 'Client ID not found. Please login again.');
                return;
            }

            console.log('  - Client ID:', clientId);

            // Build API parameters
            const params = new URLSearchParams({
                clientId,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                activity: activityFilter
            });

            // Add project filter if specific project is selected
            if (selectedProjectId && selectedProjectId !== '') {
                params.append('projectId', selectedProjectId);
            }

            // Add section filters only if there are multiple sections and specific sections are selected
            // NOTE: Section filter applies ONLY to "used" materials, not "imported" materials
            // Imported materials are project-wide and not section-specific
            if (projectSections.length > 1 && selectedSections.length > 0 && selectedSections.length < projectSections.length) {
                selectedSections.forEach(sectionId => {
                    params.append('sectionIds', sectionId);
                });
                console.log('  - Section filter will apply to USED materials only (imported materials are project-wide)');
            }

            console.log('🌐 API Request URL:', `${domain}/api/material-activity-report?${params.toString()}`);

            // Fetch material activity data
            const response = await axios.get<ApiResponse<MaterialActivityResponse>>(`${domain}/api/material-activity-report?${params.toString()}`);
            
            console.log('✅ API Response received');
            console.log('  - Success:', response.data.success);
            console.log('  - Activities Count:', response.data.data?.activities?.length || 0);
            console.log('  - Summary:', response.data.data?.summary);

            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to fetch report data');
            }

            const { activities, summary } = response.data.data!;

            // Fetch labor data from project
            console.log('🔍 Fetching labor data for project:', selectedProjectId);
            let laborData: any[] = [];
            
            try {
                const projectResponse = await axios.get<ApiResponse<any>>(`${domain}/api/project?id=${selectedProjectId}&clientId=${clientId}`);
                if (projectResponse.data.success && projectResponse.data.data) {
                    const project = projectResponse.data.data;
                    laborData = project.Labors || [];
                    
                    // Filter labor data by selected sections only if there are multiple sections
                    if (projectSections.length > 1 && selectedSections.length > 0 && selectedSections.length < projectSections.length && laborData.length > 0) {
                        laborData = laborData.filter((labor: any) => 
                            selectedSections.includes(labor.sectionId) || 
                            selectedSections.includes(labor.miniSectionId)
                        );
                    }
                    
                    console.log('✅ Labor data fetched:', laborData.length, 'entries');
                } else {
                    console.warn('⚠️ Could not fetch project labor data');
                }
            } catch (laborError) {
                console.error('❌ Error fetching labor data:', laborError);
                // Continue without labor data
            }

            // Fetch equipment data from project
            console.log('🔍 Fetching equipment data for project:', selectedProjectId);
            let equipmentData: any[] = [];
            
            try {
                const equipmentResponse = await axios.get<ApiResponse<any>>(`${domain}/api/equipment?projectId=${selectedProjectId}`);
                console.log('🔍 Equipment API Response:', equipmentResponse.data);
                
                if (equipmentResponse.data.success && equipmentResponse.data.data && equipmentResponse.data.data.equipment) {
                    equipmentData = equipmentResponse.data.data.equipment;
                    
                    // Filter equipment data by selected sections only if there are multiple sections
                    if (projectSections.length > 1 && selectedSections.length > 0 && selectedSections.length < projectSections.length && equipmentData.length > 0) {
                        equipmentData = equipmentData.filter((equipment: any) => 
                            selectedSections.includes(equipment.sectionId) || 
                            selectedSections.includes(equipment.miniSectionId)
                        );
                    }
                    
                    console.log('✅ Equipment data fetched:', equipmentData.length, 'entries');
                    console.log('✅ Equipment data sample:', equipmentData.slice(0, 2));
                } else {
                    console.warn('⚠️ Could not fetch project equipment data');
                    console.warn('⚠️ Response structure:', equipmentResponse.data);
                }
            } catch (equipmentError) {
                console.error('❌ Error fetching equipment data:', equipmentError);
                // Continue without equipment data
            }

            if (!activities || activities.length === 0) {
                // Check if we have labor data or equipment data even if no material activities
                if (laborData.length === 0 && equipmentData.length === 0) {
                    Alert.alert(
                        'No Data Found',
                        `No material activities, labor entries, or equipment entries found for the selected period${selectedSections.length > 0 ? ' and sections' : ''} (${formatDate(startDate)} to ${formatDate(endDate)}).`,
                        [
                            { text: 'OK' },
                            {
                                text: 'Extend Range',
                                onPress: () => {
                                    // Extend date range to last 90 days
                                    const newStartDate = new Date();
                                    newStartDate.setDate(newStartDate.getDate() - 90);
                                    setStartDate(newStartDate);
                                }
                            }
                        ]
                    );
                    return;
                }
            }

            console.log('📄 Generating PDF with activities:', activities.length, ', labor entries:', laborData.length, ', and equipment entries:', equipmentData.length);
            console.log('📄 Equipment data being passed to PDF:', equipmentData.slice(0, 2));

            // Get selected project name for PDF title
            const selectedProject = projects.find(p => p._id === selectedProjectId);
            const projectName = selectedProject?.name || 'Unknown Project';
            
            // Add section names to project title if multiple sections exist and specific sections are selected
            let reportTitle = projectName;
            if (projectSections.length > 1 && selectedSections.length > 0 && selectedSections.length < projectSections.length) {
                const sectionNames = projectSections
                    .filter(s => selectedSections.includes(s.sectionId || s._id))
                    .map(s => s.name)
                    .join(', ');
                reportTitle = `${projectName} - ${sectionNames}`;
            }
            
            console.log('📄 Selected project:', selectedProject);
            console.log('📄 Report title for PDF:', reportTitle);
            console.log('📄 Client data:', clientData);
            console.log('📄 User data:', userData);

            // Generate PDF report
            console.log('📄 Creating PDF generator...');
            const pdfGenerator = new PDFReportGenerator(clientData, userData);
            
            console.log('📄 Calling generatePDF...');
            await pdfGenerator.generatePDF(activities || [], reportTitle, laborData, equipmentData);
            console.log('📄 generatePDF completed successfully');

            console.log('✅ PDF generation completed successfully');
            console.log('========================================\n');

            // Don't close modal automatically - let user choose what to do with PDF
            // The PDF generator will show view/share options

        } catch (error: any) {
            console.error('❌ Report generation error:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('========================================\n');
            
            Alert.alert(
                'Error',
                error.response?.data?.error || error.message || 'Failed to generate report. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setGenerating(false);
        }
    };

    const getActivityFilterIcon = (filter: ActivityFilter) => {
        switch (filter) {
            case 'imported': return 'download';
            case 'used': return 'arrow-forward';
            default: return 'list';
        }
    };

    const getActivityFilterColor = (filter: ActivityFilter) => {
        switch (filter) {
            case 'imported': return '#10B981';
            case 'used': return '#EF4444';
            default: return '#3B82F6';
        }
    };

    const getDaysDifference = () => {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const handleProjectSelection = async (projectId: string) => {
        setSelectedProjectId(projectId);
        // Fetch sections for the selected project
        await fetchProjectSections(projectId);
    };

    const toggleSectionSelection = (sectionId: string) => {
        setSelectedSections(prev => {
            if (prev.includes(sectionId)) {
                return prev.filter(id => id !== sectionId);
            } else {
                return [...prev, sectionId];
            }
        });
    };

    const toggleAllSections = () => {
        if (selectedSections.length === projectSections.length) {
            // Deselect all
            setSelectedSections([]);
        } else {
            // Select all
            setSelectedSections(projectSections.map(s => s.sectionId || s._id));
        }
    };

    const getSectionSelectionText = () => {
        if (projectSections.length === 0) {
            return 'No sections in project';
        }
        if (selectedSections.length === 0) {
            return 'No sections selected';
        }
        if (selectedSections.length === projectSections.length) {
            return 'All sections selected';
        }
        return `${selectedSections.length} of ${projectSections.length} sections selected`;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="document-text" size={24} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={styles.title}>Generate Report</Text>
                                <Text style={styles.subtitle}>Material, labor & equipment report</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Date Range Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Date Range</Text>
                            <Text style={styles.sectionSubtitle}>
                                Select the period for your report ({getDaysDifference()} days) - defaults to 1 year
                            </Text>
                            
                            <View style={styles.dateRow}>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowStartDatePicker(true)}
                                >
                                    <View style={styles.dateButtonContent}>
                                        <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                                        <View style={styles.dateButtonText}>
                                            <Text style={styles.dateLabel}>From</Text>
                                            <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.dateSeparator}>
                                    <Ionicons name="arrow-forward" size={16} color="#94A3B8" />
                                </View>

                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowEndDatePicker(true)}
                                >
                                    <View style={styles.dateButtonContent}>
                                        <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                                        <View style={styles.dateButtonText}>
                                            <Text style={styles.dateLabel}>To</Text>
                                            <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* Quick Date Presets */}
                            <View style={styles.presetsContainer}>
                                <Text style={styles.presetsTitle}>Quick Select:</Text>
                                <View style={styles.presetButtons}>
                                    {[
                                        { label: '7 Days', days: 7 },
                                        { label: '30 Days', days: 30 },
                                        { label: '90 Days', days: 90 },
                                        { label: 'All Time', days: 365 }
                                    ].map((preset) => (
                                        <TouchableOpacity
                                            key={preset.days}
                                            style={styles.presetButton}
                                            onPress={() => {
                                                const newStartDate = new Date();
                                                newStartDate.setDate(newStartDate.getDate() - preset.days);
                                                setStartDate(newStartDate);
                                                setEndDate(new Date());
                                            }}
                                        >
                                            <Text style={styles.presetButtonText}>{preset.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Activity Filter Section - HIDDEN as requested */}
                        {/* Activity type is now fixed to 'all' by default */}
                        {false && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Activity Type</Text>
                            <Text style={styles.sectionSubtitle}>
                                Choose which activities to include in the report
                            </Text>
                            
                            <View style={styles.filterButtons}>
                                {[
                                    { key: 'all' as ActivityFilter, label: 'All Activities', description: 'All material activities' },
                                    { key: 'imported' as ActivityFilter, label: 'Imported Only', description: 'Materials added to inventory' },
                                    { key: 'used' as ActivityFilter, label: 'Used Only', description: 'Materials consumed in projects' },
                                    { key: 'transferred' as ActivityFilter, label: 'Transferred Only', description: 'Materials moved between projects' }
                                ].map((filter) => (
                                    <TouchableOpacity
                                        key={filter.key}
                                        style={[
                                            styles.filterButton,
                                            activityFilter === filter.key && styles.filterButtonActive
                                        ]}
                                        onPress={() => setActivityFilter(filter.key)}
                                    >
                                        <View style={styles.filterButtonLeft}>
                                            <View style={[
                                                styles.filterButtonIcon,
                                                { backgroundColor: `${getActivityFilterColor(filter.key)}20` }
                                            ]}>
                                                <Ionicons
                                                    name={getActivityFilterIcon(filter.key) as any}
                                                    size={20}
                                                    color={getActivityFilterColor(filter.key)}
                                                />
                                            </View>
                                            <View style={styles.filterButtonText}>
                                                <Text style={[
                                                    styles.filterButtonLabel,
                                                    activityFilter === filter.key && styles.filterButtonLabelActive
                                                ]}>
                                                    {filter.label}
                                                </Text>
                                                <Text style={styles.filterButtonDescription}>
                                                    {filter.description}
                                                </Text>
                                            </View>
                                        </View>
                                        {activityFilter === filter.key && (
                                            <Ionicons name="checkmark-circle" size={22} color="#3B82F6" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        )}

                        {/* Project Filter Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Project Filter</Text>
                            <Text style={styles.sectionSubtitle}>
                                Select a specific project for the report
                            </Text>
                            
                            {loadingProjects ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#3B82F6" />
                                    <Text style={styles.loadingText}>Loading projects...</Text>
                                </View>
                            ) : (
                                <View style={styles.projectButtons}>
                                    {/* All Projects Option - REMOVED as requested */}
                                    
                                    {/* Individual Project Options */}
                                    {projects.map((project) => (
                                        <TouchableOpacity
                                            key={project._id}
                                            style={[
                                                styles.projectButton,
                                                selectedProjectId === project._id && styles.projectButtonActive
                                            ]}
                                            onPress={() => handleProjectSelection(project._id)}
                                        >
                                            <View style={styles.projectButtonLeft}>
                                                <View style={[
                                                    styles.projectButtonIcon,
                                                    { backgroundColor: '#10B98120' }
                                                ]}>
                                                    <Ionicons
                                                        name="business"
                                                        size={20}
                                                        color="#10B981"
                                                    />
                                                </View>
                                                <View style={styles.projectButtonText}>
                                                    <Text style={[
                                                        styles.projectButtonLabel,
                                                        selectedProjectId === project._id && styles.projectButtonLabelActive
                                                    ]}>
                                                        {project.name}
                                                    </Text>
                                                    <Text style={styles.projectButtonDescription}>
                                                        Created: {new Date(project.createdAt).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            </View>
                                            {selectedProjectId === project._id && (
                                                <Ionicons name="checkmark-circle" size={22} color="#3B82F6" />
                                            )}
                                        </TouchableOpacity>
                                    ))}

                                    {projects.length === 0 && !loadingProjects && (
                                        <View style={styles.noProjectsContainer}>
                                            <Ionicons name="folder-open-outline" size={32} color="#94A3B8" />
                                            <Text style={styles.noProjectsText}>No projects found</Text>
                                            <Text style={styles.noProjectsSubtext}>
                                                Create a project first to filter by project
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Section Filter Section - Only show if project has multiple sections */}
                        {projectSections.length > 1 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View>
                                        <Text style={styles.sectionTitle}>Section Filter</Text>
                                        <Text style={styles.sectionSubtitle}>
                                            Select sections for material usage data
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.selectAllButton}
                                        onPress={toggleAllSections}
                                    >
                                        <Ionicons 
                                            name={selectedSections.length === projectSections.length ? "checkbox" : "square-outline"} 
                                            size={20} 
                                            color="#3B82F6" 
                                        />
                                        <Text style={styles.selectAllText}>
                                            {selectedSections.length === projectSections.length ? 'Deselect All' : 'Select All'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.sectionFilterNote}>
                                    <Ionicons name="information-circle" size={16} color="#8B5CF6" />
                                    <Text style={styles.sectionFilterNoteText}>
                                        Material imports are project-wide. Only material usage will be filtered by sections.
                                    </Text>
                                </View>

                                <View style={styles.sectionSelectionInfo}>
                                    <Ionicons name="layers" size={16} color="#3B82F6" />
                                    <Text style={styles.sectionSelectionInfoText}>
                                        {getSectionSelectionText()}
                                    </Text>
                                </View>
                                
                                <View style={styles.sectionButtons}>
                                    {projectSections.map((section) => (
                                        <TouchableOpacity
                                            key={section.sectionId || section._id}
                                            style={[
                                                styles.sectionButton,
                                                selectedSections.includes(section.sectionId || section._id) && styles.sectionButtonActive
                                            ]}
                                            onPress={() => toggleSectionSelection(section.sectionId || section._id)}
                                        >
                                            <View style={styles.sectionButtonLeft}>
                                                <View style={[
                                                    styles.sectionButtonIcon,
                                                    { backgroundColor: '#8B5CF620' }
                                                ]}>
                                                    <Ionicons
                                                        name="layers"
                                                        size={18}
                                                        color="#8B5CF6"
                                                    />
                                                </View>
                                                <View style={styles.sectionButtonText}>
                                                    <Text style={[
                                                        styles.sectionButtonLabel,
                                                        selectedSections.includes(section.sectionId || section._id) && styles.sectionButtonLabelActive
                                                    ]}>
                                                        {section.name}
                                                    </Text>
                                                    {section.miniSections && section.miniSections.length > 0 && (
                                                        <Text style={styles.sectionButtonDescription}>
                                                            {section.miniSections.length} mini-section{section.miniSections.length !== 1 ? 's' : ''}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                            {selectedSections.includes(section.sectionId || section._id) ? (
                                                <Ionicons name="checkmark-circle" size={22} color="#8B5CF6" />
                                            ) : (
                                                <Ionicons name="ellipse-outline" size={22} color="#CBD5E1" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Report Preview */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Report Preview</Text>
                            <View style={styles.previewCard}>
                                <View style={styles.previewHeader}>
                                    <Ionicons name="document-text-outline" size={24} color="#3B82F6" />
                                    <Text style={styles.previewTitle}>Material, Labor & Equipment Report</Text>
                                </View>
                                <View style={styles.previewDetails}>
                                    <View style={styles.previewRow}>
                                        <Text style={styles.previewLabel}>Period:</Text>
                                        <Text style={styles.previewValue}>
                                            {formatDate(startDate)} - {formatDate(endDate)}
                                        </Text>
                                    </View>
                                    <View style={styles.previewRow}>
                                        <Text style={styles.previewLabel}>Activities:</Text>
                                        <Text style={styles.previewValue}>
                                            {activityFilter === 'all' ? 'All Types' : 
                                             activityFilter === 'imported' ? 'Imported Materials' : 
                                             activityFilter === 'used' ? 'Used Materials' : 'Transferred Materials'}
                                        </Text>
                                    </View>
                                    <View style={styles.previewRow}>
                                        <Text style={styles.previewLabel}>Includes:</Text>
                                        <Text style={styles.previewValue}>
                                            Materials, Labor & Equipment Costs
                                        </Text>
                                    </View>
                                    <View style={styles.previewRow}>
                                        <Text style={styles.previewLabel}>Project:</Text>
                                        <Text style={styles.previewValue}>
                                            {selectedProjectId ? 
                                             projects.find(p => p._id === selectedProjectId)?.name || 'Selected Project' :
                                             'No project selected'}
                                        </Text>
                                    </View>
                                    {projectSections.length > 1 && (
                                        <View style={styles.previewRow}>
                                            <Text style={styles.previewLabel}>Sections:</Text>
                                            <Text style={styles.previewValue}>
                                                {getSectionSelectionText()}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.previewRow}>
                                        <Text style={styles.previewLabel}>Company:</Text>
                                        <Text style={styles.previewValue}>
                                            {clientData?.companyName || userData?.company || 'N/A'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            disabled={generating}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[
                                styles.generateButton, 
                                (generating || !selectedProjectId) && styles.generateButtonDisabled
                            ]}
                            onPress={generateReport}
                            disabled={generating || !selectedProjectId}
                        >
                            {generating ? (
                                <>
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                    <Text style={styles.generateButtonText}>Generating...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="download" size={20} color="#FFFFFF" />
                                    <Text style={styles.generateButtonText}>Generate PDF</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Date Pickers */}
                {showStartDatePicker && (
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        display="default"
                        onChange={handleStartDateChange}
                        maximumDate={endDate}
                    />
                )}

                {showEndDatePicker && (
                    <DateTimePicker
                        value={endDate}
                        mode="date"
                        display="default"
                        onChange={handleEndDateChange}
                        minimumDate={startDate}
                        maximumDate={new Date()}
                    />
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 16,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    dateButton: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
    },
    dateButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateButtonText: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    dateValue: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '600',
        marginTop: 2,
    },
    dateSeparator: {
        padding: 4,
    },
    presetsContainer: {
        marginTop: 8,
    },
    presetsTitle: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 8,
    },
    presetButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    presetButton: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    presetButtonText: {
        fontSize: 12,
        color: '#3B82F6',
        fontWeight: '600',
    },
    filterButtons: {
        gap: 8,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
    },
    filterButtonActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
    },
    filterButtonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    filterButtonIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    filterButtonText: {
        flex: 1,
    },
    filterButtonLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    filterButtonLabelActive: {
        color: '#3B82F6',
    },
    filterButtonDescription: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    previewCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    previewDetails: {
        gap: 8,
    },
    previewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    previewLabel: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    previewValue: {
        fontSize: 13,
        color: '#1E293B',
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    generateButton: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    generateButtonDisabled: {
        backgroundColor: '#94A3B8',
    },
    generateButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#64748B',
    },
    projectButtons: {
        gap: 8,
    },
    projectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
    },
    projectButtonActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
    },
    projectButtonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    projectButtonIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    projectButtonText: {
        flex: 1,
    },
    projectButtonLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    projectButtonLabelActive: {
        color: '#3B82F6',
    },
    projectButtonDescription: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    noProjectsContainer: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    noProjectsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 8,
    },
    noProjectsSubtext: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    selectAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    selectAllText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3B82F6',
    },
    sectionFilterNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#F5F3FF',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E9D5FF',
    },
    sectionFilterNoteText: {
        flex: 1,
        fontSize: 12,
        color: '#7C3AED',
        lineHeight: 16,
    },
    sectionSelectionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 12,
    },
    sectionSelectionInfoText: {
        fontSize: 13,
        color: '#3B82F6',
        fontWeight: '500',
    },
    sectionButtons: {
        gap: 8,
    },
    sectionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
    },
    sectionButtonActive: {
        backgroundColor: '#F5F3FF',
        borderColor: '#8B5CF6',
    },
    sectionButtonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    sectionButtonIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionButtonText: {
        flex: 1,
    },
    sectionButtonLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    sectionButtonLabelActive: {
        color: '#8B5CF6',
    },
    sectionButtonDescription: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
});

export default ReportGenerator;