import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import apiClient from '@/utils/axiosConfig';

interface MaterialVariant {
    _id: string;
    specs: Record<string, any>;
    quantity: number;
    cost: number;
    miniSectionId?: string;
    contractor_name?: string;
    paymentStatus?: 'full' | 'partial' | 'unpaid';
    amountPaid?: number;
}

interface GroupedMaterial {
    name: string;
    unit: string;
    icon: any;
    color: string;
    date: string;
    specs?: Record<string, any>; // ✅ NEW: Specifications for this material variant
    variants: MaterialVariant[];
    totalQuantity: number;
    totalCost: number;
    totalImported?: number; // Total quantity ever imported
    totalUsed?: number; // Total quantity used so far
    currentlyAvailable?: number; // ✅ NEW: Currently available quantity
    miniSectionId?: string;
    contractor_name?: string; // Vendor/contractor (group-level fallback)
    // ✅ Vendor payment (aggregated across this group's batches)
    paymentStatus?: 'full' | 'partial' | 'unpaid';
    amountPaid?: number; // Total paid to the vendor across all batches
    paymentTotalCost?: number; // Total purchase cost across all batches
    amountRemaining?: number; // Outstanding amount still owed
}

interface MiniSection {
    _id: string;
    name: string;
}

interface Project {
    _id: string;
    name: string;
    description?: string;
}

interface MaterialCardEnhancedProps {
    material: GroupedMaterial;
    animation: Animated.Value;
    activeTab: 'imported' | 'used';
    onAddUsage: (materialName: string, unit: string, variantId: string, quantity: number, specs: Record<string, any>) => void;
    onTransferMaterial?: (materialName: string, unit: string, variantId: string, quantity: number, specs: Record<string, any>, targetProjectId: string) => void;
    miniSections?: MiniSection[];
    showMiniSectionLabel?: boolean;
    currentProjectId?: string;
    userType?: string; // Add userType prop to control transfer button visibility
    onRefresh?: () => void; // Add refresh callback
    canEdit?: boolean; // Admin-only edit, allowed only when material is unused
    lowStockThreshold?: number; // % of total purchase remaining at/below which stock is flagged low
    isIgnored?: boolean; // Low stock alert dismissed by the user for this material — hides the Low Stock badge
}

// App's primary blue, used for every spec chip.
const SPEC_CHIP_COLOR = { bg: '#EAF0FE', text: '#3A78B5' };

