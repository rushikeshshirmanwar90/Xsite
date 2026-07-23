import { Project } from '@/types/project';
import { AddProjectModalProps, StaffMembers } from '@/types/staff';
import { Ionicons } from '@expo/vector-icons';
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


const PROJECT_TYPES = ['ongoing', 'upcoming', 'completed'];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface CustomDatePickerProps {
    selectedDate: Date | null;
    onSelect: (date: Date) => void;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ selectedDate, onSelect }) => {
    const today = new Date();
    const [viewMonth, setViewMonth] = React.useState(() => (selectedDate || today).getMonth());
    const [viewYear, setViewYear] = React.useState(() => (selectedDate || today).getFullYear());

    React.useEffect(() => {
        const ref = selectedDate || today;
        setViewMonth(ref.getMonth());
        setViewYear(ref.getFullYear());
    }, []);

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };

    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    const isSelected = (day: number) =>
        !!selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === viewMonth &&
        selectedDate.getFullYear() === viewYear;

    const isToday = (day: number) =>
        today.getDate() === day &&
        today.getMonth() === viewMonth &&
        today.getFullYear() === viewYear;

    return (
        <View style={dpStyles.container}>
            <View style={dpStyles.header}>
                <TouchableOpacity onPress={prevMonth} style={dpStyles.navBtn} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={18} color="#374151" />
                </TouchableOpacity>
                <Text style={dpStyles.monthYear}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
                <TouchableOpacity onPress={nextMonth} style={dpStyles.navBtn} activeOpacity={0.7}>
                    <Ionicons name="chevron-forward" size={18} color="#374151" />
                </TouchableOpacity>
            </View>

            <View style={dpStyles.dayNamesRow}>
                {DAY_NAMES.map(d => (
                    <Text key={d} style={dpStyles.dayName}>{d}</Text>
                ))}
            </View>

            {weeks.map((week, wi) => (
                <View key={wi} style={dpStyles.weekRow}>
                    {week.map((day, di) => {
                        const sel = day !== null && isSelected(day);
                        const tod = day !== null && isToday(day);
                        return (
                            <TouchableOpacity
                                key={di}
                                style={[
                                    dpStyles.dayCell,
                                    sel && dpStyles.dayCellSelected,
                                    !sel && tod && dpStyles.dayCellToday,
                                ]}
                                onPress={() => day !== null && onSelect(new Date(viewYear, viewMonth, day))}
                                disabled={day === null}
                                activeOpacity={day === null ? 1 : 0.7}
                            >
                                <Text style={[
                                    dpStyles.dayText,
                                    sel && dpStyles.dayTextSelected,
                                    !sel && tod && dpStyles.dayTextToday,
                                ]}>
                                    {day !== null ? String(day) : ''}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};

const dpStyles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 12,
        marginTop: -8,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    navBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthYear: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    dayNamesRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    dayName: {
        flex: 1,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '600',
        color: '#94A3B8',
        paddingVertical: 4,
    },
    weekRow: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    dayCell: {
        flex: 1,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    dayCellSelected: {
        backgroundColor: '#3A78B5',
    },
    dayCellToday: {
        backgroundColor: '#EAF0FE',
        borderWidth: 1,
        borderColor: '#C4D8FC',
    },
    dayText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
    },
    dayTextSelected: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    dayTextToday: {
        color: '#3A78B5',
        fontWeight: '700',
    },
});

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

const fmtINR = (v: number) => `₹${Number(v).toLocaleString('en-IN')}`;

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

    // Step 2: Project Setup (Configurable Slabs & Terrace)
    const [buildingType, setBuildingType] = useState<'single' | 'multiple'>('single');
    const [slabsCount, setSlabsCount] = useState(1);
    const [hasTerrace, setHasTerrace] = useState(true);
    const [buildings, setBuildings] = useState<Array<{ key: string; name: string; slabsCount: number; hasTerrace: boolean }>>([
        { key: '1', name: 'Building 1', slabsCount: 1, hasTerrace: true },
        { key: '2', name: 'Building 2', slabsCount: 1, hasTerrace: true }
    ]);

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
        setSlabsCount(1);
        setHasTerrace(true);
        setBuildings([
            { key: '1', name: 'Building 1', slabsCount: 1, hasTerrace: true },
            { key: '2', name: 'Building 2', slabsCount: 1, hasTerrace: true }
        ]);
        setSearchQuery('');
        setAssignedTo([]);
    };

    const addBuildingConfig = () => {
        setBuildings(prev => [
            ...prev,
            {
                key: Date.now().toString(),
                name: `Building ${prev.length + 1}`,
                slabsCount: 1,
                hasTerrace: true
            }
        ]);
    };

    const deleteBuildingConfig = (key: string) => {
        if (buildings.length > 1) {
            setBuildings(prev => prev.filter(b => b.key !== key));
        }
    };

    const updateBuildingConfig = (key: string, field: 'name' | 'slabsCount' | 'hasTerrace', value: any) => {
        setBuildings(prev => prev.map(b => b.key === key ? { ...b, [field]: value } : b));
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
            description: projectDescription.trim() || undefined,
            budget: budgetNumber,
            hasOnlyOneBuilding: buildingType === 'single',
            startDate: new Date().toISOString(), // Defaults to project creation date
            projectType: 'ongoing', // Defaults to ongoing
            notes: '',
            slabsCount: buildingType === 'single' ? slabsCount : undefined,
            hasTerrace: buildingType === 'single' ? hasTerrace : undefined,
            buildings: buildingType === 'multiple' ? buildings.map(b => ({
                name: b.name.trim() || 'Building',
                slabsCount: b.slabsCount,
                hasTerrace: b.hasTerrace
            })) : undefined
        } as any;

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
                                <Text style={styles.headerSubtitle}>
                                    Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].label}
                                </Text>
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
                                        {!isNaN(parseFloat(estimatedBudget)) && parseFloat(estimatedBudget) > 0 ? (
                                            <Text style={styles.helperTextValue}>≈ {fmtINR(parseFloat(estimatedBudget))}</Text>
                                        ) : (
                                            <Text style={styles.helperText}>Enter total estimated budget</Text>
                                        )}
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
                                                <Ionicons name="business-outline" size={18} color="#3A78B5" />
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
                                                <Ionicons name="layers-outline" size={18} color="#3A78B5" />
                                            </View>
                                            <View style={styles.radioTextBlock}>
                                                <Text style={styles.radioTitle}>Multiple Buildings</Text>
                                                <Text style={styles.radioSubtitle}>This project has multiple buildings</Text>
                                            </View>
                                        </TouchableOpacity>

                                        {buildingType === 'single' ? (
                                            <View style={styles.buildingConfigCard}>
                                                <Text style={styles.buildingConfigTitle}>Building Configuration</Text>
                                                
                                                {/* Slabs counter */}
                                                <View style={styles.counterRow}>
                                                    <View style={styles.counterLabelBlock}>
                                                        <Text style={styles.counterLabel}>Number of Slabs</Text>
                                                        <Text style={styles.counterSublabel}>Select total slab sections to track</Text>
                                                    </View>
                                                    <View style={styles.counterControlWrap}>
                                                        <TouchableOpacity
                                                            style={[styles.counterBtn, slabsCount <= 1 && styles.counterBtnDisabled]}
                                                            onPress={() => slabsCount > 1 && setSlabsCount(slabsCount - 1)}
                                                            disabled={slabsCount <= 1}
                                                            activeOpacity={0.7}
                                                        >
                                                            <Ionicons name="remove" size={16} color={slabsCount <= 1 ? "#94A3B8" : "#3A78B5"} />
                                                        </TouchableOpacity>
                                                        <Text style={styles.counterValue}>{slabsCount}</Text>
                                                        <TouchableOpacity
                                                            style={[styles.counterBtn, slabsCount >= 15 && styles.counterBtnDisabled]}
                                                            onPress={() => slabsCount < 15 && setSlabsCount(slabsCount + 1)}
                                                            disabled={slabsCount >= 15}
                                                            activeOpacity={0.7}
                                                        >
                                                            <Ionicons name="add" size={16} color={slabsCount >= 15 ? "#94A3B8" : "#3A78B5"} />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>

                                                {/* Terrace checkbox */}
                                                <TouchableOpacity
                                                    style={styles.checkboxRow}
                                                    onPress={() => setHasTerrace(!hasTerrace)}
                                                    activeOpacity={0.75}
                                                >
                                                    <View style={[styles.checkboxBox, hasTerrace && styles.checkboxBoxSelected]}>
                                                        {hasTerrace && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                                                    </View>
                                                    <View style={styles.checkboxLabelBlock}>
                                                        <Text style={styles.checkboxLabel}>Include Terrace</Text>
                                                        <Text style={styles.checkboxSublabel}>Auto-create terrace progress section</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <View style={{ marginTop: 12 }}>
                                                <Text style={styles.sectionLabel}>BUILDINGS CONFIGURATION</Text>
                                                
                                                {buildings.map((item, index) => (
                                                    <View key={item.key} style={styles.buildingConfigCard}>
                                                        <View style={styles.buildingConfigHeader}>
                                                            <Text style={styles.buildingConfigCardTitle}>Building {index + 1}</Text>
                                                            {buildings.length > 1 && (
                                                                <TouchableOpacity
                                                                    style={styles.deleteBuildingBtn}
                                                                    onPress={() => deleteBuildingConfig(item.key)}
                                                                    activeOpacity={0.7}
                                                                >
                                                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                                                </TouchableOpacity>
                                                            )}
                                                        </View>

                                                        <Text style={styles.fieldLabel}>Building Name</Text>
                                                        <TextInput
                                                            style={[styles.input, { marginBottom: 12 }]}
                                                            value={item.name}
                                                            onChangeText={(text) => updateBuildingConfig(item.key, 'name', text)}
                                                            placeholder={`Building ${index + 1}`}
                                                            placeholderTextColor="#9CA3AF"
                                                        />

                                                        {/* Slabs counter */}
                                                        <View style={styles.counterRow}>
                                                            <View style={styles.counterLabelBlock}>
                                                                <Text style={styles.counterLabel}>Number of Slabs</Text>
                                                            </View>
                                                            <View style={styles.counterControlWrap}>
                                                                <TouchableOpacity
                                                                    style={[styles.counterBtn, item.slabsCount <= 1 && styles.counterBtnDisabled]}
                                                                    onPress={() => item.slabsCount > 1 && updateBuildingConfig(item.key, 'slabsCount', item.slabsCount - 1)}
                                                                    disabled={item.slabsCount <= 1}
                                                                    activeOpacity={0.7}
                                                                >
                                                                    <Ionicons name="remove" size={16} color={item.slabsCount <= 1 ? "#94A3B8" : "#3A78B5"} />
                                                                </TouchableOpacity>
                                                                <Text style={styles.counterValue}>{item.slabsCount}</Text>
                                                                <TouchableOpacity
                                                                    style={[styles.counterBtn, item.slabsCount >= 15 && styles.counterBtnDisabled]}
                                                                    onPress={() => item.slabsCount < 15 && updateBuildingConfig(item.key, 'slabsCount', item.slabsCount + 1)}
                                                                    disabled={item.slabsCount >= 15}
                                                                    activeOpacity={0.7}
                                                                >
                                                                    <Ionicons name="add" size={16} color={item.slabsCount >= 15 ? "#94A3B8" : "#3A78B5"} />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>

                                                        {/* Terrace checkbox */}
                                                        <TouchableOpacity
                                                            style={styles.checkboxRow}
                                                            onPress={() => updateBuildingConfig(item.key, 'hasTerrace', !item.hasTerrace)}
                                                            activeOpacity={0.75}
                                                        >
                                                            <View style={[styles.checkboxBox, item.hasTerrace && styles.checkboxBoxSelected]}>
                                                                {item.hasTerrace && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                                                            </View>
                                                            <View style={styles.checkboxLabelBlock}>
                                                                <Text style={styles.checkboxLabel}>Include Terrace</Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    </View>
                                                ))}

                                                <TouchableOpacity
                                                    style={styles.addBuildingBtnWrap}
                                                    onPress={addBuildingConfig}
                                                    activeOpacity={0.8}
                                                >
                                                    <Ionicons name="add-circle-outline" size={18} color="#3A78B5" />
                                                    <Text style={styles.addBuildingBtnText}>Add Another Building</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {currentStep === 3 && (
                                    <View>
                                        {/* Review summary — what will be created */}
                                        <View style={styles.summaryCard}>
                                            <View style={styles.summaryIconWrap}>
                                                <Ionicons name="business" size={18} color="#3A78B5" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.summaryName} numberOfLines={1}>
                                                    {projectName.trim() || 'Untitled Project'}
                                                </Text>
                                                <Text style={styles.summaryMeta} numberOfLines={1}>
                                                    {fmtINR(parseFloat(estimatedBudget) || 0)}
                                                    {'  ·  '}
                                                    {buildingType === 'single'
                                                        ? `1 building · ${slabsCount} slab${slabsCount > 1 ? 's' : ''}${hasTerrace ? ' + terrace' : ''}`
                                                        : `${buildings.length} buildings`}
                                                </Text>
                                            </View>
                                            <TouchableOpacity onPress={() => jumpToStep(1)} hitSlop={8}>
                                                <Text style={styles.summaryEditLink}>Edit</Text>
                                            </TouchableOpacity>
                                        </View>

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
                                                                <View style={[styles.staffStatusDot, { backgroundColor: selected ? '#3A78B5' : '#10B981' }]} />
                                                                <Text style={styles.staffStatusText}>{selected ? 'Assigned' : 'Available'}</Text>
                                                            </View>
                                                        </View>
                                                        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                                                            {selected && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
                                                        </View>
                                                    </TouchableOpacity>

                                                    {selected && (
                                                        <View style={styles.paymentRow}>
                                                            <Ionicons name="wallet-outline" size={15} color="#3A78B5" />
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
                                                <View style={styles.emptyStaffIconWrap}>
                                                    <Ionicons name="people-outline" size={26} color="#94A3B8" />
                                                </View>
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
                                    <TouchableOpacity
                                        style={[styles.primaryButtonWrap, styles.primaryButtonSolid, !isStep1Valid && styles.primaryButtonDimmed]}
                                        onPress={goNext}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={styles.primaryButtonText}>Next</Text>
                                        <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </>
                            ) : currentStep === 2 ? (
                                <>
                                    <TouchableOpacity style={styles.secondaryButton} onPress={goBack} activeOpacity={0.7}>
                                        <Ionicons name="arrow-back" size={16} color="#374151" />
                                        <Text style={styles.secondaryButtonText}>Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.primaryButtonWrap, styles.primaryButtonSolid]} onPress={goNext} activeOpacity={0.85}>
                                        <Text style={styles.primaryButtonText}>Next</Text>
                                        <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <TouchableOpacity style={styles.secondaryButton} onPress={goBack} activeOpacity={0.7} disabled={isSubmitting}>
                                        <Ionicons name="arrow-back" size={16} color="#374151" />
                                        <Text style={styles.secondaryButtonText}>Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.primaryButtonWrap, styles.primaryButtonSolid, { flex: 1.6, opacity: isSubmitting ? 0.7 : 1 }]}
                                        onPress={handleSubmit}
                                        activeOpacity={0.85}
                                        disabled={isSubmitting}
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
                                                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                                                <Text style={styles.primaryButtonText}>Create Project</Text>
                                            </>
                                        )}
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
        height: '95%',
    },
    sheet: {
        flex: 1,
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
        backgroundColor: '#3A78B5',
    },
    stepCircleActive: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#3A78B5',
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
        color: '#3A78B5',
    },
    stepLabel: {
        fontSize: 10.5,
        fontWeight: '600',
        color: '#94A3B8',
        textAlign: 'center',
    },
    stepLabelActive: {
        color: '#3A78B5',
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
        backgroundColor: '#3A78B5',
        borderRadius: 2,
    },

    // Step content
    stepContentWrap: {
        flex: 1,
    },
    scroll: {
        flex: 1,
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
        color: '#3A78B5',
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
        borderColor: '#3A78B5',
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
    helperTextValue: {
        fontSize: 12.5,
        color: '#3A78B5',
        fontWeight: '700',
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
        color: '#3A78B5',
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
        borderColor: '#3A78B5',
        backgroundColor: '#EAF0FE',
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
        borderColor: '#3A78B5',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#3A78B5',
    },
    radioIconChip: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#EAF0FE',
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
        borderColor: '#3A78B5',
        backgroundColor: '#EAF0FE',
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: '#EAF0FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarCircleSelected: {
        backgroundColor: '#3A78B5',
    },
    avatarText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#3A78B5',
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
        backgroundColor: '#3A78B5',
        borderColor: '#3A78B5',
    },
    paymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginTop: -4,
        marginBottom: 12,
    },
    paymentLabel: {
        flex: 1,
        fontSize: 12.5,
        color: '#475569',
        fontWeight: '600',
    },
    paymentInput: {
        minWidth: 80,
        textAlign: 'right',
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C4D8FC',
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    emptyStaffContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyStaffIconWrap: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
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
        shadowColor: '#3A78B5',
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
    primaryButtonSolid: {
        backgroundColor: '#3A78B5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 16,
    },
    primaryButtonText: {
        fontSize: 14.5,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    primaryButtonDimmed: {
        opacity: 0.5,
        shadowOpacity: 0,
        elevation: 0,
    },

    // Step-3 review summary card
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#EAF0FE',
        borderWidth: 1,
        borderColor: '#C4D8FC',
        borderRadius: 16,
        padding: 14,
        marginBottom: 18,
    },
    summaryIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryName: {
        fontSize: 14.5,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    summaryMeta: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3A78B5',
    },
    summaryEditLink: {
        fontSize: 13,
        fontWeight: '700',
        color: '#3A78B5',
    },
    buildingConfigCard: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        marginTop: 12,
    },
    buildingConfigHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    buildingConfigCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    deleteBuildingBtn: {
        padding: 4,
    },
    buildingConfigTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        marginBottom: 12,
    },
    counterLabelBlock: {
        flex: 1,
    },
    counterLabel: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#374151',
    },
    counterSublabel: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    counterControlWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    counterBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EAF0FE',
        borderWidth: 1,
        borderColor: '#C4D8FC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterBtnDisabled: {
        backgroundColor: '#F1F5F9',
        borderColor: '#E2E8F0',
    },
    counterValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        minWidth: 20,
        textAlign: 'center',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
        paddingVertical: 4,
    },
    checkboxBox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    checkboxBoxSelected: {
        backgroundColor: '#3A78B5',
        borderColor: '#3A78B5',
    },
    checkboxLabelBlock: {
        flex: 1,
    },
    checkboxLabel: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#374151',
    },
    checkboxSublabel: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    addBuildingBtnWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1.5,
        borderColor: '#3A78B5',
        borderStyle: 'dashed',
        borderRadius: 16,
        paddingVertical: 12,
        marginTop: 4,
        marginBottom: 16,
        backgroundColor: '#EAF0FE',
    },
    addBuildingBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#3A78B5',
    },
});

export default AddProjectModal;
