/**
 * EXAMPLE: How to Integrate Material Notifications
 * 
 * This file shows exactly where and how to add notification calls
 * in your existing components.
 */

// ============================================
// EXAMPLE 1: Material Import Modal
// File: Xsite/components/notification/MaterialImportModal.tsx
// ============================================

import { useMaterialNotifications } from '@/hooks/useMaterialNotifications';

const MaterialImportModal = ({ onImport, ...props }) => {
    // Add this hook at the top of your component
    const { showBatchMaterialAddedNotification } = useMaterialNotifications();

    const handleImportAll = () => {
        // ... existing validation code ...

        Alert.alert(
            'Confirm Import',
            `Import all materials...`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Import All',
                    onPress: async () => {
                        const apiPayload = {
                            requestId: requestId,
                            materials: materialsWithCosts
                        };

                        // Call your existing onImport
                        await onImport(apiPayload);
                        
                        // ✅ ADD THIS: Show notification after successful import
                        showBatchMaterialAddedNotification(
                            materialsWithCosts.map(m => ({
                                name: m.name,
                                qnt: m.qnt,
                                unit: m.unit
                            })),
                            sectionName // or projectName if available
                        );

                        onClose();
                        setMaterialCosts({});
                    }
                }
            ]
        );
    };
};

// ============================================
// EXAMPLE 2: Material Usage (Batch)
// File: Xsite/app/details.tsx
// ============================================

import { useMaterialNotifications } from '@/hooks/useMaterialNotifications';

const DetailsPage = () => {
    // Add this hook at the top of your component
    const { showBatchMaterialUsedNotification } = useMaterialNotifications();

    const handleSubmitUsage = async () => {
        try {
            // ... existing API call code ...
            const response = await axios.post(`${domain}/api/material-usage-batch`, apiPayload);

            if (response.data.success) {
                // ✅ ADD THIS: Show notification after successful usage
                showBatchMaterialUsedNotification(
                    apiPayload.materials.map(m => ({
                        name: m.name,
                        qnt: m.qnt,
                        unit: m.unit
                    })),
                    projectName // Make sure you have projectName in scope
                );

                // ... rest of your success handling ...
                toast.success('Materials used successfully');
            }
        } catch (error) {
            // ... error handling ...
        }
    };
};

// ============================================
// EXAMPLE 3: Add Stock Modal (Single Material)
// File: Xsite/components/details/AddStockModal.tsx
// ============================================

import { useMaterialNotifications } from '@/hooks/useMaterialNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddStockModal = () => {
    // Add this hook at the top of your component
    const { showMaterialAddedNotification } = useMaterialNotifications();

    const handleSubmit = async () => {
        try {
            // ... existing API call code ...
            const response = await axios.post(`${domain}/api/material`, payload);

            if (response.data.success) {
                // Get user data for notification
                const userDetailsString = await AsyncStorage.getItem("user");
                const userData = userDetailsString ? JSON.parse(userDetailsString) : null;

                // ✅ ADD THIS: Show notification after successful stock addition
                if (userData) {
                    showMaterialAddedNotification({
                        materialName: formData.name,
                        quantity: parseFloat(formData.quantity),
                        unit: formData.unit,
                        projectName: projectName, // Make sure you have this
                        userName: `${userData.firstName} ${userData.lastName}`,
                        userEmail: userData.email,
                        clientId: userData.clientId,
                        companyName: userData.companyName || 'Your Company'
                    });
                }

                // ... rest of your success handling ...
                toast.success('Material added successfully');
                onClose();
            }
        } catch (error) {
            // ... error handling ...
        }
    };
};

// ============================================
// EXAMPLE 4: Material Card (Single Usage)
// File: Xsite/components/details/MaterialCardEnhanced.tsx
// ============================================

import { useMaterialNotifications } from '@/hooks/useMaterialNotifications';

const MaterialCardEnhanced = ({ onAddUsage, ...props }) => {
    // Add this hook at the top of your component
    const { showMaterialUsedNotification } = useMaterialNotifications();

    const handleConfirmUsage = async () => {
        try {
            // Call your existing onAddUsage
            await onAddUsage(
                material.name,
                material.unit,
                selectedVariant._id,
                quantity,
                selectedVariant.specs
            );

            // Get user data
            const userDetailsString = await AsyncStorage.getItem("user");
            const userData = userDetailsString ? JSON.parse(userDetailsString) : null;

            // ✅ ADD THIS: Show notification after successful usage
            if (userData) {
                showMaterialUsedNotification({
                    materialName: material.name,
                    quantity: parseFloat(usageQuantity),
                    unit: material.unit,
                    projectName: projectName, // Make sure you have this
                    userName: `${userData.firstName} ${userData.lastName}`,
                    userEmail: userData.email,
                    clientId: userData.clientId,
                    companyName: userData.companyName || 'Your Company'
                });
            }

            setShowUsageModal(false);
            setUsageQuantity('');
        } catch (error) {
            console.error('Error adding usage:', error);
        }
    };
};

// ============================================
// EXAMPLE 5: Notification Page (Already Integrated)
// File: Xsite/app/notification.tsx
// ============================================

// The notification page already fetches and displays material activities
// No changes needed here - it will automatically show new activities

// ============================================
// TESTING THE NOTIFICATIONS
// ============================================

/**
 * To test notifications:
 * 
 * 1. Add Material:
 *    - Go to project details
 *    - Click "Add Stock" or import materials
 *    - You should see a green toast: "Material Added"
 * 
 * 2. Use Material:
 *    - Go to project details
 *    - Click on a material card
 *    - Add usage
 *    - You should see a blue toast: "Material Used"
 * 
 * 3. View Activity:
 *    - Go to Notification tab
 *    - See all material activities
 *    - Filter by "Imported" or "Used"
 * 
 * 4. Check Console:
 *    - Open React Native debugger
 *    - Look for logs starting with 📦 or 🔨
 */

export default {};