const MaterialCardEnhanced: React.FC<MaterialCardEnhancedProps> = ({
    material,
    animation,
    activeTab,
    onAddUsage,
    onTransferMaterial,
    miniSections = [],
    showMiniSectionLabel = false,
    currentProjectId,
    userType = 'staff', // Default to 'staff' if not provided
    onRefresh, // Add refresh callback
    canEdit = false, // Admin-only edit, allowed only when material is unused
    lowStockThreshold = 10,
    isIgnored = false,
}) => {
    // ✅ DEBUG: Log material values being passed to component
    console.log(`\n🎯 MATERIAL CARD DEBUG: ${material.name}`);
    console.log(`   totalQuantity: ${material.totalQuantity}`);
    console.log(`   totalImported: ${material.totalImported}`);
    console.log(`   totalUsed: ${material.totalUsed}`);
    console.log(`   currentlyAvailable: ${material.currentlyAvailable}`);
    console.log(`   activeTab: ${activeTab}`);
    
    // Format date to readable format (e.g., "15 Jan 2024")
    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            
            // Format: "15 Jan 2024"
            const day = date.getDate();
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();
            
            return `${day} ${month} ${year}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

    // Get mini-section name by ID
    const getMiniSectionName = (miniSectionId?: string): string => {
        if (!miniSectionId) return 'Unassigned';
        const section = miniSections.find(s => s._id === miniSectionId);
        return section ? section.name : 'Unknown Section';
    };
    const [showUsageModal, setShowUsageModal] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<MaterialVariant | null>(null);
    const [usageQuantity, setUsageQuantity] = useState('');
    const [showVariantSelector, setShowVariantSelector] = useState(false);
    
    // Transfer functionality states
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showProjectSelector, setShowProjectSelector] = useState(false);
    const [selectedTransferVariant, setSelectedTransferVariant] = useState<MaterialVariant | null>(null);
    const [transferQuantity, setTransferQuantity] = useState('');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [variantSelectionMode, setVariantSelectionMode] = useState<'usage' | 'transfer' | 'addStock' | 'edit'>('usage');

    // Add Stock functionality states
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [selectedStockVariant, setSelectedStockVariant] = useState<MaterialVariant | null>(null);
    const [addStockQuantity, setAddStockQuantity] = useState('');
    const [addStockCost, setAddStockCost] = useState('');
    const [addStockVendor, setAddStockVendor] = useState('');

    // Do Payment functionality states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentInput, setPaymentInput] = useState('');
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    // Edit Stock functionality states (admin-only, unused materials)
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEditVariant, setSelectedEditVariant] = useState<MaterialVariant | null>(null);
    const [editName, setEditName] = useState('');
    const [editUnit, setEditUnit] = useState('');
    const [editQuantity, setEditQuantity] = useState('');
    const [editCost, setEditCost] = useState('');
    const [editVendor, setEditVendor] = useState('');
    const [editSpecs, setEditSpecs] = useState<Record<string, string>>({});
    const [savingEdit, setSavingEdit] = useState(false);

    // Transfer functionality functions
    const fetchAvailableProjects = async () => {
        try {
            console.log('🔍 Fetching available projects for transfer...');
            setLoadingProjects(true);
            
            // Get client ID
            const { getClientId } = await import('@/functions/clientId');
            const clientId = await getClientId();
            
            console.log('📋 Client ID:', clientId);
            
            if (!clientId) {
                throw new Error('Client ID not found');
            }

            // Import domain
            const { domain } = await import('@/lib/domain');
            
            // Fetch projects from API
            console.log('🌐 Fetching projects from API...');
            const response = await apiClient.get(`/api/project?clientId=${clientId}`);
            
            console.log('✅ API Response:', response.data);
            console.log('📊 Response structure:', {
                success: response.data.success,
                hasData: !!response.data.data,
                hasProjects: !!(response.data.data?.projects || response.data.projects),
                dataKeys: Object.keys(response.data.data || {}),
                rootKeys: Object.keys(response.data)
            });

            if (response.data.success && response.data.data) {
                // Try multiple possible response structures
                let projectsList = response.data.data.projects || 
                                  response.data.projects || 
                                  response.data.data || 
                                  [];
                
                console.log('📦 Raw projects list:', projectsList);
                console.log('📦 Projects list length:', Array.isArray(projectsList) ? projectsList.length : 'Not an array');
                
                // If projectsList is not an array, try to extract it
                if (!Array.isArray(projectsList)) {
                    console.warn('⚠️ Projects list is not an array, trying to extract...');
                    if (projectsList.projects && Array.isArray(projectsList.projects)) {
                        projectsList = projectsList.projects;
                    } else {
                        projectsList = [];
                    }
                }
                
                // Filter out current project
                const projects = projectsList
                    .filter((project: any) => {
                        const isCurrentProject = project._id === currentProjectId;
                        console.log(`  - Project: ${project.name} (${project._id}) - Current: ${isCurrentProject}`);
                        return !isCurrentProject;
                    })
                    .map((project: any) => ({
                        _id: project._id,
                        name: project.name,
                        description: project.description
                    }));
                
                console.log('✅ Filtered projects:', projects.length);
                projects.forEach((p: any, i: number) => {
                    console.log(`  ${i + 1}. ${p.name} (${p._id})`);
                });
                
                setAvailableProjects(projects);
                
                if (projects.length === 0) {
                    console.warn('⚠️ No projects available for transfer (all filtered out or empty list)');
                    Alert.alert('No Projects', 'No other projects available for material transfer.');
                }
            } else {
                console.error('❌ API response not successful or missing data');
                throw new Error('Failed to fetch projects');
            }
        } catch (error: any) {
            console.error('❌ Error fetching projects:', error);
            console.error('   - Message:', error?.message);
            console.error('   - Response:', error?.response?.data);
            Alert.alert('Error', 'Failed to load available projects. Please try again.');
        } finally {
            setLoadingProjects(false);
        }
    };

    const handleOpenTransferModal = () => {
        setShowOptionsMenu(false);
        
        if (material.variants.length === 1) {
            setSelectedTransferVariant(material.variants[0]);
            setTransferQuantity('');
            fetchAvailableProjects();
            setShowProjectSelector(true);
        } else {
            // Multiple variants, show selector first
            setVariantSelectionMode('transfer');
            setShowVariantSelector(true);
        }
    };

    const handleSelectProject = (project: Project) => {
        setSelectedProject(project);
        setShowProjectSelector(false);
        setShowTransferModal(true);
    };

    const handleTransferMaterial = () => {
        if (!selectedTransferVariant || !selectedProject || !transferQuantity || parseFloat(transferQuantity) <= 0) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        const quantity = parseFloat(transferQuantity);
        if (quantity > selectedTransferVariant.quantity) {
            Alert.alert('Error', `Cannot transfer more than available quantity (${selectedTransferVariant.quantity} ${material.unit})`);
            return;
        }

        Alert.alert(
            'Confirm Transfer',
            `Transfer ${quantity} ${material.unit} of ${material.name} to "${selectedProject.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Transfer',
                    style: 'default',
                    onPress: () => {
                        if (onTransferMaterial) {
                            onTransferMaterial(
                                material.name,
                                material.unit,
                                selectedTransferVariant._id,
                                quantity,
                                selectedTransferVariant.specs,
                                selectedProject._id
                            );
                        }
                        
                        // Reset states
                        setShowTransferModal(false);
                        setSelectedTransferVariant(null);
                        setSelectedProject(null);
                        setTransferQuantity('');
                    }
                }
            ]
        );
    };

    // Get suggested quantity based on material type
    const getSuggestedQuantity = (materialName: string, unit: string): number => {
        const lowerName = materialName.toLowerCase();
        const lowerUnit = unit.toLowerCase();

        // Bricks - large quantities
        if (lowerName.includes('brick') || lowerUnit.includes('piece')) {
            return 100;
        }
        // Cement - medium quantities
        if (lowerName.includes('cement') || lowerUnit.includes('bag')) {
            return 10;
        }
        // Steel/Rod - small quantities
        if (lowerName.includes('steel') || lowerName.includes('rod') || lowerUnit.includes('kg')) {
            return 5;
        }
        // Sand/Gravel - medium quantities
        if (lowerName.includes('sand') || lowerName.includes('gravel')) {
            return 10;
        }
        // Default
        return 10;
    };

    const handleOpenUsageModal = () => {
        if (material.variants.length === 1) {
            setSelectedVariant(material.variants[0]);
            setUsageQuantity(getSuggestedQuantity(material.name, material.unit).toString());
            setShowUsageModal(true);
        } else {
            // Multiple variants, show selector first
            setVariantSelectionMode('usage');
            setShowVariantSelector(true);
        }
    };

    const handleSelectVariant = (variant: MaterialVariant) => {
        if (variantSelectionMode === 'usage') {
            setSelectedVariant(variant);
            setUsageQuantity(getSuggestedQuantity(material.name, material.unit).toString());
            setShowVariantSelector(false);
            setShowUsageModal(true);
        } else if (variantSelectionMode === 'transfer') {
            setSelectedTransferVariant(variant);
            setTransferQuantity('');
            setShowVariantSelector(false);
            fetchAvailableProjects();
            setShowProjectSelector(true);
        } else if (variantSelectionMode === 'addStock') {
            setSelectedStockVariant(variant);
            setAddStockQuantity('');
            setAddStockCost('');
            setAddStockVendor(variant.contractor_name || '');
            setShowVariantSelector(false);
            setShowAddStockModal(true);
        } else if (variantSelectionMode === 'edit') {
            openEditModalForVariant(variant);
            setShowVariantSelector(false);
        }
    };

    // Edit Stock: pre-fill the edit modal from the chosen variant
    const openEditModalForVariant = (variant: MaterialVariant) => {
        setSelectedEditVariant(variant);
        setEditName(material.name);
        setEditUnit(material.unit);
        setEditQuantity(String(variant.quantity ?? ''));
        setEditCost(String(variant.cost ?? ''));
        setEditVendor(variant.contractor_name || '');
        const specEntries: Record<string, string> = {};
        Object.entries(variant.specs || {}).forEach(([key, value]) => {
            specEntries[key] = value === undefined || value === null ? '' : String(value);
        });
        setEditSpecs(specEntries);
        setShowEditModal(true);
    };

    const handleOpenEditModal = () => {
        setShowOptionsMenu(false);

        if (material.variants.length === 1) {
            openEditModalForVariant(material.variants[0]);
        } else {
            setVariantSelectionMode('edit');
            setShowVariantSelector(true);
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedEditVariant) return;

        const quantity = parseFloat(editQuantity);
        const perUnitCost = editCost === '' ? 0 : parseFloat(editCost);

        if (!editName.trim()) {
            Alert.alert('Error', 'Material name cannot be empty');
            return;
        }
        if (!editUnit.trim()) {
            Alert.alert('Error', 'Unit cannot be empty');
            return;
        }
        if (Number.isNaN(quantity) || quantity <= 0) {
            Alert.alert('Error', 'Please enter a valid quantity (greater than 0)');
            return;
        }
        if (Number.isNaN(perUnitCost) || perUnitCost < 0) {
            Alert.alert('Error', 'Cost cannot be negative');
            return;
        }

        try {
            setSavingEdit(true);

            // Preserve original spec value types where possible (numbers stay numbers)
            const originalSpecs = selectedEditVariant.specs || {};
            const updatedSpecs: Record<string, any> = {};
            Object.entries(editSpecs).forEach(([key, value]) => {
                const original = (originalSpecs as Record<string, any>)[key];
                if (typeof original === 'number' && value.trim() !== '' && !Number.isNaN(Number(value))) {
                    updatedSpecs[key] = Number(value);
                } else {
                    updatedSpecs[key] = value;
                }
            });

            const response = await apiClient.patch(
                `/api/material?projectId=${currentProjectId}&materialId=${selectedEditVariant._id}`,
                {
                    name: editName.trim(),
                    unit: editUnit.trim(),
                    qnt: quantity,
                    perUnitCost: perUnitCost,
                    specs: updatedSpecs,
                    contractor_name: editVendor.trim() || undefined,
                }
            );

            if (response.data?.success) {
                Alert.alert('Success', 'Stock updated successfully');
                setShowEditModal(false);
                setSelectedEditVariant(null);
                if (onRefresh) {
                    onRefresh();
                }
            } else {
                throw new Error(response.data?.message || response.data?.error || 'Failed to update stock');
            }
        } catch (error: any) {
            const status = error?.response?.status;
            const serverMessage = error?.response?.data?.message;
            if (status === 409) {
                Alert.alert(
                    'Cannot Edit',
                    serverMessage || 'This stock has already been used and can no longer be edited.'
                );
            } else {
                Alert.alert('Error', serverMessage || error?.message || 'Failed to update stock');
            }
        } finally {
            setSavingEdit(false);
        }
    };

    const handleAddUsage = () => {
        if (!selectedVariant || !usageQuantity || parseFloat(usageQuantity) <= 0) {
            console.warn('⚠️ Cannot add usage: Missing variant or invalid quantity');
            return;
        }

        const quantity = parseFloat(usageQuantity);
        if (quantity > selectedVariant.quantity) {
            alert(`Cannot use more than available quantity (${selectedVariant.quantity} ${material.unit})`);
            return;
        }

        console.log('=== MATERIAL CARD: Calling onAddUsage ===');
        console.log('Material Name:', material.name);
        console.log('Unit:', material.unit);
        console.log('Variant ID:', selectedVariant._id);
        console.log('Quantity:', quantity);
        console.log('Specs:', selectedVariant.specs);
        console.log('=========================================');

        onAddUsage(material.name, material.unit, selectedVariant._id, quantity, selectedVariant.specs);
        setShowUsageModal(false);
        setUsageQuantity('');
        setSelectedVariant(null);
    };

    const formatSpecs = (specs: Record<string, any>): string => {
        if (!specs || Object.keys(specs).length === 0) return 'Standard';
        return Object.entries(specs)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    };

    const getQuickAddButtons = () => {
        const suggested = getSuggestedQuantity(material.name, material.unit);
        return [
            Math.floor(suggested / 2),
            suggested,
            suggested * 2,
            suggested * 5
        ];
    };

    // Do Payment functionality — records a vendor payment against this material's
    // outstanding balance across all of its batches (variants).
    const handleOpenPaymentModal = () => {
        // Default the input to the full outstanding amount for a quick "pay in full".
        setPaymentInput(amountRemaining > 0 ? String(Math.round(amountRemaining)) : '');
        setShowPaymentModal(true);
    };

    const handleRecordPayment = async () => {
        const amount = parseFloat(paymentInput);
        if (!amount || Number.isNaN(amount) || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid payment amount greater than 0.');
            return;
        }
        if (amount > amountRemaining + 0.01) {
            Alert.alert(
                'Amount Too High',
                `Payment cannot exceed the outstanding amount of ₹${amountRemaining.toLocaleString('en-IN')}.`
            );
            return;
        }
        if (isSubmittingPayment) return;

        try {
            setIsSubmittingPayment(true);
            const { getClientId } = await import('@/functions/clientId');
            const clientId = await getClientId();
            if (!clientId || !currentProjectId) {
                Alert.alert('Error', 'Missing project or client information.');
                return;
            }

            // All batches in this group; the backend applies the payment only to the
            // ones that still have an outstanding balance.
            const materialIds = (material.variants || []).map(v => v._id).filter(Boolean);

            const res = await apiClient.post('/api/material/payment', {
                projectId: currentProjectId,
                clientId,
                materialIds,
                amountPaid: amount,
            });

            if (res.data?.success) {
                setShowPaymentModal(false);
                setPaymentInput('');
                Alert.alert('Payment Recorded', res.data?.message || 'Payment recorded successfully.');
                onRefresh?.();
            } else {
                Alert.alert('Error', res.data?.error || 'Failed to record payment.');
            }
        } catch (error: any) {
            console.error('❌ Error recording payment:', error);
            const msg = error?.response?.data?.error || error?.message || 'Failed to record payment.';
            Alert.alert('Error', msg);
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    // Add Stock functionality
    const handleOpenAddStockModal = () => {
        setShowOptionsMenu(false);
        
        if (material.variants.length === 1) {
            setSelectedStockVariant(material.variants[0]);
            setAddStockQuantity('');
            setAddStockCost('');
            setAddStockVendor(material.variants[0].contractor_name || '');
            setShowAddStockModal(true);
        } else {
            // Multiple variants, show selector first
            setVariantSelectionMode('addStock');
            setShowVariantSelector(true);
        }
    };

    const handleAddStock = async () => {
        if (!selectedStockVariant || !addStockQuantity || parseFloat(addStockQuantity) <= 0) {
            Alert.alert('Error', 'Please enter a valid quantity');
            return;
        }

        const quantity = parseFloat(addStockQuantity);
        const perUnitCost = addStockCost ? parseFloat(addStockCost) : 0;
        const vendorName = addStockVendor.trim();

        if (perUnitCost < 0) {
            Alert.alert('Error', 'Cost cannot be negative');
            return;
        }

        let confirmMsg = `Add ${quantity} ${material.unit} of ${material.name}`;
        if (perUnitCost > 0) confirmMsg += ` at ₹${perUnitCost}/${material.unit}`;
        if (vendorName) confirmMsg += `\nVendor: ${vendorName}`;
        confirmMsg += '?';

        Alert.alert(
            'Confirm Add Stock',
            confirmMsg,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Add Stock',
                    style: 'default',
                    onPress: async () => {
                        try {
                            // Import required modules
                            const { getClientId } = await import('@/functions/clientId');
                            
                            const clientId = await getClientId();
                            
                            if (!clientId) {
                                throw new Error('Client ID not found');
                            }

                            console.log('📤 Sending add stock request...');
                            console.log('Material ID:', selectedStockVariant._id);
                            console.log('Quantity:', quantity);
                            console.log('Per Unit Cost:', perUnitCost);
                            console.log('Vendor:', vendorName);
                            console.log('Client ID:', clientId);

                            // Call API to add stock
                            const response = await apiClient.post('/api/material/add-stock', {
                                materialId: selectedStockVariant._id,
                                quantity: quantity,
                                perUnitCost: perUnitCost > 0 ? perUnitCost : undefined,
                                contractor_name: vendorName || undefined,
                                clientId: clientId,
                            });

                            console.log('📥 API Response:', response.data);

                            if (response.data.success) {
                                const isNewEntry = response.data.action === 'created';
                                const reasons: string[] = [];
                                if (isNewEntry && response.data.data?.newEntryReason === 'vendor') {
                                    reasons.push('Vendor changed');
                                } else if (isNewEntry) {
                                    reasons.push('Cost changed');
                                }
                                const message = isNewEntry
                                    ? `New material entry created!\n\nAdded ${quantity} ${material.unit}${perUnitCost > 0 ? ` at ₹${perUnitCost}/${material.unit}` : ''}${vendorName ? `\nVendor: ${vendorName}` : ''}\n\nReason: ${reasons.join(' & ')} — tracked separately.`
                                    : `Successfully added ${quantity} ${material.unit} to stock`;
                                
                                Alert.alert('Success', message);
                                
                                // Reset states
                                setShowAddStockModal(false);
                                setSelectedStockVariant(null);
                                setAddStockQuantity('');
                                setAddStockCost('');
                                setAddStockVendor('');
                                
                                // Trigger refresh
                                if (onRefresh) {
                                    onRefresh();
                                }
                            } else {
                                throw new Error(response.data.error || 'Failed to add stock');
                            }
                        } catch (error: any) {
                            console.error('Error adding stock:', error);
                            Alert.alert('Error', error.message || 'Failed to add stock');
                        }
                    }
                }
            ]
        );
    };

    // Transfer functionality - REMOVED

    // Low stock check — only meaningful on the imported/available tab, where the
    // remaining quantity is what's actually left in stock.
    const totalPurchased = material.totalImported || material.totalQuantity || 0;
    const remainingQty = material.currentlyAvailable !== undefined && material.currentlyAvailable !== null
        ? material.currentlyAvailable
        : material.totalQuantity;
    const stockPercentage = totalPurchased > 0 ? (remainingQty / totalPurchased) * 100 : 100;
    const isLowStock = !isIgnored && activeTab === 'imported' && totalPurchased > 0 && stockPercentage <= lowStockThreshold;

    // Vendor payment status — surfaced on the imported/available tab where purchases
    // (and therefore vendor payments) actually happen. Only shown when payment was
    // actually recorded; materials with no payment data stay badge-free. Falls back to
    // per-variant data for materials fetched before group-level aggregation existed.
    const definedVariantStatuses = (material.variants || [])
        .map(v => v.paymentStatus)
        .filter((s): s is 'full' | 'partial' | 'unpaid' => !!s);
    const derivedFromVariants: 'full' | 'partial' | 'unpaid' | undefined =
        definedVariantStatuses.length === 0
            ? undefined
            : definedVariantStatuses.every(s => s === definedVariantStatuses[0])
                ? definedVariantStatuses[0]
                : 'partial';
    const paymentStatus: 'full' | 'partial' | 'unpaid' | undefined =
        material.paymentStatus || derivedFromVariants;
    const amountPaid = material.amountPaid !== undefined
        ? material.amountPaid
        : (material.variants || []).reduce((sum, v) => sum + (Number(v.amountPaid) || 0), 0);
    const amountRemaining = material.amountRemaining ?? 0;
    const PAYMENT_CONFIG = {
        full:    { label: 'Fully Paid',     icon: 'checkmark-circle' as const, color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
        partial: { label: 'Partially Paid', icon: 'time-outline' as const,     color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
        unpaid:  { label: 'Unpaid',         icon: 'alert-circle-outline' as const, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    };
    const paymentCfg = paymentStatus ? PAYMENT_CONFIG[paymentStatus] : null;
    // Only render on the imported tab and only when a payment status was recorded.
    const showPayment = activeTab === 'imported' && !!paymentCfg;

    // Vendor/contractor name shown under the material name. A grouped material can
    // hold batches from different vendors, so collapse to the single name when they
    // all match, otherwise show the vendor count.
    const vendorNames = Array.from(new Set(
        (material.variants || [])
            .map(v => (v.contractor_name || '').trim())
            .filter(Boolean)
    ));
    const vendorLabel = vendorNames.length === 0
        ? (material.contractor_name || '').trim()
        : vendorNames.length === 1
            ? vendorNames[0]
            : `${vendorNames.length} vendors`;

    return (
        <>
            <Animated.View
                style={[
                    styles.materialCard,
                    {
                        opacity: animation,
                        transform: [
                            {
                                translateY: animation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0],
                                }),
                            },
                        ],
                    },
                ]}
            >
                <View style={styles.cardContent}>
                    {/* Header */}
                    <View style={styles.materialHeader}>
                        <View style={styles.materialTitleSection}>
                            <View style={[styles.iconContainer, { backgroundColor: material.color + '20' }]}>
                                <Ionicons name={material.icon} size={18} color={material.color} />
                            </View>
                            <View style={styles.materialTitleInfo}>
                                <View style={styles.materialNameRow}>
                                    <Text style={styles.materialNameText}>{material.name}</Text>
                                    {!!vendorLabel && (
                                        <View style={styles.vendorRow}>
                                            <Ionicons name="person-outline" size={12} color="#2563EB" />
                                            <Text style={styles.vendorText} numberOfLines={1}>
                                                {vendorLabel}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                {showMiniSectionLabel && material.miniSectionId && (
                                    <View style={styles.miniSectionBadge}>
                                        <Ionicons name="location" size={12} color="#3A78B5" />
                                        <Text style={styles.miniSectionText}>
                                            {getMiniSectionName(material.miniSectionId)}
                                        </Text>
                                    </View>
                                )}
                                {material.variants.length > 1 && (
                                    <Text style={styles.variantCountText}>
                                        {material.variants.length} variants
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            <View style={styles.dateContainer}>
                                <Text style={styles.dateText}>{formatDate(material.date)}</Text>
                            </View>
                            {/* Three-dot menu - Show for imported materials when the user can
                                add stock/transfer OR can edit (admin on unused material).
                                Staff can open the menu for Add Stock & Transfer; Edit Stock
                                stays hidden for them via the canEdit gate inside the menu. */}
                            {activeTab === 'imported' && (onTransferMaterial || canEdit) && (
                                <TouchableOpacity
                                    style={styles.optionsButton}
                                    onPress={() => {
                                        setShowOptionsMenu(true);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    


                    {/* Statistics Section */}
                    <View style={styles.statsSection}>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Total Purchase</Text>
                                <Text style={styles.statValue}>
                                    {material.totalImported || material.totalQuantity || 0} {material.unit}
                                </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>
                                    {activeTab === 'used' ? 'Still Available' : 'Total Used'}
                                </Text>
                                <Text style={styles.statValue}>
                                    {activeTab === 'used'
                                        ? (material.currentlyAvailable !== undefined && material.currentlyAvailable !== null
                                            ? material.currentlyAvailable
                                            : Math.max(0, (material.totalImported || material.totalQuantity) - (material.totalUsed || 0)))  // Calculate remaining
                                        : (material.totalUsed !== undefined && material.totalUsed !== null
                                            ? material.totalUsed
                                            : 0)  // In imported tab, show total used
                                    } {material.unit}
                                </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>
                                    {activeTab === 'used' ? 'Quantity Used' : 'Remaining Material'}
                                </Text>
                                <View style={styles.statValueWithIcon}>
                                    {isLowStock && (
                                        <Ionicons name="warning" size={12} color="#EF4444" style={styles.statAlertIcon} />
                                    )}
                                    <Text style={[styles.statValue, isLowStock && styles.statValueAlert]}>
                                        {activeTab === 'used'
                                            ? material.totalQuantity  // In used tab, totalQuantity = used quantity
                                            : (material.currentlyAvailable !== undefined && material.currentlyAvailable !== null
                                                ? material.currentlyAvailable
                                                : material.totalQuantity)  // In imported tab, show currently available or fallback to totalQuantity
                                        } {material.unit}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Specifications - shown in place of the old progress bar */}
                        {material.specs && Object.keys(material.specs).length > 0 && (
                            <View style={styles.specsRow}>
                                {Object.entries(material.specs).map(([key, value], index) => (
                                    <View key={index} style={[styles.specChip, { backgroundColor: SPEC_CHIP_COLOR.bg }]}>
                                        <Text style={[styles.specChipText, { color: SPEC_CHIP_COLOR.text }]}>
                                            <Text style={styles.specChipKey}>{key}: </Text>
                                            {value}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Cost Information - Compact with Per Unit Cost */}
                        <View style={styles.costSectionCompact}>
                            <View style={styles.costRowCompact}>
                                <Text style={styles.costLabelCompact}>Per Unit:</Text>
                                <Text style={styles.costValueCompact}>
                                    ₹{(() => {
                                        // ✅ CRITICAL FIX: Calculate per-unit cost correctly
                                        const totalCost = Number(material.totalCost) || 0;
                                        const totalQty = Number(material.totalQuantity) || 1;
                                        const perUnitCost = totalQty > 0 ? totalCost / totalQty : 0;
                                        return perUnitCost.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                                    })()}/{material.unit}
                                </Text>
                            </View>
                            
                            {/* Only show middle column for "Used Materials" tab */}
                            {activeTab === 'used' && (
                                <>
                                    <View style={styles.costDivider} />
                                    <View style={styles.costRowCompact}>
                                        <Text style={styles.costLabelCompact}>Used Cost:</Text>
                                        <Text style={styles.costValueCompact}>
                                            ₹{(() => {
                                                // ✅ CRITICAL FIX: Used cost is just the totalCost (already calculated correctly in grouping)
                                                const usedCost = Number(material.totalCost) || 0;
                                                return usedCost.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                                            })()}
                                        </Text>
                                    </View>
                                </>
                            )}
                            
                            <View style={styles.costDivider} />
                            <View style={styles.costRowCompact}>
                                <Text style={styles.costLabelCompact}>Total:</Text>
                                <Text style={styles.costValueCompact}>
                                    ₹{(() => {
                                        // ✅ CRITICAL FIX: Calculate total cost correctly
                                        const totalCost = Number(material.totalCost) || 0;
                                        const totalQty = Number(material.totalQuantity) || 1;
                                        const perUnitCost = totalQty > 0 ? totalCost / totalQty : 0;
                                        const totalImported = Number(material.totalImported) || Number(material.totalQuantity) || 0;
                                        const totalImportedCost = perUnitCost * totalImported;
                                        return totalImportedCost.toLocaleString('en-IN');
                                    })()}
                                </Text>
                            </View>
                        </View>

                        {/* Vendor payment status — shows how much of this material's
                            purchase cost has been paid to the vendor. The "Do Payment"
                            action lives inside the tag itself when a balance is due. */}
                        {showPayment && paymentCfg && (
                            <View style={[styles.paymentRow, { backgroundColor: paymentCfg.bg, borderColor: paymentCfg.border }]}>
                                <View style={styles.paymentLeft}>
                                    <Ionicons name={paymentCfg.icon} size={16} color={paymentCfg.color} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.paymentLabel, { color: paymentCfg.color }]} numberOfLines={1}>
                                            {paymentCfg.label}
                                        </Text>
                                        {paymentStatus === 'partial' ? (
                                            <Text style={styles.paymentAmount} numberOfLines={1}>
                                                ₹{Number(amountPaid).toLocaleString('en-IN')} paid
                                                {amountRemaining > 0 ? ` · ₹${Number(amountRemaining).toLocaleString('en-IN')} due` : ''}
                                            </Text>
                                        ) : paymentStatus === 'unpaid' ? (
                                            <Text style={styles.paymentAmount} numberOfLines={1}>
                                                ₹{Number(amountRemaining).toLocaleString('en-IN')} due
                                            </Text>
                                        ) : (
                                            <Text style={styles.paymentAmount} numberOfLines={1}>
                                                ₹{Number(amountPaid).toLocaleString('en-IN')}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                {/* Do Payment — inline, only when there is an outstanding balance */}
                                {(paymentStatus === 'partial' || paymentStatus === 'unpaid') && (
                                    <TouchableOpacity
                                        style={[styles.doPaymentButton, { borderColor: paymentCfg.color }]}
                                        onPress={handleOpenPaymentModal}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="card-outline" size={14} color={paymentCfg.color} />
                                        <Text style={[styles.doPaymentButtonText, { color: paymentCfg.color }]} numberOfLines={1}>Pay</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Add Stock - moved out of the options menu onto the card itself */}
                        {activeTab === 'imported' && (
                            <TouchableOpacity
                                style={styles.addStockButton}
                                onPress={handleOpenAddStockModal}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="add-circle" size={16} color="#3A78B5" />
                                <Text style={styles.addStockButtonText}>Add more material</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Animated.View>

            {/* Variant Selector Modal */}
            <Modal
                visible={showVariantSelector}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowVariantSelector(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowVariantSelector(false)}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            {variantSelectionMode === 'usage'
                                ? 'Select Specification'
                                : variantSelectionMode === 'edit'
                                    ? 'Select Stock to Edit'
                                    : variantSelectionMode === 'addStock'
                                        ? 'Select Stock to Add To'
                                        : 'Select Material to Transfer'}
                        </Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <Text style={styles.modalSubtitle}>
                            {variantSelectionMode === 'usage'
                                ? `Choose the specification of ${material.name} you want to use:`
                                : variantSelectionMode === 'edit'
                                    ? `Choose the specification of ${material.name} you want to edit:`
                                    : variantSelectionMode === 'addStock'
                                        ? `Choose the specification of ${material.name} you want to add to:`
                                        : `Choose the specification of ${material.name} you want to transfer:`
                            }
                        </Text>
                        {material.variants.map((variant, index) => (
                            <TouchableOpacity
                                key={variant._id}
                                style={styles.variantOption}
                                onPress={() => handleSelectVariant(variant)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.variantInfo}>
                                    <Text style={styles.variantSpecsText}>
                                        {formatSpecs(variant.specs)}
                                    </Text>
                                    <Text style={styles.variantQuantityText}>
                                        Available: {variant.quantity} {material.unit}
                                    </Text>
                                    <Text style={styles.variantCostText}>
                                        Cost: ₹{variant.cost.toLocaleString('en-IN')}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>

            {/* Usage Input Modal */}
            <Modal
                visible={showUsageModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowUsageModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowUsageModal(false)}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Add Usage</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {/* Material Info */}
                        <View style={styles.usageMaterialInfo}>
                            <View style={[styles.iconContainerLarge, { backgroundColor: material.color + '20' }]}>
                                <Ionicons name={material.icon} size={32} color={material.color} />
                            </View>
                            <View style={styles.usageMaterialDetails}>
                                <Text style={styles.usageMaterialName}>{material.name}</Text>
                                {selectedVariant && (
                                    <Text style={styles.usageMaterialSpecs}>
                                        {formatSpecs(selectedVariant.specs)}
                                    </Text>
                                )}
                                <Text style={styles.usageMaterialAvailable}>
                                    Available: {selectedVariant?.quantity || 0} {material.unit}
                                </Text>
                            </View>
                        </View>

                        {/* Quantity Input */}
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Quantity to Use ({material.unit})</Text>
                            <TextInput
                                style={styles.quantityInput}
                                value={usageQuantity}
                                onChangeText={setUsageQuantity}
                                keyboardType="decimal-pad"
                                placeholder="Enter quantity"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Quick Add Buttons */}
                        <View style={styles.quickAddSection}>
                            <Text style={styles.quickAddLabel}>Quick Add:</Text>
                            <View style={styles.quickAddButtons}>
                                {getQuickAddButtons().map((qty) => (
                                    <TouchableOpacity
                                        key={qty}
                                        style={styles.quickAddButton}
                                        onPress={() => setUsageQuantity(qty.toString())}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.quickAddButtonText}>{qty}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Add Button */}
                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                (!usageQuantity || parseFloat(usageQuantity) <= 0) && styles.confirmButtonDisabled
                            ]}
                            onPress={handleAddUsage}
                            activeOpacity={0.8}
                            disabled={!usageQuantity || parseFloat(usageQuantity) <= 0}
                        >
                            <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={usageQuantity && parseFloat(usageQuantity) > 0 ? "#FFFFFF" : "#9CA3AF"}
                            />
                            <Text style={[
                                styles.confirmButtonText,
                                (!usageQuantity || parseFloat(usageQuantity) <= 0) && styles.confirmButtonTextDisabled
                            ]}>
                                Add to Used Materials
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>

            {/* Options Menu Modal */}
            <Modal
                visible={showOptionsMenu}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowOptionsMenu(false)}
            >
                <TouchableOpacity
                    style={styles.optionsOverlay}
                    activeOpacity={1}
                    onPress={() => setShowOptionsMenu(false)}
                >
                    <View style={styles.optionsMenu}>
                        {canEdit && (
                            <>
                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={handleOpenEditModal}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="create-outline" size={20} color="#3A78B5" />
                                    <Text style={styles.optionText}>Edit Stock</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                                </TouchableOpacity>

                                <View style={styles.optionDivider} />
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={handleOpenTransferModal}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="swap-horizontal" size={20} color="#3A78B5" />
                            <Text style={styles.optionText}>Transfer Material</Text>
                            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Project Selector Modal */}
            <Modal
                visible={showProjectSelector}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowProjectSelector(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowProjectSelector(false)}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Select Project</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <Text style={styles.modalSubtitle}>
                            Choose the project to transfer {material.name} to:
                        </Text>
                        
                        {loadingProjects ? (
                            <View style={styles.loadingContainer}>
                                <Ionicons name="sync" size={32} color="#3A78B5" />
                                <Text style={styles.loadingText}>Loading projects...</Text>
                            </View>
                        ) : availableProjects.length > 0 ? (
                            availableProjects.map((project) => (
                                <TouchableOpacity
                                    key={project._id}
                                    style={styles.projectOption}
                                    onPress={() => handleSelectProject(project)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.projectInfo}>
                                        <View style={styles.projectIconContainer}>
                                            <Ionicons name="folder" size={24} color="#3A78B5" />
                                        </View>
                                        <View style={styles.projectDetails}>
                                            <Text style={styles.projectName}>{project.name}</Text>
                                            {project.description && (
                                                <Text style={styles.projectDescription}>{project.description}</Text>
                                            )}
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="folder-outline" size={48} color="#9CA3AF" />
                                <Text style={styles.emptyStateTitle}>No Projects Available</Text>
                                <Text style={styles.emptyStateDescription}>
                                    No other projects found for material transfer.
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>

            {/* Transfer Quantity Modal */}
            <Modal
                visible={showTransferModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowTransferModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowTransferModal(false)}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Transfer Material</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {/* Transfer Summary */}
                        <View style={styles.transferSummary}>
                            <View style={styles.transferHeader}>
                                <Ionicons name="swap-horizontal" size={24} color="#3A78B5" />
                                <Text style={styles.transferTitle}>Material Transfer</Text>
                            </View>
                            
                            <View style={styles.transferDetails}>
                                <View style={styles.transferRow}>
                                    <Text style={styles.transferLabel}>Material:</Text>
                                    <Text style={styles.transferValue}>{material.name}</Text>
                                </View>
                                
                                {selectedTransferVariant && (
                                    <View style={styles.transferRow}>
                                        <Text style={styles.transferLabel}>Specifications:</Text>
                                        <Text style={styles.transferValue}>
                                            {formatSpecs(selectedTransferVariant.specs)}
                                        </Text>
                                    </View>
                                )}
                                
                                <View style={styles.transferRow}>
                                    <Text style={styles.transferLabel}>Available:</Text>
                                    <Text style={styles.transferValue}>
                                        {selectedTransferVariant?.quantity || 0} {material.unit}
                                    </Text>
                                </View>
                                
                                <View style={styles.transferRow}>
                                    <Text style={styles.transferLabel}>To Project:</Text>
                                    <Text style={styles.transferValue}>{selectedProject?.name}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Quantity Input */}
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Quantity to Transfer ({material.unit})</Text>
                            <TextInput
                                style={styles.quantityInput}
                                value={transferQuantity}
                                onChangeText={setTransferQuantity}
                                keyboardType="decimal-pad"
                                placeholder="Enter quantity"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Quick Add Buttons */}
                        <View style={styles.quickAddSection}>
                            <Text style={styles.quickAddLabel}>Quick Select:</Text>
                            <View style={styles.quickAddButtons}>
                                {getQuickAddButtons().map((qty) => (
                                    <TouchableOpacity
                                        key={qty}
                                        style={styles.quickAddButton}
                                        onPress={() => setTransferQuantity(qty.toString())}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.quickAddButtonText}>{qty}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Transfer Button */}
                        <TouchableOpacity
                            style={[
                                styles.transferButton,
                                (!transferQuantity || parseFloat(transferQuantity) <= 0) && styles.transferButtonDisabled
                            ]}
                            onPress={handleTransferMaterial}
                            activeOpacity={0.8}
                            disabled={!transferQuantity || parseFloat(transferQuantity) <= 0}
                        >
                            <Ionicons
                                name="swap-horizontal"
                                size={20}
                                color={transferQuantity && parseFloat(transferQuantity) > 0 ? "#FFFFFF" : "#9CA3AF"}
                            />
                            <Text style={[
                                styles.transferButtonText,
                                (!transferQuantity || parseFloat(transferQuantity) <= 0) && styles.transferButtonTextDisabled
                            ]}>
                                Transfer Material
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>

            {/* Do Payment Modal */}
            <Modal
                visible={showPaymentModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowPaymentModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Record Payment</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                        {/* Material Info */}
                        <View style={styles.usageMaterialInfo}>
                            <View style={[styles.iconContainerLarge, { backgroundColor: material.color + '20' }]}>
                                <Ionicons name={material.icon} size={24} color={material.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.usageMaterialName}>{material.name}</Text>
                                <Text style={styles.usageMaterialSpecs}>Vendor payment</Text>
                            </View>
                        </View>

                        {/* Payment summary */}
                        <View style={styles.paymentSummaryCard}>
                            <View style={styles.paymentSummaryRow}>
                                <Text style={styles.paymentSummaryLabel}>Total Cost</Text>
                                <Text style={styles.paymentSummaryValue}>
                                    ₹{Number(material.paymentTotalCost ?? 0).toLocaleString('en-IN')}
                                </Text>
                            </View>
                            <View style={styles.paymentSummaryRow}>
                                <Text style={styles.paymentSummaryLabel}>Already Paid</Text>
                                <Text style={[styles.paymentSummaryValue, { color: '#10B981' }]}>
                                    ₹{Number(amountPaid).toLocaleString('en-IN')}
                                </Text>
                            </View>
                            <View style={styles.paymentSummaryDivider} />
                            <View style={styles.paymentSummaryRow}>
                                <Text style={[styles.paymentSummaryLabel, { fontWeight: '700', color: '#1E293B' }]}>Outstanding</Text>
                                <Text style={[styles.paymentSummaryValue, { color: '#EF4444', fontSize: 16 }]}>
                                    ₹{Number(amountRemaining).toLocaleString('en-IN')}
                                </Text>
                            </View>
                        </View>

                        {/* Amount input */}
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Payment Amount (₹) *</Text>
                            <TextInput
                                style={styles.quantityInput}
                                value={paymentInput}
                                onChangeText={setPaymentInput}
                                keyboardType="decimal-pad"
                                placeholder="Enter amount"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Quick pay-full chip */}
                        {amountRemaining > 0 && (
                            <TouchableOpacity
                                style={styles.payFullChip}
                                onPress={() => setPaymentInput(String(Math.round(amountRemaining)))}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="cash-outline" size={14} color="#3A78B5" />
                                <Text style={styles.payFullChipText}>
                                    Pay full · ₹{Number(amountRemaining).toLocaleString('en-IN')}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Confirm button */}
                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                (!paymentInput || parseFloat(paymentInput) <= 0 || isSubmittingPayment) && styles.confirmButtonDisabled,
                                { marginTop: 20 },
                            ]}
                            onPress={handleRecordPayment}
                            disabled={!paymentInput || parseFloat(paymentInput) <= 0 || isSubmittingPayment}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="checkmark-circle"
                                size={18}
                                color={paymentInput && parseFloat(paymentInput) > 0 && !isSubmittingPayment ? '#FFFFFF' : '#9CA3AF'}
                            />
                            <Text style={[
                                styles.confirmButtonText,
                                (!paymentInput || parseFloat(paymentInput) <= 0 || isSubmittingPayment) && styles.confirmButtonTextDisabled,
                            ]}>
                                {isSubmittingPayment ? 'Recording...' : 'Record Payment'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>

            {/* Add Stock Modal */}
            <Modal
                visible={showAddStockModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAddStockModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowAddStockModal(false)}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Add Stock</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {/* Material Info */}
                        <View style={styles.usageMaterialInfo}>
                            <View style={[styles.iconContainerLarge, { backgroundColor: material.color + '20' }]}>
                                <Ionicons name={material.icon} size={32} color={material.color} />
                            </View>
                            <View style={styles.usageMaterialDetails}>
                                <Text style={styles.usageMaterialName}>{material.name}</Text>
                                {selectedStockVariant && (
                                    <Text style={styles.usageMaterialSpecs}>
                                        {formatSpecs(selectedStockVariant.specs)}
                                    </Text>
                                )}
                                <Text style={styles.usageMaterialAvailable}>
                                    Current Stock: {selectedStockVariant?.quantity || 0} {material.unit}
                                </Text>
                            </View>
                        </View>

                        {/* Quantity Input */}
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Quantity to Add ({material.unit}) *</Text>
                            <TextInput
                                style={styles.quantityInput}
                                value={addStockQuantity}
                                onChangeText={setAddStockQuantity}
                                keyboardType="decimal-pad"
                                placeholder="Enter quantity"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Cost Input */}
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Per Unit Cost (₹/{material.unit}) - Optional</Text>
                            <TextInput
                                style={styles.quantityInput}
                                value={addStockCost}
                                onChangeText={setAddStockCost}
                                keyboardType="decimal-pad"
                                placeholder="Enter cost per unit"
                                placeholderTextColor="#9CA3AF"
                            />
                            <Text style={styles.inputHint}>
                                Leave empty if cost remains the same
                            </Text>
                        </View>

                        {/* Vendor / Contractor Input */}
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Vendor / Contractor - Optional</Text>
                            <TextInput
                                style={styles.quantityInput}
                                value={addStockVendor}
                                onChangeText={setAddStockVendor}
                                keyboardType="default"
                                placeholder="Enter vendor or contractor name"
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="words"
                            />
                            <Text style={styles.inputHint}>
                                Leave empty if vendor remains the same
                            </Text>
                        </View>

                        {/* Quick Add Buttons */}
                        <View style={styles.quickAddSection}>
                            <Text style={styles.quickAddLabel}>Quick Add:</Text>
                            <View style={styles.quickAddButtons}>
                                {getQuickAddButtons().map((qty) => (
                                    <TouchableOpacity
                                        key={qty}
                                        style={styles.quickAddButton}
                                        onPress={() => setAddStockQuantity(qty.toString())}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.quickAddButtonText}>{qty}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Summary */}
                        {addStockQuantity && parseFloat(addStockQuantity) > 0 && (
                            <View style={styles.addStockSummary}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>New Total:</Text>
                                    <Text style={styles.summaryValue}>
                                        {(selectedStockVariant?.quantity || 0) + parseFloat(addStockQuantity)} {material.unit}
                                    </Text>
                                </View>
                                {addStockCost && parseFloat(addStockCost) > 0 && (
                                    <>
                                        <View style={styles.summaryRow}>
                                            <Text style={styles.summaryLabel}>Total Cost:</Text>
                                            <Text style={styles.summaryValue}>
                                                ₹{(parseFloat(addStockQuantity) * parseFloat(addStockCost)).toLocaleString('en-IN')}
                                            </Text>
                                        </View>
                                        {/* Warning if cost is different */}
                                        {selectedStockVariant && Math.abs(parseFloat(addStockCost) - (selectedStockVariant.cost || 0)) > 0.01 && (
                                            <View style={styles.costWarning}>
                                                <Ionicons name="information-circle" size={16} color="#D97706" />
                                                <Text style={styles.costWarningText}>
                                                    Different cost detected! A new material entry will be created to track this separately.
                                                </Text>
                                            </View>
                                        )}
                                    </>
                                )}
                                {/* Warning if vendor is different */}
                                {addStockVendor.trim() !== '' && (
                                    <View style={[styles.costWarning, { backgroundColor: '#EAF0FE', borderColor: '#C4D8FC' }]}>
                                        <Ionicons name="person-circle" size={16} color="#3A78B5" />
                                        <Text style={[styles.costWarningText, { color: '#1D4ED8' }]}>
                                            Vendor entered! A new material entry will be created for this vendor.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Add Stock Button */}
                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                (!addStockQuantity || parseFloat(addStockQuantity) <= 0) && styles.confirmButtonDisabled
                            ]}
                            onPress={handleAddStock}
                            activeOpacity={0.8}
                            disabled={!addStockQuantity || parseFloat(addStockQuantity) <= 0}
                        >
                            <Ionicons
                                name="add-circle"
                                size={20}
                                color={addStockQuantity && parseFloat(addStockQuantity) > 0 ? "#FFFFFF" : "#9CA3AF"}
                            />
                            <Text style={[
                                styles.confirmButtonText,
                                (!addStockQuantity || parseFloat(addStockQuantity) <= 0) && styles.confirmButtonTextDisabled
                            ]}>
                                Add to Stock
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>

            {/* Edit Stock Modal (admin-only, unused materials) */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowEditModal(false)}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Edit Stock</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {/* Material Info */}
                        <View style={styles.usageMaterialInfo}>
                            <View style={[styles.iconContainerLarge, { backgroundColor: material.color + '20' }]}>
                                <Ionicons name={material.icon} size={32} color={material.color} />
                            </View>
                            <View style={styles.usageMaterialDetails}>
                                <Text style={styles.usageMaterialName}>{material.name}</Text>
                                <Text style={styles.usageMaterialAvailable}>
                                    Current Stock: {selectedEditVariant?.quantity || 0} {material.unit}
                                </Text>
                            </View>
                        </View>

                        {/* Name */}
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Material Name *</Text>
                            <TextInput
                                style={styles.quantityInput}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Enter material name"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Unit */}
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Unit *</Text>
                            <TextInput
                                style={styles.quantityInput}
                                value={editUnit}
                                onChangeText={setEditUnit}
                                placeholder="e.g. bags, kg, pieces"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Quantity */}
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Quantity ({editUnit || material.unit}) *</Text>
                            <TextInput
                                style={styles.quantityInput}
                                value={editQuantity}
                                onChangeText={setEditQuantity}
                                keyboardType="decimal-pad"
                                placeholder="Enter quantity"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Per Unit Cost */}
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Per Unit Cost (₹/{editUnit || material.unit})</Text>
                            <TextInput
                                style={styles.quantityInput}
                                value={editCost}
                                onChangeText={setEditCost}
                                keyboardType="decimal-pad"
                                placeholder="Enter cost per unit"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Vendor / Contractor */}
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Vendor / Contractor</Text>
                            <TextInput
                                style={styles.quantityInput}
                                value={editVendor}
                                onChangeText={setEditVendor}
                                placeholder="Enter vendor or contractor name"
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="words"
                            />
                        </View>

                        {/* Specifications */}
                        {Object.keys(editSpecs).length > 0 && (
                            <View style={styles.inputSection}>
                                <Text style={styles.inputLabel}>Specifications</Text>
                                {Object.keys(editSpecs).map((key) => (
                                    <View key={key} style={styles.editSpecRow}>
                                        <Text style={styles.editSpecKey}>{key}</Text>
                                        <TextInput
                                            style={[styles.quantityInput, styles.editSpecInput]}
                                            value={editSpecs[key]}
                                            onChangeText={(text) =>
                                                setEditSpecs((prev) => ({ ...prev, [key]: text }))
                                            }
                                            placeholder={`Enter ${key}`}
                                            placeholderTextColor="#9CA3AF"
                                        />
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Summary */}
                        {editQuantity !== '' && parseFloat(editQuantity) > 0 && (
                            <View style={styles.addStockSummary}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Total Cost:</Text>
                                    <Text style={styles.summaryValue}>
                                        ₹{(parseFloat(editQuantity) * (editCost === '' ? 0 : parseFloat(editCost) || 0)).toLocaleString('en-IN')}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                { backgroundColor: '#3A78B5' },
                                (savingEdit || !editQuantity || parseFloat(editQuantity) <= 0) && styles.confirmButtonDisabled
                            ]}
                            onPress={handleSaveEdit}
                            activeOpacity={0.8}
                            disabled={savingEdit || !editQuantity || parseFloat(editQuantity) <= 0}
                        >
                            <Ionicons
                                name="save-outline"
                                size={20}
                                color={!savingEdit && editQuantity && parseFloat(editQuantity) > 0 ? "#FFFFFF" : "#9CA3AF"}
                            />
                            <Text style={[
                                styles.confirmButtonText,
                                (savingEdit || !editQuantity || parseFloat(editQuantity) <= 0) && styles.confirmButtonTextDisabled
                            ]}>
                                {savingEdit ? 'Saving...' : 'Save Changes'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>


        </>
    );
};

const styles = StyleSheet.create({
    materialCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    cardContent: {
        padding: 10,
    },
    materialHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    materialTitleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 34,
        height: 34,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    iconContainerLarge: {
        width: 64,
        height: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    materialTitleInfo: {
        flex: 1,
    },
    materialNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    materialNameText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginRight: 8,
    },
    specsBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    specsText: {
        fontSize: 11,
        color: '#92400E',
        fontWeight: '600',
    },
    miniSectionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAF0FE',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 5,
        marginTop: 2,
        alignSelf: 'flex-start',
        gap: 4,
    },
    miniSectionText: {
        fontSize: 10,
        color: '#3A78B5',
        fontWeight: '600',
    },
    vendorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 4,
        flexShrink: 1,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    vendorText: {
        fontSize: 11,
        color: '#2563EB',
        fontWeight: '600',
        letterSpacing: 0.1,
        flexShrink: 1,
    },
    variantCountText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
    },
    lowStockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 5,
        gap: 3,
    },
    lowStockBadgeText: {
        fontSize: 10,
        color: '#EF4444',
        fontWeight: '700',
    },
    dateContainer: {
        alignItems: 'flex-end',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    optionsButton: {
        padding: 4,
        borderRadius: 6,
        backgroundColor: '#F3F4F6',
    },
    dateText: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    statsSection: {
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 28,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 6,
    },
    statLabel: {
        fontSize: 10,
        color: '#6B7280',
        marginBottom: 1,
        textAlign: 'center',
    },
    statValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3A78B5',
        textAlign: 'center',
    },
    statValueAlert: {
        color: '#EF4444',
    },
    statValueWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statAlertIcon: {
        marginRight: 3,
    },
    costSection: {
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    costLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    costValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    // Compact cost section styles
    costSectionCompact: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    costRowCompact: {
        flex: 1,
        alignItems: 'center',
    },
    costDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 8,
    },
    costLabelCompact: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 1,
    },
    costValueCompact: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1F2937',
    },
    // Compact inline specification chips (replaces the old boxed specs section)
    specsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 4,
        marginBottom: 8,
    },
    specChip: {
        borderRadius: 20,
        paddingHorizontal: 9,
        paddingVertical: 4,
    },
    specChipText: {
        fontSize: 11,
        fontWeight: '600',
    },
    specChipKey: {
        fontWeight: '500',
        textTransform: 'capitalize',
        opacity: 0.75,
    },
    paymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 10,
        gap: 8,
    },
    doPaymentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        gap: 4,
        flexShrink: 0,
    },
    doPaymentButtonText: {
        fontSize: 12,
        fontWeight: '700',
    },
    paymentSummaryCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
        gap: 10,
    },
    paymentSummaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    paymentSummaryLabel: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    paymentSummaryValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    paymentSummaryDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    payFullChip: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        backgroundColor: '#EAF0FE',
        borderWidth: 1,
        borderColor: '#3A78B5',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginTop: 10,
    },
    payFullChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3A78B5',
    },
    paymentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    paymentLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    paymentAmount: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 1,
    },
    addStockButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EAF0FE',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3A78B5',
        gap: 6,
        marginTop: 8,
    },
    addStockButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3A78B5',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    variantOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    variantInfo: {
        flex: 1,
    },
    variantSpecsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    variantQuantityText: {
        fontSize: 14,
        color: '#059669',
        marginBottom: 2,
    },
    variantCostText: {
        fontSize: 12,
        color: '#6B7280',
    },
    usageMaterialInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    usageMaterialDetails: {
        flex: 1,
        marginLeft: 16,
    },
    usageMaterialName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    usageMaterialSpecs: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    usageMaterialAvailable: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '500',
    },
    inputSection: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    quantityInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#FFFFFF',
    },
    quickAddSection: {
        marginBottom: 24,
    },
    quickAddLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 12,
    },
    quickAddButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    quickAddButton: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    quickAddButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#059669',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    confirmButtonDisabled: {
        backgroundColor: '#F3F4F6',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    confirmButtonTextDisabled: {
        color: '#9CA3AF',
    },
    // Options menu styles
    optionsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsMenu: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 8,
        minWidth: 260,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
    },
    // Project selector styles
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
    },
    projectOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    projectInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    projectIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EAF0FE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    projectDetails: {
        flex: 1,
    },
    projectName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    projectDescription: {
        fontSize: 14,
        color: '#6B7280',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
    },
    emptyStateDescription: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    // Transfer modal styles
    transferSummary: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    transferHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    transferTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    transferDetails: {
        gap: 8,
    },
    transferRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transferLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    transferValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    transferButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3A78B5',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    transferButtonDisabled: {
        backgroundColor: '#F3F4F6',
    },
    transferButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    transferButtonTextDisabled: {
        color: '#9CA3AF',
    },
    // Add Stock modal styles
    addStockSummary: {
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#166534',
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 16,
        color: '#166534',
        fontWeight: '700',
    },
    inputHint: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        fontStyle: 'italic',
    },
    optionDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
    },
    costWarning: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
        gap: 8,
    },
    costWarningText: {
        flex: 1,
        fontSize: 12,
        color: '#92400E',
        lineHeight: 16,
    },
    editSpecRow: {
        marginBottom: 12,
    },
    editSpecKey: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
        textTransform: 'capitalize',
        marginBottom: 6,
    },
    editSpecInput: {
        marginBottom: 0,
    },

});

export default MaterialCardEnhanced;
