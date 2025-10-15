import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
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
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SectionManager from './components/details/SectionManager';

// Types
interface Material {
    id: number;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    price: number;
    date: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    sectionId?: string;
}

interface MaterialEntry {
    id: string;
    name: string;
    category: string;
    unit: string;
    quantity: number;
    location: string;
    status: 'received' | 'in_use' | 'stored' | 'damaged';
    specs: Record<string, any>;
    notes: string;
    date: string;
    sectionId?: string;
}

interface Section {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
}

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

// Predefined building sections
const predefinedSections: Section[] = [
    {
        id: 'foundation',
        name: 'Foundation',
        description: 'Base foundation of the building',
        createdAt: '10/1/2024',
    },
    {
        id: 'ground-floor',
        name: 'Ground Floor',
        description: 'Ground floor construction materials',
        createdAt: '12/1/2024',
    },
    {
        id: 'first-floor',
        name: 'First Floor',
        description: 'First floor construction materials',
        createdAt: '20/1/2024',
    },
    {
        id: 'roof',
        name: 'Roof',
        description: 'Roof and terrace materials',
        createdAt: '25/1/2024',
    },
    {
        id: 'exterior',
        name: 'Exterior',
        description: 'Exterior finishing materials',
        createdAt: '28/1/2024',
    }
];

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
        sectionId: 'foundation',
    },
    {
        id: 2,
        name: 'Steel Rods',
        category: 'structural',
        quantity: 500,
        unit: 'kg',
        price: 35000,
        date: '16/1/2024',
        icon: 'barbell-outline',
        color: '#64748B',
        sectionId: 'foundation',
    },
    {
        id: 3,
        name: 'Bricks',
        category: 'walls',
        quantity: 2000,
        unit: 'pieces',
        price: 18000,
        date: '18/1/2024',
        icon: 'grid-outline',
        color: '#DC2626',
        sectionId: 'ground-floor',
    },
    {
        id: 4,
        name: 'Cement',
        category: 'structural',
        quantity: 50,
        unit: 'bags',
        price: 15000,
        date: '20/1/2024',
        icon: 'cube-outline',
        color: '#9CA3AF',
        sectionId: 'ground-floor',
    },
    {
        id: 5,
        name: 'Electrical Wiring',
        category: 'electrical',
        quantity: 300,
        unit: 'meters',
        price: 12000,
        date: '22/1/2024',
        icon: 'flash-outline',
        color: '#F59E0B',
        sectionId: 'first-floor',
    },
    {
        id: 6,
        name: 'Plumbing Pipes',
        category: 'plumbing',
        quantity: 150,
        unit: 'meters',
        price: 8000,
        date: '24/1/2024',
        icon: 'water-outline',
        color: '#3B82F6',
        sectionId: 'first-floor',
    },
    {
        id: 7,
        name: 'Granite Tiles',
        category: 'finishing',
        quantity: 100,
        unit: 'sq meters',
        price: 45000,
        date: '26/1/2024',
        icon: 'apps-outline',
        color: '#8B5CF6',
        sectionId: 'ground-floor',
    },
    {
        id: 8,
        name: 'Waterproofing Material',
        category: 'finishing',
        quantity: 20,
        unit: 'buckets',
        price: 10000,
        date: '28/1/2024',
        icon: 'water-outline',
        color: '#10B981',
        sectionId: 'roof',
    }
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
        sectionId: 'foundation',
    },
    {
        id: 2,
        name: 'Steel Rods',
        category: 'structural',
        quantity: 400,
        unit: 'kg',
        price: 28000,
        date: '17/1/2024',
        icon: 'barbell-outline',
        color: '#64748B',
        sectionId: 'foundation',
    },
    {
        id: 3,
        name: 'Bricks',
        category: 'walls',
        quantity: 1500,
        unit: 'pieces',
        price: 13500,
        date: '19/1/2024',
        icon: 'grid-outline',
        color: '#DC2626',
        sectionId: 'ground-floor',
    },
    {
        id: 4,
        name: 'Cement',
        category: 'structural',
        quantity: 40,
        unit: 'bags',
        price: 12000,
        date: '21/1/2024',
        icon: 'cube-outline',
        color: '#9CA3AF',
        sectionId: 'ground-floor',
    },
    {
        id: 5,
        name: 'Electrical Wiring',
        category: 'electrical',
        quantity: 200,
        unit: 'meters',
        price: 8000,
        date: '23/1/2024',
        icon: 'flash-outline',
        color: '#F59E0B',
        sectionId: 'first-floor',
    }
];

