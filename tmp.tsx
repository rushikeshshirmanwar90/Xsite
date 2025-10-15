import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Components
import MaterialForm from '../components/MaterialForm';
import SectionManager from '../components/SectionManager';

// Types
import { Material, MaterialEntry } from './types/material';
import { Section } from './types/section';

// Constants

// Define periods for filtering
const PERIODS = ['Today', '1 Week', '15 Days', '1 Month', '3 Months', '6 Months', 'Custom'];

// Sample data for imported materials
const importedMaterials: Material[] = [
    {
        id: 1,
        name: 'Concrete',
        category: 'foundation',
        quantity: 10,
        unit: 'cubic meters',
        price: 25000,
        date: '15/1/2024',
        icon: 'cube-outline',
        color: '#8B5CF6',
    },
    {
        id: 2,
        name: 'Steel Bars',
        category: 'structural',
        quantity: 50,
        unit: 'pieces',
        price: 150000,
        date: '16/1/2024',
        icon: 'barbell-outline',
        color: '#64748B',
    },
    // Add more sample data as needed
];

const usedMaterials: Material[] = [
    {
        id: 1,
        name: 'Concrete',
        category: 'foundation',
        quantity: 8,
        unit: 'cubic meters',
        price: 20000,
        date: '16/1/2024',
        icon: 'cube-outline',
        color: '#8B5CF6',
    },
    {
        id: 2,
        name: 'Steel Bars',
        category: 'structural',
        quantity: 35,
        unit: 'pieces',
        price: 105000,
        date: '17/1/2024',
        icon: 'barbell-outline',
        color: '#64748B',
    },
    // Add more sample data as needed
];

