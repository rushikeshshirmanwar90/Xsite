import { Project } from '@/types/project';
import { AddProjectModalProps, StaffMembers } from '@/types/staff';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';

import {
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const SCROLL_MAX_HEIGHT = Dimensions.get('window').height * 0.5;

const PROJECT_TYPES = ['Residential', 'Commercial', 'Industrial', 'Renovation', 'Infrastructure', 'Other'];

const STEPS = [
    { id: 1, label: 'Project Info' },
    { id: 2, label: 'Setup' },
    { id: 3, label: 'Team' },
];

const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const AddProjectModal: React.FC<AddProjectModalProps> = ({ visible, onClose, onAdd, staffMembers }) => {
    // Wizard state
    const [currentStep, setCurrentStep] = useState(1);
    const stepAnim = useRef(new Animated.Value(1)).current;
    const directionRef = useRef<1 | -1>(1);
    const line1Anim = useRef(new Animated.Value(0)).current;
    const line2Anim = useRef(new Animated.Value(0)).current;

    // Step 1: Project Information
    const [projectName, setProjectName] = useState('');
    const [projectAddress, setProjectAddress] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [estimatedBudget, setEstimatedBudget] = useState('');

    // Step 2: Project Setup
    const [buildingType, setBuildingType] = useState<'single' | 'multiple'>('single');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [projectType, setProjectType] = useState<string | null>(null);
    const [showProjectTypeMenu, setShowProjectTypeMenu] = useState(false);
    const [notes, setNotes] = useState('');

    // Step 3: Team Assignment
    const [searchQuery, setSearchQuery] = useState('');
    const [assignedTo, setAssignedTo] = useState<StaffMembers[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const submitLoadingAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(line1Anim, { toValue: currentStep >= 2 ? 1 : 0, duration: 250, useNativeDriver: false }).start();
        Animated.timing(line2Anim, { toValue: currentStep >= 3 ? 1 : 0, duration: 250, useNativeDriver: false }).start();
    }, [currentStep]);

    useEffect(() => {
        if (!visible) {
            resetAll();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const resetAll = () => {
        setCurrentStep(1);
        stepAnim.setValue(1);
        setProjectName('');
        setProjectAddress('');
        setProjectDescription('');
        setEstimatedBudget('');
        setBuildingType('single');
        setStartDate(null);
        setShowDatePicker(false);
        setProjectType(null);
        setShowProjectTypeMenu(false);
        setNotes('');
        setSearchQuery('');
        setAssignedTo([]);
    };

    const startSubmitLoadingAnimation = () => {
        Animated.loop(
            Animated.timing(submitLoadingAnimation, { toValue: 1, duration: 1000, useNativeDriver: true })
        ).start();
    };

    const stopSubmitLoadingAnimation = () => {
        submitLoadingAnimation.stopAnimation();
        submitLoadingAnimation.setValue(0);
    };

    const animateToStep = (step: number, direction: 1 | -1) => {
        directionRef.current = direction;
        Animated.timing(stepAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
            setCurrentStep(step);
            stepAnim.setValue(0);
            Animated.timing(stepAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
        });
    };

    const isStep1Valid =
        projectName.trim().length > 0 &&
        projectAddress.trim().length > 0 &&
        estimatedBudget.trim().length > 0 &&
        !isNaN(parseFloat(estimatedBudget)) &&
        parseFloat(estimatedBudget) > 0;

    const goNext = () => {
        if (currentStep === 1 && !isStep1Valid) {
            Alert.alert('Missing Information', 'Please enter a project name, location and a valid estimated budget.');
            return;
        }
        if (currentStep < 3) {
            animateToStep(currentStep + 1, 1);
        }
    };

    const goBack = () => {
        if (currentStep > 1) {
            animateToStep(currentStep - 1, -1);
        }
    };

    const jumpToStep = (step: number) => {
        if (step < currentStep) {
            animateToStep(step, -1);
        }
    };

    // Staff selection helpers
    const handleStaffSelection = (staff: StaffMembers) => {
        const isSelected = assignedTo.some(member => member._id === staff._id);
        if (isSelected) {
            setAssignedTo(assignedTo.filter(member => member._id !== staff._id));
        } else {
            setAssignedTo([...assignedTo, { ...staff, monthlyPayment: 0 }]);
        }
    };

    const isStaffSelected = (staff: StaffMembers) => assignedTo.some(member => member._id === staff._id);

    const handleMonthlyPaymentChange = (staffId: string | undefined, value: string) => {
        const amount = value === '' ? 0 : Number(value.replace(/[^0-9.]/g, ''));
        setAssignedTo(prev => prev.map(member =>
            member._id === staffId ? { ...member, monthlyPayment: isNaN(amount) ? 0 : amount } : member
        ));
    };

    const getMonthlyPayment = (staffId: string | undefined): string => {
        const member = assignedTo.find(m => m._id === staffId);
        return member?.monthlyPayment ? String(member.monthlyPayment) : '';
    };

    const filteredStaff = staffMembers.filter(staff =>
        staff.fullName.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    const handleSubmit = async () => {
        if (!isStep1Valid) {
            Alert.alert('Missing Information', 'Please complete the project information step.');
            animateToStep(1, -1);
            return;
        }
        if (assignedTo.length === 0) {
            Alert.alert('Error', 'Please assign at least one team member');
            return;
        }

        const budgetNumber = parseFloat(estimatedBudget);

        setIsSubmitting(true);
        startSubmitLoadingAnimation();

        const newProject: Project = {
            name: projectName.trim(),
            address: projectAddress.trim(),
            assignedStaff: assignedTo,
            description: projectDescription.trim(),
            budget: budgetNumber,
            hasOnlyOneBuilding: buildingType === 'single',
            ...(startDate ? { startDate: startDate.toISOString() } : {}),
            ...(projectType ? { projectType } : {}),
            ...(notes.trim() ? { notes: notes.trim() } : {}),
        };

        try {
            await onAdd(newProject);
            resetAll();
            onClose();
        } catch (error) {
            console.error('Error adding project:', error);
        } finally {
            setIsSubmitting(false);
            stopSubmitLoadingAnimation();
        }
    };

    const translateX = stepAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [directionRef.current * 28, 0],
    });

    const stepCircleState = (step: number): 'done' | 'active' | 'upcoming' => {
        if (step < currentStep) return 'done';
        if (step === currentStep) return 'active';
        return 'upcoming';
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            statusBarTranslucent
            onRequestClose={() => (currentStep > 1 ? goBack() : onClose())}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    style={styles.kbWrap}
                    behavior="padding"
                    keyboardVerticalOffset={0}
                >
                    <View style={styles.sheet}>
                        <View style={styles.grabber} />

                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerTextBlock}>
                                <Text style={styles.headerTitle}>Add New Project</Text>
                                <Text style={styles.headerSubtitle}>Create a new project</Text>
                            </View>
                            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
                                <Ionicons name="close" size={20} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        {/* Progress indicator */}
                        <View style={styles.progressRow}>
                            {STEPS.map((step, idx) => {
                                const state = stepCircleState(step.id);
                                return (
                                    <React.Fragment key={step.id}>
                                        <TouchableOpacity
                                            style={styles.stepCol}
                                            onPress={() => jumpToStep(step.id)}
                                            activeOpacity={state === 'done' ? 0.6 : 1}
                                            disabled={state !== 'done'}
                                        >
                                            <View style={[
                                                styles.stepCircle,
                                                state === 'done' && styles.stepCircleDone,
                                                state === 'active' && styles.stepCircleActive,
                                                state === 'upcoming' && styles.stepCircleUpcoming,
                                            ]}>
                                                {state === 'done' ? (
                                                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                                ) : (
                                                    <Text style={[
                                                        styles.stepCircleText,
                                                        state === 'active' && styles.stepCircleTextActive,
                                                    ]}>{step.id}</Text>
                                                )}
                                            </View>
                                            <Text style={[
                                                styles.stepLabel,
                                                (state === 'active' || state === 'done') && styles.stepLabelActive,
                                            ]} numberOfLines={1}>{step.label}</Text>
                                        </TouchableOpacity>

                                        {idx < STEPS.length - 1 && (
                                            <View style={styles.stepLineTrack}>
                                                <Animated.View
                                                    style={[
                                                        styles.stepLineFill,
                                                        {
                                                            width: (idx === 0 ? line1Anim : line2Anim).interpolate({
                                                                inputRange: [0, 1],
                                                                outputRange: ['0%', '100%'],
                                                            }),
                                                        },
                                                    ]}
                                                />
                                            </View>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </View>

                        {/* Step content */}
                        <Animated.View style={[styles.stepContentWrap, { opacity: stepAnim, transform: [{ translateX }] }]}>
                            <ScrollView
                                style={styles.scroll}
                                contentContainerStyle={styles.scrollContent}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                {currentStep === 1 && (
                                    <View>
                                        <Text style={styles.sectionLabel}>PROJECT INFORMATION</Text>

                                        <Text style={styles.fieldLabel}>Project Name *</Text>
                                        <TextInput
                                            style={[styles.input, focusedField === 'name' && styles.inputFocused]}
                                            value={projectName}
                                            onChangeText={setProjectName}
                                            placeholder="Enter project name"
                                            placeholderTextColor="#9CA3AF"
                                            onFocus={() => setFocusedField('name')}
                                            onBlur={() => setFocusedField(null)}
                                        />

                                        <Text style={styles.fieldLabel}>Project Location *</Text>
                                        <View style={[styles.iconInputWrap, focusedField === 'address' && styles.inputFocused]}>
                                            <Ionicons name="location-outline" size={17} color="#94A3B8" style={styles.iconInputIcon} />
                                            <TextInput
                                                style={styles.iconInputField}
                                                value={projectAddress}
                                                onChangeText={setProjectAddress}
                                                placeholder="Enter project location"
                                                placeholderTextColor="#9CA3AF"
                                                onFocus={() => setFocusedField('address')}
                                                onBlur={() => setFocusedField(null)}
                                            />
                                        </View>

                                        <Text style={styles.fieldLabel}>Project Description</Text>
                                        <TextInput
                                            style={[styles.input, styles.textArea, focusedField === 'description' && styles.inputFocused]}
                                            value={projectDescription}
                                            onChangeText={setProjectDescription}
                                            placeholder="Optional — add a short description"
                                            placeholderTextColor="#9CA3AF"
                                            multiline
                                            textAlignVertical="top"
                                            onFocus={() => setFocusedField('description')}
                                            onBlur={() => setFocusedField(null)}
                                        />

                                        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>PROJECT FINANCE</Text>

                                        <Text style={styles.fieldLabel}>Estimated Budget *</Text>
                                        <View style={[styles.iconInputWrap, focusedField === 'budget' && styles.inputFocused]}>
                                            <Text style={styles.rupeeIcon}>₹</Text>
                                            <TextInput
                                                style={styles.iconInputField}
                                                value={estimatedBudget}
                                                onChangeText={setEstimatedBudget}
                                                placeholder="0"
                                                placeholderTextColor="#9CA3AF"
                                                keyboardType="numeric"
                                                onFocus={() => setFocusedField('budget')}
                                                onBlur={() => setFocusedField(null)}
                                            />
                                        </View>
                                        <Text style={styles.helperText}>Enter total estimated budget</Text>
                                    </View>
                                )}

                                {currentStep === 2 && (
                                    <View>
                                        <Text style={styles.sectionLabel}>PROJECT STRUCTURE</Text>

                                        <TouchableOpacity
                                            style={[styles.radioCard, buildingType === 'single' && styles.radioCardSelected]}
                                            onPress={() => setBuildingType('single')}
                                            activeOpacity={0.8}
                                        >
                                            <View style={[styles.radioOuter, buildingType === 'single' && styles.radioOuterSelected]}>
                                                {buildingType === 'single' && <View style={styles.radioInner} />}
                                            </View>
                                            <View style={styles.radioIconChip}>
                                                <Ionicons name="business-outline" size={18} color="#3B82F6" />
                                            </View>
                                            <View style={styles.radioTextBlock}>
                                                <Text style={styles.radioTitle}>Single Building</Text>
                                                <Text style={styles.radioSubtitle}>This project has one building</Text>
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.radioCard, buildingType === 'multiple' && styles.radioCardSelected]}
                                            onPress={() => setBuildingType('multiple')}
                                            activeOpacity={0.8}
                                        >
                                            <View style={[styles.radioOuter, buildingType === 'multiple' && styles.radioOuterSelected]}>
                                                {buildingType === 'multiple' && <View style={styles.radioInner} />}
                                            </View>
                                            <View style={styles.radioIconChip}>
                                                <Ionicons name="layers-outline" size={18} color="#3B82F6" />
                                            </View>
                                            <View style={styles.radioTextBlock}>
                                                <Text style={styles.radioTitle}>Multiple Buildings</Text>
                                                <Text style={styles.radioSubtitle}>This project has multiple buildings</Text>
                                            </View>
                                        </TouchableOpacity>

                                        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Project Start Date</Text>
                                        <TouchableOpacity
                                            style={styles.iconInputWrap}
                                            onPress={() => setShowDatePicker(true)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="calendar-outline" size={17} color="#94A3B8" style={styles.iconInputIcon} />
                                            <Text style={[styles.dropdownTriggerText, !startDate && styles.placeholderText]}>
                                                {startDate ? formatDate(startDate) : 'Select start date'}
                                            </Text>
                                        </TouchableOpacity>
                                        {showDatePicker && (
                                            <DateTimePicker
                                                value={startDate || new Date()}
                                                mode="date"
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                onChange={(event, selectedDate) => {
                                                    setShowDatePicker(Platform.OS === 'ios');
                                                    if (selectedDate) {
                                                        setStartDate(selectedDate);
                                                    }
                                                }}
                                            />
                                        )}

                                        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Project Type</Text>
                                        <TouchableOpacity
                                            style={styles.iconInputWrap}
                                            onPress={() => setShowProjectTypeMenu(v => !v)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="grid-outline" size={17} color="#94A3B8" style={styles.iconInputIcon} />
                                            <Text style={[styles.dropdownTriggerText, !projectType && styles.placeholderText]}>
                                                {projectType || 'Select project type (optional)'}
                                            </Text>
                                            <Ionicons name={showProjectTypeMenu ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
                                        </TouchableOpacity>
                                        {showProjectTypeMenu && (
                                            <View style={styles.dropdownMenu}>
                                                {PROJECT_TYPES.map(type => (
                                                    <TouchableOpacity
                                                        key={type}
                                                        style={styles.dropdownOption}
                                                        onPress={() => { setProjectType(type); setShowProjectTypeMenu(false); }}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Text style={[
                                                            styles.dropdownOptionText,
                                                            projectType === type && styles.dropdownOptionTextSelected,
                                                        ]}>{type}</Text>
                                                        {projectType === type && <Ionicons name="checkmark" size={16} color="#3B82F6" />}
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}

                                        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Notes</Text>
                                        <TextInput
                                            style={[styles.input, styles.textArea, focusedField === 'notes' && styles.inputFocused]}
                                            value={notes}
                                            onChangeText={setNotes}
                                            placeholder="Optional — any additional notes"
                                            placeholderTextColor="#9CA3AF"
                                            multiline
                                            textAlignVertical="top"
                                            onFocus={() => setFocusedField('notes')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </View>
                                )}

                                {currentStep === 3 && (
                                    <View>
                                        <View style={styles.sectionLabelRow}>
                                            <Text style={styles.sectionLabel}>ASSIGN TEAM MEMBERS</Text>
                                            <Text style={styles.sectionLabelCount}>{assignedTo.length} selected</Text>
                                        </View>

                                        <View style={styles.iconInputWrap}>
                                            <Ionicons name="search-outline" size={17} color="#94A3B8" style={styles.iconInputIcon} />
                                            <TextInput
                                                style={styles.iconInputField}
                                                value={searchQuery}
                                                onChangeText={setSearchQuery}
                                                placeholder="Search staff by name"
                                                placeholderTextColor="#9CA3AF"
                                            />
                                            {searchQuery.length > 0 && (
                                                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                                                    <Ionicons name="close-circle" size={16} color="#CBD5E1" />
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        {filteredStaff.map((staff) => {
                                            const selected = isStaffSelected(staff);
                                            return (
                                                <View key={staff._id}>
                                                    <TouchableOpacity
                                                        style={[styles.staffCard, selected && styles.staffCardSelected]}
                                                        onPress={() => handleStaffSelection(staff)}
                                                        activeOpacity={0.8}
                                                    >
                                                        <View style={[styles.avatarCircle, selected && styles.avatarCircleSelected]}>
                                                            <Text style={[styles.avatarText, selected && styles.avatarTextSelected]}>
                                                                {getInitials(staff.fullName)}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.staffTextBlock}>
                                                            <Text style={styles.staffName} numberOfLines={1}>{staff.fullName}</Text>
                                                            <View style={styles.staffStatusRow}>
                                                                <View style={[styles.staffStatusDot, { backgroundColor: selected ? '#3B82F6' : '#10B981' }]} />
                                                                <Text style={styles.staffStatusText}>{selected ? 'Assigned' : 'Available'}</Text>
                                                            </View>
                                                        </View>
                                                        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                                                            {selected && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
                                                        </View>
                                                    </TouchableOpacity>

                                                    {selected && (
                                                        <View style={styles.paymentRow}>
                                                            <Ionicons name="cash-outline" size={15} color="#059669" />
                                                            <Text style={styles.paymentLabel}>Monthly Payment (₹)</Text>
                                                            <TextInput
                                                                style={styles.paymentInput}
                                                                value={getMonthlyPayment(staff._id)}
                                                                onChangeText={(value) => handleMonthlyPaymentChange(staff._id, value)}
                                                                placeholder="0"
                                                                placeholderTextColor="#9CA3AF"
                                                                keyboardType="numeric"
                                                            />
                                                        </View>
                                                    )}
                                                </View>
                                            );
                                        })}

                                        {filteredStaff.length === 0 && (
                                            <View style={styles.emptyStaffContainer}>
                                                <Ionicons name="people-outline" size={30} color="#9CA3AF" />
                                                <Text style={styles.emptyStaffText}>
                                                    {staffMembers.length === 0 ? 'No staff members available' : 'No matches found'}
                                                </Text>
                                                <Text style={styles.emptyStaffSubText}>
                                                    {staffMembers.length === 0 ? 'Please add staff members first' : 'Try a different search'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </ScrollView>
                        </Animated.View>

                        {/* Footer actions */}
                        <View style={styles.footer}>
                            {currentStep === 1 ? (
                                <>
                                    <TouchableOpacity style={styles.secondaryButton} onPress={onClose} activeOpacity={0.7}>
                                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.primaryButtonWrap} onPress={goNext} activeOpacity={0.85}>
                                        <LinearGradient
                                            colors={['#3B82F6', '#8B5CF6']}
                                            style={styles.primaryButtonGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Text style={styles.primaryButtonText}>Next</Text>
                                            <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </>
                            ) : currentStep === 2 ? (
                                <>
                                    <TouchableOpacity style={styles.secondaryButton} onPress={goBack} activeOpacity={0.7}>
                                        <Ionicons name="arrow-back" size={16} color="#374151" />
                                        <Text style={styles.secondaryButtonText}>Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.primaryButtonWrap} onPress={goNext} activeOpacity={0.85}>
                                        <LinearGradient
                                            colors={['#3B82F6', '#8B5CF6']}
                                            style={styles.primaryButtonGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Text style={styles.primaryButtonText}>Next</Text>
                                            <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <TouchableOpacity style={styles.secondaryButton} onPress={goBack} activeOpacity={0.7} disabled={isSubmitting}>
                                        <Ionicons name="arrow-back" size={16} color="#374151" />
                                        <Text style={styles.secondaryButtonText}>Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.primaryButtonWrap, { flex: 1.6 }]}
                                        onPress={handleSubmit}
                                        activeOpacity={0.85}
                                        disabled={isSubmitting}
                                    >
                                        <LinearGradient
                                            colors={isSubmitting ? ['#9CA3AF', '#6B7280'] : ['#3B82F6', '#8B5CF6']}
                                            style={styles.primaryButtonGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            {isSubmitting ? (
                                                <Animated.View
                                                    style={{
                                                        transform: [{
                                                            rotate: submitLoadingAnimation.interpolate({
                                                                inputRange: [0, 1],
                                                                outputRange: ['0deg', '360deg'],
                                                            }),
                                                        }],
                                                    }}
                                                >
                                                    <Ionicons name="sync" size={18} color="white" />
                                                </Animated.View>
                                            ) : (
                                                <>
                                                    <Text style={styles.primaryButtonText}>Create Project</Text>
                                                    <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15,23,42,0.45)',
        justifyContent: 'flex-end',
    },
    kbWrap: {
        maxHeight: '92%',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 16,
    },
    grabber: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E2E8F0',
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 4,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTextBlock: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 12.5,
        color: '#94A3B8',
        fontWeight: '500',
        marginTop: 2,
    },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Progress indicator
    progressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 14,
    },
    stepCol: {
        alignItems: 'center',
        width: 68,
    },
    stepCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    stepCircleDone: {
        backgroundColor: '#3B82F6',
    },
    stepCircleActive: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#3B82F6',
    },
    stepCircleUpcoming: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    stepCircleText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#94A3B8',
    },
    stepCircleTextActive: {
        color: '#3B82F6',
    },
    stepLabel: {
        fontSize: 10.5,
        fontWeight: '600',
        color: '#94A3B8',
        textAlign: 'center',
    },
    stepLabelActive: {
        color: '#3B82F6',
        fontWeight: '700',
    },
    stepLineTrack: {
        flex: 1,
        height: 3,
        borderRadius: 2,
        backgroundColor: '#E2E8F0',
        marginTop: 14,
        marginHorizontal: -8,
        overflow: 'hidden',
    },
    stepLineFill: {
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 2,
    },

    // Step content
    stepContentWrap: {
        flexShrink: 1,
    },
    scroll: {
        maxHeight: SCROLL_MAX_HEIGHT,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 24,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    sectionLabelSpaced: {
        marginTop: 22,
    },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionLabelCount: {
        fontSize: 11.5,
        fontWeight: '700',
        color: '#3B82F6',
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    fieldLabelSpaced: {
        marginTop: 16,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 14.5,
        color: '#0F172A',
        marginBottom: 16,
    },
    textArea: {
        minHeight: 80,
        paddingTop: 12,
    },
    inputFocused: {
        borderColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
    },
    iconInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 14,
        marginBottom: 16,
        gap: 8,
    },
    iconInputIcon: {
        marginRight: 0,
    },
    iconInputField: {
        flex: 1,
        paddingVertical: 13,
        fontSize: 14.5,
        color: '#0F172A',
    },
    rupeeIcon: {
        fontSize: 15,
        fontWeight: '700',
        color: '#94A3B8',
    },
    helperText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
        marginTop: -10,
        marginBottom: 4,
    },
    placeholderText: {
        color: '#9CA3AF',
    },
    dropdownTriggerText: {
        flex: 1,
        paddingVertical: 13,
        fontSize: 14.5,
        color: '#0F172A',
    },
    dropdownMenu: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        marginTop: -10,
        marginBottom: 16,
        overflow: 'hidden',
    },
    dropdownOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    dropdownOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    dropdownOptionTextSelected: {
        color: '#3B82F6',
        fontWeight: '700',
    },

    // Radio cards (building structure)
    radioCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
    },
    radioCardSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderColor: '#3B82F6',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#3B82F6',
    },
    radioIconChip: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(59,130,246,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioTextBlock: {
        flex: 1,
    },
    radioTitle: {
        fontSize: 14.5,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    radioSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },

    // Staff cards (team assignment)
    staffCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
    },
    staffCardSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: 'rgba(59,130,246,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarCircleSelected: {
        backgroundColor: '#3B82F6',
    },
    avatarText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#3B82F6',
    },
    avatarTextSelected: {
        color: '#FFFFFF',
    },
    staffTextBlock: {
        flex: 1,
    },
    staffName: {
        fontSize: 14.5,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 3,
    },
    staffStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    staffStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    staffStatusText: {
        fontSize: 11.5,
        color: '#94A3B8',
        fontWeight: '500',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 7,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    checkboxSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    paymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#ECFDF5',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginTop: -4,
        marginBottom: 12,
    },
    paymentLabel: {
        flex: 1,
        fontSize: 12.5,
        color: '#065F46',
        fontWeight: '500',
    },
    paymentInput: {
        minWidth: 80,
        textAlign: 'right',
        fontSize: 14,
        fontWeight: '600',
        color: '#065F46',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    emptyStaffContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyStaffText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginTop: 10,
    },
    emptyStaffSubText: {
        fontSize: 12.5,
        color: '#94A3B8',
        marginTop: 4,
    },

    // Footer
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingVertical: 14,
    },
    secondaryButtonText: {
        fontSize: 14.5,
        fontWeight: '700',
        color: '#374151',
    },
    primaryButtonWrap: {
        flex: 1.4,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    primaryButtonText: {
        fontSize: 14.5,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default AddProjectModal;