const Details: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'imported' | 'used'>('imported');
    const [selectedPeriod, setSelectedPeriod] = useState('Today');
    const [showMaterialForm, setShowMaterialForm] = useState(false);
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
    const [showSpecDropdown, setShowSpecDropdown] = useState<string | null>(null);
    const [materialEntries, setMaterialEntries] = useState<MaterialEntry[]>([]);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);

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
    // search input ref removed because it's not used

    const periods = ['Today', '1 Week', '15 Days', '1 Month', '3 Months', '6 Months', 'Custom'];

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

        const newEntry: MaterialEntry = {
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

    const getCurrentData = () => {
        const materials = activeTab === 'imported' ? importedMaterials : usedMaterials;

        // Filter materials by selected section if one is selected
        if (selectedSection) {
            return materials.filter(material => material.sectionId === selectedSection);
        }

        return materials;
    };

    const filteredMaterials = getCurrentData();

    const totalCost = filteredMaterials.reduce((sum, material) => sum + material.price, 0);

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
        return Math.round(usedMaterial.quantity * 0.1);
    };

    const getSectionName = (sectionId: string | undefined) => {
        if (!sectionId) return 'Unassigned';
        const section = predefinedSections.find(s => s.id === sectionId);
        return section ? section.name : 'Unassigned';
    };

    // handleViewDetails removed (not used)

    const specFields = getSpecFields();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Main Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => { router.back() }} style={styles.backButton} activeOpacity={0.7}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.projectInfo}>
                        <Text style={styles.projectNameSmall}>Villa Project</Text>
                        <Text style={styles.sectionNameMedium}>
                            {selectedSection ? getSectionName(selectedSection) : 'All Sections'}
                        </Text>
                        <Text style={styles.totalCostText}>{formatPrice(totalCost)}</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <SectionManager
                        onSectionSelect={(sectionId) => setSelectedSection(sectionId)}
                        selectedSection={selectedSection}
                        sections={predefinedSections}
                        compact={true}
                        style={styles.headerSectionManager}
                    />
                </View>
            </View>

            {/* Floating Action Button for Adding Material */}
            <TouchableOpacity
                style={styles.floatingActionButton}
                onPress={() => setShowMaterialForm(true)}
                activeOpacity={0.7}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

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
                                                // template.icon is a string from our templates; cast to any to satisfy Ionicons prop types
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
                            <View style={styles.formButtonContainer}>
                                <TouchableOpacity
                                    style={styles.submitButton}
                                    onPress={handleSubmit}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.submitButtonText}>Save Material Entry</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => {
                                        setShowMaterialForm(false);
                                        resetForm();
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Period Filters */}
                <View style={styles.periodSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.periodContainer}
                    >
                        {periods.map((period, index) => (
                            <TouchableOpacity
                                key={period}
                                style={[
                                    styles.periodButton,
                                    selectedPeriod === period && styles.periodButtonActive,
                                    index === 0 && styles.firstPeriodButton,
                                    index === periods.length - 1 && styles.lastPeriodButton
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
                </View>

                {/* Tab Selector */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'imported' && styles.activeTab]}
                        onPress={() => setActiveTab('imported')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="download-outline" size={16} color={activeTab === 'imported' ? '#000' : '#6B7280'} />
                        <Text style={[styles.tabText, activeTab === 'imported' && styles.activeTabText]}>
                            Material Availability
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'used' && styles.activeTab]}
                        onPress={() => setActiveTab('used')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="trending-down-outline" size={16} color={activeTab === 'used' ? '#000' : '#6B7280'} />
                        <Text style={[styles.tabText, activeTab === 'used' && styles.activeTabText]}>
                            Material Used
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Materials List */}
                <View style={styles.materialsSection}>
                    <Text style={styles.sectionTitle}>
                        {activeTab === 'imported' ? 'Imported Materials' : 'Used Materials'}
                    </Text>
                    {filteredMaterials.map((material, index) => (
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
                            <TouchableOpacity activeOpacity={0.95}>
                                <View style={styles.materialHeader}>
                                    <View style={styles.materialTitleSection}>
                                        <View style={[styles.iconContainer, { backgroundColor: material.color + '20' }]}>
                                            <Ionicons name={material.icon} size={24} color={material.color} />
                                        </View>
                                        <View style={styles.materialTitleInfo}>
                                            <Text style={styles.materialNameText}>{material.name}</Text>
                                            <View style={[styles.categoryTag, { backgroundColor: material.color }]}>
                                                <Text style={styles.categoryText}>{material.category}</Text>
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
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Details;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    sectionManagerContainer: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    sectionManager: {
        marginTop: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        zIndex: 1000,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerSectionManager: {
        marginRight: 8,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    projectInfo: {
        flex: 1,
    },
    projectNameSmall: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
        marginBottom: 2,
    },
    sectionNameMedium: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 2,
    },
    totalCostText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#059669',
    },
    floatingActionButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#0EA5E9',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 999,
    },
    addButton: {
        padding: 8,
    },
    // Form Styles
    formContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    formScrollContent: {
        paddingBottom: 40,
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    templateSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 12,
    },
    templateContainer: {
        paddingVertical: 8,
        gap: 10,
    },
    templateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginHorizontal: 4,
    },
    templateButtonActive: {
        backgroundColor: '#0EA5E9',
        borderColor: '#0EA5E9',
    },
    templateButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        marginLeft: 8,
    },
    templateButtonTextActive: {
        color: '#fff',
    },
    formSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        marginHorizontal: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1E293B',
        backgroundColor: '#F8FAFC',
    },
    selectInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
    },
    selectInputText: {
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '500',
        flex: 1,
    },
    placeholderText: {
        color: '#9CA3AF',
    },
    dropdown: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    dropdownItem: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '500',
    },
    textArea: {
        textAlignVertical: 'top',
        paddingTop: 12,
        minHeight: 100,
    },
    formButtonContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    submitButton: {
        backgroundColor: '#0EA5E9',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    cancelButton: {
        backgroundColor: '#E5E7EB',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748B',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    periodSection: {
        marginTop: 16,
    },
    periodContainer: {
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    periodButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        backgroundColor: '#fff',
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    firstPeriodButton: {
        marginLeft: 0,
    },
    lastPeriodButton: {
        marginRight: 0,
    },
    periodButtonActive: {
        backgroundColor: '#000',
        borderColor: '#000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    periodText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
    },
    periodTextActive: {
        color: '#fff',
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        padding: 6,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tabText: {
        marginLeft: 8,
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#000',
    },
    materialsSection: {
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
        paddingLeft: 4,
    },
    materialCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    materialHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    materialTitleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    materialTitleInfo: {
        flex: 1,
    },
    materialNameText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    categoryTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dateContainer: {
        alignItems: 'flex-end',
    },
    dateText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 8,
    },
    moreButton: {
        padding: 4,
    },
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
});