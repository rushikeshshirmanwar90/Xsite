import { MATERIAL_TEMPLATES, SPEC_FIELD_CONFIG } from '@/data/details';
import { styles } from '@/style/details';
import { MaterialEntry, MaterialTemplate } from '@/types/details';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MaterialFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (entries: MaterialEntry[]) => void;
}

const MaterialFormModal: React.FC<MaterialFormModalProps> = ({ visible, onClose, onSubmit }) => {
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
    const [showSpecDropdown, setShowSpecDropdown] = useState<string | null>(null);
    const [addedMaterials, setAddedMaterials] = useState<MaterialEntry[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        unit: '',
        quantity: '',
        specs: {} as Record<string, any>,
        notes: '',
    });
    const [customSpecKey, setCustomSpecKey] = useState('');
    const [customSpecValue, setCustomSpecValue] = useState('');
    const [customSpecs, setCustomSpecs] = useState<{key: string, value: string}[]>([]);
    const [showAddSpecModal, setShowAddSpecModal] = useState(false);

    // List of possible icons for shortcut creation
    const possibleIcons: (keyof typeof Ionicons.glyphMap)[] = [
        'cube-outline',
        'barbell-outline',
        'grid-outline',
        'flash-outline',
        'water-outline',
        'apps-outline',
        'color-palette-outline',
        'construct-outline',
        'hammer-outline',
    ];

    const handleTemplateSelect = (templateKey: string) => {
        const template = MATERIAL_TEMPLATES[templateKey as keyof typeof MATERIAL_TEMPLATES];
        setFormData({
            name: template.name,
            unit: template.unit,
            quantity: '',
            specs: {},
            notes: '',
        });
        setSelectedTemplateKey(templateKey);
        setCustomSpecs([]);
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

    const handleAddCustomSpec = () => {
        if (!customSpecKey.trim()) {
            Alert.alert('Error', 'Specification name cannot be empty');
            return;
        }

        const newSpec = {
            key: customSpecKey.trim(),
            value: customSpecValue.trim()
        };
        
        setCustomSpecs([...customSpecs, newSpec]);
        
        // Also add to formData.specs
        setFormData(prev => ({
            ...prev,
            specs: { ...prev.specs, [customSpecKey.trim()]: customSpecValue.trim() }
        }));
        
        setCustomSpecKey('');
        setCustomSpecValue('');
        setShowAddSpecModal(false);
    };

    const handleRemoveCustomSpec = (index: number) => {
        const specToRemove = customSpecs[index];
        const updatedSpecs = [...customSpecs];
        updatedSpecs.splice(index, 1);
        setCustomSpecs(updatedSpecs);
        
        // Also remove from formData.specs
        const updatedFormDataSpecs = { ...formData.specs };
        delete updatedFormDataSpecs[specToRemove.key];
        
        setFormData(prev => ({
            ...prev,
            specs: updatedFormDataSpecs
        }));
    };

    const handleAddMaterial = () => {
        if (!formData.name || !formData.unit || !formData.quantity) {
            alert('Please fill in all required fields');
            return;
        }

        const newEntry: MaterialEntry = {
            id: Date.now().toString(),
            name: formData.name,
            category: 'custom',
            unit: formData.unit,
            quantity: parseFloat(formData.quantity),
            location: '',
            status: 'received',
            specs: formData.specs,
            notes: formData.notes,
            date: new Date().toLocaleDateString('en-IN'),
        };

        setAddedMaterials([...addedMaterials, newEntry]);
        resetForm();
    };

    const handleSendRequest = () => {
        console.log('Request sent successfully');
        onSubmit(addedMaterials);
        setAddedMaterials([]);
        resetForm();
        onClose();
    };

    const handleCreateShortcut = () => {
        if (!formData.name || !formData.unit) {
            alert('Please enter at least a name and unit to create a shortcut');
            return;
        }

        const randomIcon = possibleIcons[Math.floor(Math.random() * possibleIcons.length)];
        const newTemplateKey = formData.name.toLowerCase().replace(/\s+/g, '_');
        const newTemplate: MaterialTemplate = {
            name: formData.name,
            category: 'custom',
            unit: formData.unit,
            specFields: Object.keys(formData.specs),
            icon: randomIcon,
            color: '#64748B',
        };

        (MATERIAL_TEMPLATES as any)[newTemplateKey] = newTemplate;
        alert(`Shortcut created for ${formData.name}!`);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            unit: '',
            quantity: '',
            specs: {},
            notes: '',
        });
        setSelectedTemplateKey(null);
        setShowSpecDropdown(null);
        setCustomSpecs([]);
    };

    const getSpecFields = () => {
        if (!selectedTemplateKey) return [];
        const template = MATERIAL_TEMPLATES[selectedTemplateKey as keyof typeof MATERIAL_TEMPLATES];
        return template?.specFields || [];
    };

    const specFields = getSpecFields();

    // Custom Spec Modal
    const renderCustomSpecModal = () => (
        <Modal
            visible={showAddSpecModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowAddSpecModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.customSpecModalContainer}>
                    <View style={styles.customSpecModalHeader}>
                        <Text style={styles.customSpecModalTitle}>Add Custom Specification</Text>
                        <TouchableOpacity onPress={() => setShowAddSpecModal(false)}>
                            <Ionicons name="close-circle-outline" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.customSpecFormGroup}>
                        <Text style={styles.label}>Specification Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Color, Thickness, Grade"
                            value={customSpecKey}
                            onChangeText={setCustomSpecKey}
                            placeholderTextColor="#94A3B8"
                        />
                    </View>
                    
                    <View style={styles.customSpecFormGroup}>
                        <Text style={styles.label}>Specification Value</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Red, 10mm, A-Grade"
                            value={customSpecValue}
                            onChangeText={setCustomSpecValue}
                            placeholderTextColor="#94A3B8"
                        />
                    </View>
                    
                    <TouchableOpacity
                        style={styles.addSpecButton}
                        onPress={handleAddCustomSpec}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.addSpecButtonText}>Add Specification</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.formContainer}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScrollContent}>
                        <View style={styles.formHeader}>
                            <Text style={styles.formTitle}>Add Material Entries</Text>
                            <TouchableOpacity onPress={() => { setAddedMaterials([]); resetForm(); onClose(); }} activeOpacity={0.7}>
                                <Ionicons name="close-circle-outline" size={28} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {/* Added Materials List */}
                        {addedMaterials.length > 0 && (
                            <View style={styles.addedMaterialsSection}>
                                <Text style={styles.sectionLabel}>Added Materials</Text>
                                {addedMaterials.map((material, index) => (
                                    <View key={material.id} style={styles.addedMaterialItem}>
                                        <Ionicons name="checkmark-circle" size={24} color="#10B981" style={styles.addedMaterialIcon} />
                                        <View style={styles.addedMaterialInfo}>
                                            <Text style={styles.addedMaterialName}>{material.name}</Text>
                                            <Text style={styles.addedMaterialDetails}>
                                                {material.quantity} {material.unit} {material.notes ? `| ${material.notes}` : ''}
                                            </Text>
                                            {Object.keys(material.specs).length > 0 && (
                                                <View style={styles.materialSpecsPreview}>
                                                    <Text style={styles.materialSpecsTitle}>Specifications:</Text>
                                                    {Object.entries(material.specs).map(([key, value]) => (
                                                        <Text key={key} style={styles.materialSpecItem}>
                                                            • {key}: {value}
                                                        </Text>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                        <TouchableOpacity
                                            style={styles.removeMaterialButton}
                                            onPress={() => {
                                                setAddedMaterials(addedMaterials.filter((_, i) => i !== index));
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

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

                        <View style={styles.formSection}>
                            <Text style={styles.sectionLabel}>Material Details</Text>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Material Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g., Steel Road, Brick"
                                    value={formData.name}
                                    onChangeText={(value) => handleInputChange('name', value)}
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
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
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Quantity *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter quantity"
                                    value={formData.quantity}
                                    onChangeText={(value) => handleInputChange('quantity', value)}
                                    keyboardType="decimal-pad"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>

                        {/* Material Specifications Section */}
                        <View style={styles.formSection}>
                            <View style={styles.specSectionHeader}>
                                <Text style={styles.sectionLabel}>Material Specifications</Text>
                                <TouchableOpacity 
                                    style={styles.addSpecButtonSmall}
                                    onPress={() => setShowAddSpecModal(true)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="add-circle" size={20} color="#3B82F6" />
                                    <Text style={styles.addSpecButtonText}>Add Spec</Text>
                                </TouchableOpacity>
                            </View>
                            
                            {/* Template Specs */}
                            {specFields.length > 0 && specFields.map((field) => {
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
                                                placeholderTextColor="#94A3B8"
                                            />
                                        )}
                                    </View>
                                );
                            })}
                            
                            {/* Custom Specs */}
                            {customSpecs.length > 0 && (
                                <View style={styles.customSpecsContainer}>
                                    {customSpecs.map((spec, index) => (
                                        <View key={index} style={styles.customSpecItem}>
                                            <View style={styles.customSpecContent}>
                                                <Text style={styles.customSpecName}>{spec.key}</Text>
                                                <Text style={styles.customSpecValue}>{spec.value}</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.removeSpecButton}
                                                onPress={() => handleRemoveCustomSpec(index)}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="close-circle" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                            
                            {/* Empty state when no specs */}
                            {specFields.length === 0 && customSpecs.length === 0 && (
                                <View style={styles.emptySpecsContainer}>
                                    <Ionicons name="list-outline" size={40} color="#94A3B8" />
                                    <Text style={styles.emptySpecsText}>No specifications added yet</Text>
                                    <Text style={styles.emptySpecsSubtext}>
                                        Add custom specifications to better describe your material
                                    </Text>
                                </View>
                            )}
                        </View>

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
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>

                        <View style={styles.formButtonContainer}>
                            <TouchableOpacity
                                style={styles.addMaterialButton}
                                onPress={handleAddMaterial}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.addMaterialButtonText}>Add Material</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.sendRequestButton}
                                onPress={handleSendRequest}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.sendRequestButtonText}>Send Request</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.shortcutButton}
                                onPress={handleCreateShortcut}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.shortcutButtonText}>Create Shortcut</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
            {renderCustomSpecModal()}
        </Modal>
    );
};

export default MaterialFormModal;