const Details: React.FC = () => {
    const { width } = useWindowDimensions();
    // State
    const [activeTab, setActiveTab] = useState<'imported' | 'used'>('imported');
    const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0]);
    const [showMaterialForm, setShowMaterialForm] = useState(false);
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
    const [showSpecDropdown, setShowSpecDropdown] = useState<string | null>(null);
    const [materialEntries, setMaterialEntries] = useState<MaterialEntry[]>([]);
    const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        unit: '',
        quantity: '',
        location: '',
        status: 'received' as const,
        specs: {} as Record<string, any>,
        notes: '',
    });

    const cardAnimations = useRef(importedMaterials.map(() => new Animated.Value(0))).current;

    // Initialize with a default section if none exists
    useEffect(() => {
        if (sections.length === 0) {
            const defaultSection: Section = {
                id: 'default-section',
                name: 'General',
                description: 'Default section for all materials',
                createdAt: new Date().toISOString(),
            };
            setSections([defaultSection]);
            setCurrentSectionId(defaultSection.id);
        }
    }, []);

    // Filter materials based on search query
    const filteredMaterials = useMemo(() => {
        const materials = activeTab === 'imported' ? importedMaterials : usedMaterials;
        if (!searchQuery.trim()) return materials;

        const query = searchQuery.toLowerCase();
        return materials.filter(material =>
            material.name.toLowerCase().includes(query) ||
            material.category.toLowerCase().includes(query) ||
            material.unit.toLowerCase().includes(query)
        );
    }, [activeTab, searchQuery]);

    // Calculate totals
    const { totalItems, totalCost } = useMemo(() => {
        const materials = activeTab === 'imported' ? importedMaterials : usedMaterials;
        return {
            totalItems: materials.reduce((sum, mat) => sum + mat.quantity, 0),
            totalCost: materials.reduce((sum, mat) => sum + mat.price, 0)
        };
    }, [activeTab]);

    // Helper functions for material calculations
    const formatPrice = (price: number) => {
        return `₹${price.toLocaleString('en-IN')}`;
    };

    const getImportedQuantity = (material: Material) => {
        const importedMaterial = importedMaterials.find(m => m.id === material.id);
        return importedMaterial ? importedMaterial.quantity : 0;
    };

    const getAvailableQuantity = (material: Material) => {
        const importedMaterial = importedMaterials.find(m => m.id === material.id);
        const usedMaterial = usedMaterials.find(m => m.id === material.id);

        if (!importedMaterial) return 0;
        if (!usedMaterial) return importedMaterial.quantity;

        return importedMaterial.quantity - usedMaterial.quantity;
    };

    const getAvailabilityPercentage = (material: Material) => {
        const importedMaterial = importedMaterials.find(m => m.id === material.id);
        const usedMaterial = usedMaterials.find(m => m.id === material.id);

        if (!importedMaterial) return 0;
        if (!usedMaterial) return 100;

        const available = importedMaterial.quantity - usedMaterial.quantity;
        return Math.round((available / importedMaterial.quantity) * 100);
    };

    const getQuantityWasted = (material: Material) => {
        const usedMaterial = usedMaterials.find(m => m.id === material.id);
        if (!usedMaterial) return 0;
        return Math.round(usedMaterial.quantity * 0.1); // 10% wastage
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            foundation: '#8B5CF6',
            structural: '#64748B',
            electrical: '#F59E0B',
            plumbing: '#3B82F6',
            finishing: '#EF4444',
            walls: '#DC2626',
        };
        return colors[category.toLowerCase()] || '#6B7280';
    };

    const handleSectionSelect = useCallback((sectionId: string) => {
        setCurrentSectionId(sectionId);
    }, []);

    const handleAddSection = useCallback((newSection: Section) => {
        setSections(prev => [...prev, newSection]);
        setCurrentSectionId(newSection.id);
    }, []);

    const handleMaterialPress = useCallback((material: Material) => {
        router.push({
            pathname: '/material-details/[id]',
            params: {
                id: material.id.toString(),
                fromTab: activeTab
            }
        });
    }, [activeTab]);

    // Material Templates
    const MATERIAL_TEMPLATES = {
        steel_road: {
            name: 'Steel Road',
            category: 'structural',
            unit: 'meter',
            specFields: ['diameter', 'length', 'weight'],
            icon: 'barbell-outline',
            color: '#64748B',
        },
        brick: {
            name: 'Brick',
            category: 'walls',
            unit: 'pieces',
            specFields: ['type', 'quality'],
            icon: 'grid-outline',
            color: '#DC2626',
        },
        electric_pipe: {
            name: 'Electric Pipe',
            category: 'electrical',
            unit: 'meter',
            specFields: ['diameter', 'material'],
            icon: 'flash-outline',
            color: '#F59E0B',
        },
        electric_wire: {
            name: 'Electric Wire',
            category: 'electrical',
            unit: 'meter',
            specFields: ['sqmm', 'meter', 'material', 'color'],
            icon: 'flash-outline',
            color: '#F59E0B',
        },
        plumbing_pipe: {
            name: 'Plumbing Pipe',
            category: 'plumbing',
            unit: 'meter',
            specFields: ['itemType', 'diameter', 'material'],
            icon: 'water-outline',
            color: '#3B82F6',
        },
        granite_sheet: {
            name: 'Granite Sheet',
            category: 'finishing',
            unit: 'sheets',
            specFields: ['size', 'thickness', 'color'],
            icon: 'cube-outline',
            color: '#8B5CF6',
        },
        wall_putty: {
            name: 'Wall Putty',
            category: 'finishing',
            unit: 'bags',
            specFields: ['brand', 'coverage'],
            icon: 'color-palette-outline',
            color: '#EF4444',
        },
    };

    type SpecField =
        | { type: 'text' | 'number'; label: string; placeholder?: string }
        | { type: 'select'; label: string; options: string[] };

    const SPEC_FIELD_CONFIG: Record<string, SpecField> = {
        diameter: { type: 'text', label: 'Diameter', placeholder: 'e.g., 8mm, 2inch' },
        length: { type: 'text', label: 'Length', placeholder: 'e.g., 20feet, 100m' },
        weight: { type: 'text', label: 'Weight', placeholder: 'e.g., 50kg' },
        sqmm: { type: 'number', label: 'SQ.MM', placeholder: 'e.g., 6, 10' },
        meter: { type: 'number', label: 'Meter', placeholder: 'Enter meters' },
        size: { type: 'text', label: 'Size', placeholder: 'e.g., 2x4 feet' },
        thickness: { type: 'text', label: 'Thickness', placeholder: 'e.g., 16mm' },
        material: {
            type: 'select',
            label: 'Material',
            options: ['copper', 'aluminum', 'PVC', 'metal', 'other'],
        },
        itemType: {
            type: 'select',
            label: 'Item Type',
            options: ['pipe', 'fitting', 'valve', 'junction', 'other'],
        },
        color: { type: 'text', label: 'Color', placeholder: 'Enter color' },
        brand: { type: 'text', label: 'Brand', placeholder: 'Enter brand' },
        coverage: { type: 'text', label: 'Coverage', placeholder: 'sq ft per bag' },
        type: {
            type: 'select',
            label: 'Type',
            options: ['standard', 'jumbo', 'interlocking'],
        },
        quality: {
            type: 'select',
            label: 'Quality',
            options: ['A1', 'B1', 'C1'],
        },
    };

    // These state variables are already declared above, removing duplicates

    const handleTemplateSelect = (templateKey: string) => {
        const template = MATERIAL_TEMPLATES[templateKey as keyof typeof MATERIAL_TEMPLATES];
        setFormData({
            name: template.name,
            category: template.category,
            unit: template.unit,
            quantity: '',
            location: '',
            status: 'received',
            specs: {},
            notes: '',
        });
        setSelectedTemplateKey(templateKey);
    };

    const handleSpecChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            specs: { ...prev.specs, [field]: value },
        }));
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.category || !formData.unit || !formData.quantity) {
            alert('Please fill in all required fields');
            return;
        }

        const newEntry = {
            id: Date.now().toString(),
            ...formData,
            quantity: parseFloat(formData.quantity),
            date: new Date().toLocaleDateString('en-IN'),
        };

        setMaterialEntries([...materialEntries, newEntry]);
        resetForm();
        setShowMaterialForm(false);
        alert('Material entry saved successfully!');
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category: '',
            unit: '',
            quantity: '',
            location: '',
            status: 'received',
            specs: {},
            notes: '',
        });
        setSelectedTemplateKey(null);
        setShowSpecDropdown(null);
    };

    const getSpecFields = () => {
        if (!selectedTemplateKey) return [];
        const template = MATERIAL_TEMPLATES[selectedTemplateKey as keyof typeof MATERIAL_TEMPLATES];
        return template?.specFields || [];
    };

    const handleSubmitMaterial = () => {
        if (!formData.name || !formData.category || !formData.unit || !formData.quantity) {
            alert('Please fill in all required fields');
            return;
        }

        const newEntry = {
            id: Date.now().toString(),
            ...formData,
            quantity: parseFloat(formData.quantity),
            date: new Date().toLocaleDateString('en-IN'),
        };

        setMaterialEntries([...materialEntries, newEntry]);
        resetForm();
        setShowMaterialForm(false);
        alert('Material entry saved successfully!');
    };

    const handleCloseMaterialForm = () => {
        resetForm();
        setShowMaterialForm(false);
    };

    const specFields = getSpecFields();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Main Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Material Management</Text>
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Total Items</Text>
                                <Text style={styles.statValue}>{totalItems}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Total Cost</Text>
                                <Text style={[styles.statValue, styles.costValue]}>{formatPrice(totalCost)}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowMaterialForm(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="add" size={24} color="#fff" style={styles.addIcon} />
                </TouchableOpacity>
            </View>

            {/* Section Manager */}
            <View style={styles.sectionContainer}>
                <SectionManager
                    onSectionSelect={handleSectionSelect}
                    selectedSection={currentSectionId}
                    onAddSection={handleAddSection}
                    sections={sections}
                    style={styles.sectionManager}
                />
            </View>

            {/* Search and Filter Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search materials..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    ) : null}
                </View>
                <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
                    <Ionicons name="filter" size={20} color="#4B5563" />
                </TouchableOpacity>
            </View>

            {/* Period and Tab Selector */}
            <View style={styles.periodAndTabContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.periodContainer}
                >
                    {PERIODS.map((period, index) => (
                        <TouchableOpacity
                            key={period}
                            style={[
                                styles.periodButton,
                                selectedPeriod === period && styles.periodButtonActive,
                                index === 0 && styles.firstPeriodButton,
                                index === PERIODS.length - 1 && styles.lastPeriodButton
                            ]}
                            onPress={() => setSelectedPeriod(period)}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                styles.periodText,
                                selectedPeriod === period && styles.periodTextActive
                            ]}>
                                {period}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'imported' && styles.activeTab]}
                        onPress={() => setActiveTab('imported')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="cube-outline" size={16} color={activeTab === 'imported' ? '#0EA5E9' : '#6B7280'} />
                        <Text style={[styles.tabText, activeTab === 'imported' && styles.activeTabText]}>
                            Material Available
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'used' && styles.activeTab]}
                        onPress={() => setActiveTab('used')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="trending-down-outline" size={16} color={activeTab === 'used' ? '#0EA5E9' : '#6B7280'} />
                        <Text style={[styles.tabText, activeTab === 'used' && styles.activeTabText]}>
                            Material Used
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Material Form Modal */}
            <Modal
                visible={showMaterialForm}
                animationType="slide"
                onRequestClose={() => setShowMaterialForm(false)}
            >
                <SafeAreaView style={styles.formContainer}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScrollContent}>
                            {/* Form Header */}
                            <View style={styles.formHeader}>
                                <Text style={styles.formTitle}>Add Material Entry</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowMaterialForm(false);
                                        resetForm();
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="close-circle-outline" size={28} color="#64748B" />
                                </TouchableOpacity>
                            </View>

                            {/* Quick Template Selection */}
                            <View style={styles.templateSection}>
                                <Text style={styles.sectionLabel}>Quick Select Material Type</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.templateContainer}
                                >
                                    {Object.entries(MATERIAL_TEMPLATES).map(([key, template]) => (
                                        <TouchableOpacity
                                            key={key}
                                            style={[
                                                styles.templateButton,
                                                selectedTemplateKey === key && styles.templateButtonActive,
                                            ]}
                                            onPress={() => handleTemplateSelect(key)}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name={template.icon as any}
                                                size={20}
                                                color={selectedTemplateKey === key ? '#fff' : template.color}
                                            />
                                            <Text
                                                style={[
                                                    styles.templateButtonText,
                                                    selectedTemplateKey === key && styles.templateButtonTextActive,
                                                ]}
                                            >
                                                {template.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Basic Details */}
                            <View style={styles.formSection}>
                                <Text style={styles.sectionLabel}>Basic Details</Text>

                                {/* Material Name */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Material Name *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g., Steel Road, Brick"
                                        value={formData.name}
                                        onChangeText={(value) => handleInputChange('name', value)}
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>

                                {/* Category */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Category *</Text>
                                    <TouchableOpacity
                                        style={styles.selectInput}
                                        onPress={() => setShowSpecDropdown(showSpecDropdown === 'category' ? null : 'category')}
                                    >
                                        <Text style={[styles.selectInputText, !formData.category && styles.placeholderText]}>
                                            {formData.category || 'Select Category'}
                                        </Text>
                                        <Ionicons name={showSpecDropdown === 'category' ? 'chevron-up' : 'chevron-down'} size={20} color="#64748B" />
                                    </TouchableOpacity>
                                    {showSpecDropdown === 'category' && (
                                        <View style={styles.dropdown}>
                                            {['foundation', 'structural', 'walls', 'electrical', 'plumbing', 'finishing', 'other'].map((cat) => (
                                                <TouchableOpacity
                                                    key={cat}
                                                    style={styles.dropdownItem}
                                                    onPress={() => {
                                                        handleInputChange('category', cat);
                                                        setShowSpecDropdown(null);
                                                    }}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={styles.dropdownItemText}>{cat}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {/* Unit */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Unit *</Text>
                                    <TouchableOpacity
                                        style={styles.selectInput}
                                        onPress={() => setShowSpecDropdown(showSpecDropdown === 'unit' ? null : 'unit')}
                                    >
                                        <Text style={[styles.selectInputText, !formData.unit && styles.placeholderText]}>
                                            {formData.unit || 'Select Unit'}
                                        </Text>
                                        <Ionicons name={showSpecDropdown === 'unit' ? 'chevron-up' : 'chevron-down'} size={20} color="#64748B" />
                                    </TouchableOpacity>
                                    {showSpecDropdown === 'unit' && (
                                        <View style={styles.dropdown}>
                                            {['kg', 'meter', 'sqmm', 'pieces', 'sheets', 'cubic_meter', 'bags'].map((unit) => (
                                                <TouchableOpacity
                                                    key={unit}
                                                    style={styles.dropdownItem}
                                                    onPress={() => {
                                                        handleInputChange('unit', unit);
                                                        setShowSpecDropdown(null);
                                                    }}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={styles.dropdownItemText}>{unit}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {/* Quantity */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Quantity *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter quantity"
                                        value={formData.quantity}
                                        onChangeText={(value) => handleInputChange('quantity', value)}
                                        keyboardType="decimal-pad"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>

                                {/* Location */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Location</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g., Foundation Block A"
                                        value={formData.location}
                                        onChangeText={(value) => handleInputChange('location', value)}
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>

                                {/* Status */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Status</Text>
                                    <TouchableOpacity
                                        style={styles.selectInput}
                                        onPress={() => setShowSpecDropdown(showSpecDropdown === 'status' ? null : 'status')}
                                    >
                                        <Text style={styles.selectInputText}>{formData.status}</Text>
                                        <Ionicons name={showSpecDropdown === 'status' ? 'chevron-up' : 'chevron-down'} size={20} color="#64748B" />
                                    </TouchableOpacity>
                                    {showSpecDropdown === 'status' && (
                                        <View style={styles.dropdown}>
                                            {['received', 'in_use', 'stored', 'damaged'].map((status) => (
                                                <TouchableOpacity
                                                    key={status}
                                                    style={styles.dropdownItem}
                                                    onPress={() => {
                                                        setFormData((prev) => ({ ...prev, status: status as any }));
                                                        setShowSpecDropdown(null);
                                                    }}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={styles.dropdownItemText}>{status}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Dynamic Specification Fields */}
                            {specFields.length > 0 && (
                                <View style={styles.formSection}>
                                    <Text style={styles.sectionLabel}>Material Specifications</Text>
                                    {specFields.map((field) => {
                                        const config = SPEC_FIELD_CONFIG[field as keyof typeof SPEC_FIELD_CONFIG];
                                        if (!config) return null;

                                        return (
                                            <View key={field} style={styles.formGroup}>
                                                <Text style={styles.label}>{config.label}</Text>
                                                {config.type === 'select' ? (
                                                    <>
                                                        <TouchableOpacity
                                                            style={styles.selectInput}
                                                            onPress={() => setShowSpecDropdown(showSpecDropdown === field ? null : field)}
                                                        >
                                                            <Text style={[styles.selectInputText, !formData.specs[field] && styles.placeholderText]}>
                                                                {formData.specs[field] || `Select ${config.label}`}
                                                            </Text>
                                                            <Ionicons name={showSpecDropdown === field ? 'chevron-up' : 'chevron-down'} size={20} color="#64748B" />
                                                        </TouchableOpacity>
                                                        {showSpecDropdown === field && (
                                                            <View style={styles.dropdown}>
                                                                {(config.options || []).map((opt) => (
                                                                    <TouchableOpacity
                                                                        key={opt}
                                                                        style={styles.dropdownItem}
                                                                        onPress={() => {
                                                                            handleSpecChange(field, opt);
                                                                            setShowSpecDropdown(null);
                                                                        }}
                                                                        activeOpacity={0.7}
                                                                    >
                                                                        <Text style={styles.dropdownItemText}>{opt}</Text>
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </View>
                                                        )}
                                                    </>
                                                ) : (
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder={config.placeholder}
                                                        value={formData.specs[field] || ''}
                                                        onChangeText={(value) => handleSpecChange(field, value)}
                                                        keyboardType={config.type === 'number' ? 'decimal-pad' : 'default'}
                                                        placeholderTextColor="#9CA3AF"
                                                    />
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            {/* Notes */}
                            <View style={styles.formSection}>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Additional Notes</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        placeholder="Any additional information..."
                                        value={formData.notes}
                                        onChangeText={(value) => handleInputChange('notes', value)}
                                        multiline={true}
                                        numberOfLines={4}
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            {/* Submit Button */}
                            <View style={styles.formActions}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => {
                                        setShowMaterialForm(false);
                                        resetForm();
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.submitButton}
                                    onPress={handleSubmit}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.submitButtonText}>Save Entry</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            {/* Materials List */}
            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.materialsSection}>
                    {filteredMaterials.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyStateText}>No materials found</Text>
                            <Text style={styles.emptyStateSubtext}>
                                {searchQuery
                                    ? 'Try a different search term'
                                    : 'Add a new material to get started'}
                            </Text>
                        </View>
                    ) : (
                        filteredMaterials.map((material, index) => (
                            <Animated.View
                                key={material.id}
                                style={[
                                    styles.materialCard,
                                    {
                                        opacity: cardAnimations[index] || 1,
                                        transform: [{
                                            translateY: (cardAnimations[index] || new Animated.Value(1)).interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [50, 0],
                                            })
                                        }]
                                    }
                                ]}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.95}
                                    onPress={() => handleMaterialPress(material)}
                                    style={styles.materialCardInner}
                                >
                                    <View style={styles.materialHeader}>
                                        <View style={styles.materialTitleSection}>
                                            <View style={[styles.iconContainer, { backgroundColor: material.color + '20' }]}>
                                                <Ionicons name={material.icon as any} size={24} color={material.color} />
                                            </View>
                                            <View style={styles.materialTitleInfo}>
                                                <Text style={styles.materialNameText}>{material.name}</Text>
                                                <View style={[styles.categoryTag, { backgroundColor: material.color }]}>
                                                    <Text style={styles.categoryText}>
                                                        {material.category}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.dateContainer}>
                                            <Text style={styles.dateText}>{material.date}</Text>
                                            <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
                                                <Ionicons name="ellipsis-vertical" size={16} color="#64748B" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.simpleProgressContainer}>
                                        <View style={styles.progressBarWithLabels}>
                                            <View style={styles.progressStartLabel}>
                                                <Text style={styles.progressStartLabel}>
                                                    {activeTab === 'imported' ? 'Available:' : 'Quantity Used:'}
                                                </Text>
                                                <Text style={styles.progressStartLabel}>
                                                    {activeTab === 'imported'
                                                        ? `${getAvailableQuantity(material)} ${material.unit}`
                                                        : `${material.quantity} ${material.unit}`}
                                                </Text>
                                            </View>
                                            <View style={styles.progressBarBackground}>
                                                <View
                                                    style={[
                                                        activeTab === 'imported' ? styles.progressBarFillGreen : styles.progressBarFillRed,
                                                        {
                                                            width: activeTab === 'imported'
                                                                ? `${getAvailabilityPercentage(material)}%`
                                                                : '100%'
                                                        }
                                                    ]}
                                                />
                                            </View>

                                            <View style={styles.progressEndLabel}>
                                                <Text style={styles.progressEndLabel}>
                                                    {activeTab === 'imported' ? 'Total:' : 'Quantity Wasted:'}
                                                </Text>
                                                <Text style={styles.progressEndLabel}>
                                                    {activeTab === 'imported'
                                                        ? `${getImportedQuantity(material)} ${material.unit}`
                                                        : `${getQuantityWasted(material)} ${material.unit}`}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Cost:</Text>
                                            <Text style={[styles.detailValue, styles.priceValue]}>
                                                {formatPrice(material.price)}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Material Form Modal */}
            <Modal
                visible={showMaterialForm}
                animationType="slide"
                onRequestClose={() => setShowMaterialForm(false)}
            >
                <MaterialForm
                    templates={MATERIAL_TEMPLATES}
                    selectedTemplateKey={selectedTemplateKey}
                    onTemplateSelect={setSelectedTemplateKey}
                    formData={formData}
                    onChangeFormData={setFormData}
                    onSubmit={handleSubmitMaterial}
                    onCancel={handleCloseMaterialForm}
                    showSpecDropdown={showSpecDropdown}
                    onToggleSpecDropdown={setShowSpecDropdown}
                />
            </Modal>
        </SafeAreaView>
    );
};

// Helper functions for dynamic styles
const getPeriodButtonStyle = (isActive: boolean, isFirst: boolean, isLast: boolean) => ({
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: isActive ? '#3B82F6' : '#F3F4F6',
    borderTopLeftRadius: isFirst ? 8 : 0,
    borderBottomLeftRadius: isFirst ? 8 : 0,
    borderTopRightRadius: isLast ? 8 : 0,
    borderBottomRightRadius: isLast ? 8 : 0,
    marginLeft: isFirst ? 0 : 1,
    marginRight: isLast ? 0 : 1,
});

const getPeriodTextStyle = (isActive: boolean) => ({
    fontSize: 12,
    fontWeight: isActive ? '600' : '500',
    color: isActive ? '#fff' : '#4B5563',
});

const getProgressBarFillStyle = (percentage: number, isRed = false) => ({
    height: '100%',
    width: `${Math.min(100, Math.max(0, percentage))}%`,
    backgroundColor: isRed ? '#EF4444' : '#10B981',
    borderRadius: 4,
});

// Define styles with proper typing
const styles = StyleSheet.create({
    // Layout
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    // Progress Bar and Card Styles
    simpleProgressContainer: {
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    progressBarWithLabels: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    progressStartLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
        marginBottom: 4,
        alignItems: 'flex-start',
        marginRight: 12,
        minWidth: 80,
    },
    progressEndLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 4,
        textAlign: 'right',
        alignItems: 'flex-end',
        marginLeft: 12,
        minWidth: 80,
    },
    progressBarBackground: {
        flex: 1,
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFillGreen: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 4,
    },
    progressBarFillRed: {
        height: '100%',
        backgroundColor: '#EF4444',
        borderRadius: 4,
    },
    dateContainer: {
        alignItems: 'flex-end',
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#3B82F6',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        marginRight: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginRight: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    costValue: {
        color: '#fff',
        fontWeight: '600',
    },
    addButton: {
        padding: 8,
    },
    addIcon: {
        marginLeft: 4,
    },

    // Section Manager
    sectionContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },

    // Search and Filter
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 14,
        color: '#111827',
    },
    clearButton: {
        padding: 4,
    },
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },

    // Period and Tab Container
    periodAndTabContainer: {
        backgroundColor: '#fff',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    periodContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        marginLeft: 1,
        marginRight: 1,
    },
    periodButtonActive: {
        backgroundColor: '#3B82F6',
    },
    firstPeriodButton: {
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        marginLeft: 0,
    },
    lastPeriodButton: {
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        marginRight: 0,
    },
    periodText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#4B5563',
    },
    periodTextActive: {
        color: '#fff',
        fontWeight: '600',
    },

    // Tabs
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginTop: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#3B82F6',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#3B82F6',
        fontWeight: '600',
    },

    // Scroll View
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },

    // Materials Section
    materialsSection: {
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },

    // Material Card
    materialCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    materialCardInner: {
        padding: 16,
    },
    materialHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    materialTitleSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    materialTitleInfo: {
        flex: 1,
    },
    materialNameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    categoryTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#fff',
    },
    dateText: {
        fontSize: 12,
        color: '#6B7280',
    },
    moreButton: {
        padding: 4,
    },
    materialDetails: {
        marginTop: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 13,
        color: '#6B7280',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    wastedValue: {
        color: '#EF4444',
    },
    priceValue: {
        color: '#10B981',
    },

    // Progress Bar
    progressBarContainer: {
        marginVertical: 8,
    },
    progressLabelText: {
        fontSize: 12,
        color: '#4B5563',
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginTop: 16,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginTop: 16,
        marginBottom: 4,
        textAlign: 'center',
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },

    // No Section Selected
    noSectionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noSectionText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
        textAlign: 'center',
    },
    addSectionBtn: {
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    addSectionBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },

    // Project Info
    projectInfo: {
        marginLeft: 8,
    },
    projectName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    totalCostText: {
        fontSize: 14,
        color: '#4B5563',
        marginTop: 2,
    },
});

export default Details;
