import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Paths, File } from 'expo-file-system';
import { Alert, Platform } from 'react-native';

interface MaterialActivity {
    _id: string;
    user: {
        userId: string;
        fullName: string;
    };
    projectId: string;
    projectName?: string;
    sectionName?: string;
    miniSectionName?: string;
    materials: Array<{
        name: string;
        unit: string;
        specs?: Record<string, any>;
        qnt: number;
        perUnitCost: number; // ✅ UPDATED: Use perUnitCost instead of cost
        totalCost: number;   // ✅ UPDATED: Add totalCost field
        cost?: number;       // ✅ LEGACY: Keep for backward compatibility
    }>;
    message?: string;
    activity: 'imported' | 'used' | 'transferred';
    date: string;
    transferDetails?: {
        fromProject: { id: string; name: string };
        toProject: { id: string; name: string };
    };
}

interface GroupedActivities {
    [date: string]: MaterialActivity[];
}

export class PDFReportGenerator {
    private clientData: any;
    private userData: any;

    constructor(clientData: any, userData: any) {
        this.clientData = clientData;
        this.userData = userData;
    }

    // Group activities by date
    private groupActivitiesByDate(activities: MaterialActivity[]): GroupedActivities {
        const grouped: GroupedActivities = {};
        
        activities.forEach(activity => {
            const date = new Date(activity.date).toISOString().split('T')[0]; // YYYY-MM-DD format
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(activity);
        });

        return grouped;
    }

    // ✅ NEW: Group labor data by date
    private groupLaborByDate(laborData: any[]): { [date: string]: any[] } {
        const grouped: { [date: string]: any[] } = {};
        
        laborData.forEach(labor => {
            // Labor entries have a 'date' or 'createdAt' field
            const dateStr = labor.date || labor.createdAt;
            if (!dateStr) return; // Skip if no date
            
            const date = new Date(dateStr).toISOString().split('T')[0]; // YYYY-MM-DD format
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(labor);
        });

        return grouped;
    }

    // ✅ NEW: Group equipment data by date
    private groupEquipmentByDate(equipmentData: any[]): { [date: string]: any[] } {
        const grouped: { [date: string]: any[] } = {};
        
        equipmentData.forEach(equipment => {
            // Equipment entries have a 'date' or 'createdAt' field
            const dateStr = equipment.date || equipment.createdAt;
            if (!dateStr) return; // Skip if no date
            
            const date = new Date(dateStr).toISOString().split('T')[0]; // YYYY-MM-DD format
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(equipment);
        });

        return grouped;
    }

    // ✅ NEW: Generate labor entry HTML
    private generateLaborHTML(laborEntries: any[]): string {
        if (!laborEntries || laborEntries.length === 0) return '';

        const totalLaborCost = laborEntries.reduce((sum, labor) => sum + (Number(labor.totalCost) || 0), 0);

        return `
            <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #fef3c7; padding: 12px; border-bottom: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="background-color: #F59E0B; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                                👷 LABOR COSTS
                            </span>
                            <span style="margin-left: 10px; font-weight: 600; color: #374151;">
                                ${laborEntries.length} ${laborEntries.length === 1 ? 'entry' : 'entries'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f8fafc;">
                            <th style="padding: 10px; text-align: left; font-size: 12px; color: #374151; border-bottom: 2px solid #e2e8f0;">Category</th>
                            <th style="padding: 10px; text-align: left; font-size: 12px; color: #374151; border-bottom: 2px solid #e2e8f0;">Type</th>
                            <th style="padding: 10px; text-align: center; font-size: 12px; color: #374151; border-bottom: 2px solid #e2e8f0;">Count</th>
                            <th style="padding: 10px; text-align: right; font-size: 12px; color: #374151; border-bottom: 2px solid #e2e8f0;">Per Labor Cost</th>
                            <th style="padding: 10px; text-align: right; font-size: 12px; color: #374151; border-bottom: 2px solid #e2e8f0;">Total Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${laborEntries.map(labor => `
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">
                                    <div style="display: flex; align-items: center;">
                                        <div style="width: 8px; height: 8px; background-color: #F59E0B; border-radius: 50%; margin-right: 8px;"></div>
                                        <strong>${labor.category || 'Unknown Category'}</strong>
                                    </div>
                                </td>
                                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">
                                    ${labor.type || 'Unknown Type'}
                                </td>
                                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">
                                    ${labor.count || 0}
                                </td>
                                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right;">
                                    ${this.formatCurrency(Number(labor.perLaborCost) || 0)}
                                </td>
                                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold;">
                                    ${this.formatCurrency(Number(labor.totalCost) || 0)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #fef3c7; font-weight: bold;">
                            <td style="padding: 10px; border-top: 2px solid #e2e8f0;" colspan="4">
                                Day Labor Total
                            </td>
                            <td style="padding: 10px; text-align: right; border-top: 2px solid #e2e8f0; color: #F59E0B;">
                                ${this.formatCurrency(totalLaborCost)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    // ✅ NEW: Generate equipment entry HTML
    private generateEquipmentHTML(equipmentEntries: any[]): string {
        if (!equipmentEntries || equipmentEntries.length === 0) return '';

        const totalEquipmentCost = equipmentEntries.reduce((sum, equipment) => sum + (Number(equipment.totalCost) || 0), 0);

        return `
            <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #fef3c7; padding: 12px; border-bottom: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="background-color: #F59E0B; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                                🚜 EQUIPMENT COSTS
                            </span>
                            <span style="margin-left: 10px; font-weight: 600; color: #374151;">
                                ${equipmentEntries.length} ${equipmentEntries.length === 1 ? 'entry' : 'entries'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f8fafc;">
                            <th style="padding: 10px; text-align: left; font-size: 12px; color: #374151; border-bottom: 2px solid #e2e8f0;">Equipment Type</th>
                            <th style="padding: 10px; text-align: left; font-size: 12px; color: #374151; border-bottom: 2px solid #e2e8f0;">Category</th>
                            <th style="padding: 10px; text-align: center; font-size: 12px; color: #374151; border-bottom: 2px solid #e2e8f0;">Quantity</th>
                            <th style="padding: 10px; text-align: center; font-size: 12px; color: #374151; border-bottom: 2px solid #e2e8f0;">Cost Type</th>
                            <th style="padding: 10px; text-align: right; font-size: 12px; color: #374151; border-bottom: 2px solid #e2e8f0;">Per Unit</th>
                            <th style="padding: 10px; text-align: right; font-size: 12px; color: #374151; border-bottom: 2px solid #e2e8f0;">Total Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${equipmentEntries.map(equipment => `
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">
                                    <div style="display: flex; align-items: center;">
                                        <div style="width: 8px; height: 8px; background-color: #F59E0B; border-radius: 50%; margin-right: 8px;"></div>
                                        <strong>${equipment.type || 'Unknown Equipment'}</strong>
                                    </div>
                                </td>
                                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">
                                    ${equipment.category || 'Unknown Category'}
                                </td>
                                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">
                                    ${equipment.quantity || 0}
                                </td>
                                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">
                                    <span style="background-color: ${equipment.costType === 'rental' ? '#EFF6FF' : equipment.costType === 'purchase' ? '#F0FDF4' : '#FEF3C7'}; 
                                                 color: ${equipment.costType === 'rental' ? '#3B82F6' : equipment.costType === 'purchase' ? '#10B981' : '#F59E0B'}; 
                                                 padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                                        ${(equipment.costType || 'rental').toUpperCase()}
                                    </span>
                                </td>
                                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right;">
                                    ${this.formatCurrency(Number(equipment.perUnitCost) || 0)}
                                </td>
                                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold;">
                                    ${this.formatCurrency(Number(equipment.totalCost) || 0)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #fef3c7; font-weight: bold;">
                            <td style="padding: 10px; border-top: 2px solid #e2e8f0;" colspan="5">
                                Day Equipment Total
                            </td>
                            <td style="padding: 10px; text-align: right; border-top: 2px solid #e2e8f0; color: #F59E0B;">
                                ${this.formatCurrency(totalEquipmentCost)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    // Format date for display
    private formatDate(dateString: string): string {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Format currency
    private formatCurrency(amount: number): string {
        return `₹${amount.toLocaleString('en-IN')}`;
    }

    // Generate material activity row HTML
    private generateMaterialActivityHTML(activity: MaterialActivity): string {
        // ✅ FIXED: Calculate activity total correctly based on activity type
        // For imported materials: include in cost calculation
        // For used materials: show cost for reference but don't include in totals
        const activityTotal = activity.materials.reduce((sum, material) => {
            // ✅ UPDATED: Use totalCost if available, otherwise calculate from perUnitCost
            if (material.totalCost !== undefined) {
                return sum + Number(material.totalCost);
            } else if (material.perUnitCost !== undefined) {
                return sum + (Number(material.perUnitCost) * Number(material.qnt));
            } else if (material.cost !== undefined) {
                // ✅ LEGACY: Fallback to old cost field for backward compatibility
                const costValue = Number(material.cost) || 0;
                const quantity = Number(material.qnt) || 0;
                
                if (activity.activity === 'imported') {
                    // For IMPORTED: cost field contains per-unit cost, multiply by quantity
                    return sum + (costValue * quantity);
                } else {
                    // For USED: cost field contains total cost, use as-is
                    return sum + costValue;
                }
            }
            return sum;
        }, 0);
        
        const isImported = activity.activity === 'imported';
        const isUsed = activity.activity === 'used';
        const isTransferred = activity.activity === 'transferred';
        
        // ✅ ENHANCED: Create location path for better visibility
        const createLocationPath = () => {
            const parts = [];
            if (activity.projectName) parts.push(activity.projectName);
            if (activity.sectionName) parts.push(activity.sectionName);
            if (activity.miniSectionName) parts.push(activity.miniSectionName);
            return parts.length > 1 ? parts.join(' → ') : (parts[0] || 'Unknown Location');
        };
        
        const locationPath = createLocationPath();
        const hasLocationDetails = activity.sectionName || activity.miniSectionName;
        
        // ✅ SIMPLIFIED: Trust the API data first, minimal fallback logic
        const getLocationDisplayName = () => {
            // Priority 1: Use mini-section name from API (already validated and fetched from DB)
            if (activity.miniSectionName && 
                activity.miniSectionName.trim() !== '' &&
                activity.miniSectionName !== 'Mini-section' && 
                activity.miniSectionName !== 'mini-section' &&
                activity.miniSectionName !== 'undefined' &&
                activity.miniSectionName !== 'null' &&
                !activity.miniSectionName.toLowerCase().includes('unknown')) {
                return activity.miniSectionName;
            }
            
            // Priority 2: Use section name from API if mini-section not available
            if (activity.sectionName && 
                activity.sectionName.trim() !== '' &&
                activity.sectionName !== 'Unknown Section' &&
                activity.sectionName !== 'Section' &&
                activity.sectionName !== 'undefined' &&
                activity.sectionName !== 'null' &&
                !activity.sectionName.toLowerCase().includes('unknown')) {
                return activity.sectionName;
            }
            
            // Priority 3: Fallback to generic name
            return 'Construction Area';
        };
        
        const displayLocationName = getLocationDisplayName();
        
        const materialsHTML = activity.materials.map(material => {
            let perUnitCost = 0;
            let materialTotalCost = 0;
            
            // ✅ UPDATED: Use new cost structure with fallback to legacy
            if (material.perUnitCost !== undefined && material.totalCost !== undefined) {
                // New structure: use perUnitCost and totalCost directly
                perUnitCost = Number(material.perUnitCost);
                materialTotalCost = Number(material.totalCost);
            } else if (material.perUnitCost !== undefined) {
                // Only perUnitCost available: calculate totalCost
                perUnitCost = Number(material.perUnitCost);
                materialTotalCost = perUnitCost * Number(material.qnt);
            } else if (material.totalCost !== undefined) {
                // Only totalCost available: calculate perUnitCost
                materialTotalCost = Number(material.totalCost);
                const quantity = Number(material.qnt) || 1;
                perUnitCost = materialTotalCost / quantity;
            } else if (material.cost !== undefined) {
                // ✅ LEGACY: Fallback to old cost field logic
                const costValue = Number(material.cost) || 0;
                const quantity = Number(material.qnt) || 1;
                
                if (activity.activity === 'imported') {
                    // For IMPORTED: cost field contains per-unit cost
                    perUnitCost = costValue;
                    materialTotalCost = costValue * quantity;
                } else {
                    // For USED: cost field contains total cost, calculate per-unit
                    materialTotalCost = costValue;
                    perUnitCost = quantity > 0 ? costValue / quantity : 0;
                }
            }
            
            return `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">
                    <div style="display: flex; align-items: center;">
                        <div style="width: 8px; height: 8px; background-color: ${isImported ? '#10B981' : '#EF4444'}; border-radius: 50%; margin-right: 8px;"></div>
                        <strong>${material.name}</strong>
                    </div>
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">
                    ${material.qnt} ${material.unit}
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right;">
                    ${this.formatCurrency(perUnitCost)}
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold;">
                    ${this.formatCurrency(materialTotalCost)}
                </td>
            </tr>
        `}).join('');

        return `
            <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: ${isImported ? '#f0fdf4' : isUsed ? '#fef2f2' : '#eff6ff'}; padding: 12px; border-bottom: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <div style="margin-bottom: 8px;">
                                <span style="background-color: ${isImported ? '#10B981' : isUsed ? '#EF4444' : '#3B82F6'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                                    ${isImported ? 'IMPORTED' : isUsed ? 'USED' : 'TRANSFERRED'}
                                </span>
                                <span style="margin-left: 10px; font-weight: 600; color: #374151;">
                                    ${activity.user.fullName}
                                </span>
                            </div>
                            
                            ${isUsed && hasLocationDetails ? `
                                <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 6px; padding: 8px; margin-top: 8px;">
                                    <div style="display: flex; align-items: center; margin-bottom: 4px;">
                                        <div style="width: 16px; height: 16px; background-color: #EF4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 6px;">
                                            <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
                                        </div>
                                        <span style="font-size: 12px; font-weight: 600; color: #DC2626;">MATERIAL USAGE LOCATION</span>
                                    </div>
                                    <div style="font-size: 13px; color: #374151; font-weight: 600; margin-left: 22px;">
                                        📍 Used in: ${displayLocationName}
                                    </div>
                                </div>
                            ` : ''}
                            
                        </div>
                        
                        <div style="text-align: right; flex-shrink: 0; margin-left: 12px;">
                            <div style="font-size: 12px; color: #6b7280; font-weight: 500;">
                                ${activity.projectName || 'Unknown Project'}
                            </div>
                            ${activity.sectionName ? `<div style="font-size: 11px; color: #9ca3af;">${activity.sectionName}</div>` : ''}
                            ${activity.miniSectionName ? `<div style="font-size: 11px; color: #9ca3af;">${activity.miniSectionName}</div>` : ''}
                        </div>
                    </div>
                    
                    ${activity.message ? `<div style="margin-top: 8px; font-size: 13px; color: #6b7280; font-style: italic;">"${activity.message}"</div>` : ''}
                    
                    ${isTransferred && activity.transferDetails ? `
                        <div style="margin-top: 8px; padding: 8px; background-color: rgba(59, 130, 246, 0.1); border-radius: 6px; border-left: 3px solid #3B82F6;">
                            <div style="font-size: 12px; color: #374151; font-weight: 600;">Transfer Details:</div>
                            <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                                From: <strong>${activity.transferDetails.fromProject.name}</strong> → To: <strong>${activity.transferDetails.toProject.name}</strong>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f8fafc;">
                            <th style="padding: 10px; text-align: left; font-size: 12px; color: #374151; border-bottom: 2px solid #e2e8f0;">Material</th>
                            <th style="padding: 10px; text-align: center; font-size: 12px; color: #374151; border-bottom: 2px solid #e2e8f0;">Quantity</th>
                            <th style="padding: 10px; text-align: right; font-size: 12px; color: #374151; border-bottom: 2px solid #e2e8f0;">Per Unit Cost</th>
                            <th style="padding: 10px; text-align: right; font-size: 12px; color: #374151; border-bottom: 2px solid #e2e8f0;">Total Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${materialsHTML}
                    </tbody>
                    ${activityTotal > 0 ? `
                        <tfoot>
                            <tr style="background-color: ${isImported ? '#f0fdf4' : '#fef2f2'}; font-weight: bold;">
                                <td style="padding: 10px; border-top: 2px solid #e2e8f0;" colspan="3">
                                    ${isImported ? 'Activity Total (Added to Project Cost)' : 'Activity Total (Inventory Value Only)'}
                                </td>
                                <td style="padding: 10px; text-align: right; border-top: 2px solid #e2e8f0; color: ${isImported ? '#059669' : '#DC2626'};">
                                    ${this.formatCurrency(activityTotal)}
                                </td>
                            </tr>
                        </tfoot>
                    ` : ''}
                </table>
            </div>
        `;
    }

    // Generate complete HTML for the PDF
    private generateHTML(activities: MaterialActivity[], projectName?: string, laborData?: any[], equipmentData?: any[]): string {
        console.log('🔍 PDF Generator - generateHTML called with:');
        console.log('  - Activities:', activities.length);
        console.log('  - Labor data:', laborData?.length || 0);
        console.log('  - Equipment data:', equipmentData?.length || 0);
        console.log('  - Equipment data sample:', equipmentData?.slice(0, 2));
        
        const groupedActivities = this.groupActivitiesByDate(activities);
        // ✅ NEW: Group labor and equipment by date
        const groupedLabor = this.groupLaborByDate(laborData || []);
        const groupedEquipment = this.groupEquipmentByDate(equipmentData || []);
        
        // ✅ NEW: Get all unique dates from activities, labor, and equipment
        const allDates = new Set([
            ...Object.keys(groupedActivities),
            ...Object.keys(groupedLabor),
            ...Object.keys(groupedEquipment)
        ]);
        const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a)); // Latest first

        // Calculate summary statistics with new cost structure
        const totalActivities = activities.length;
        const importedCount = activities.filter(a => a.activity === 'imported').length;
        const usedCount = activities.filter(a => a.activity === 'used').length;
        const transferredCount = activities.filter(a => a.activity === 'transferred').length;
        // ✅ FIXED: Only include IMPORTED materials in total cost calculation
        // Business Logic: We only spend money when importing materials, not when using them
        // Transferred materials don't add to cost (they're just moved between projects)
        const totalMaterialCost = activities.reduce((sum, activity) => {
            // ✅ CRITICAL: Only count imported materials, skip used and transferred materials
            if (activity.activity !== 'imported') {
                return sum; // Skip used and transferred materials - they don't add to total cost
            }
            
            return sum + activity.materials.reduce((matSum, material) => {
                // Use totalCost if available, otherwise calculate from perUnitCost
                if (material.totalCost !== undefined) {
                    return matSum + Number(material.totalCost);
                } else if (material.perUnitCost !== undefined) {
                    return matSum + (Number(material.perUnitCost) * Number(material.qnt));
                } else if (material.cost !== undefined) {
                    // ✅ LEGACY: For imported materials, cost field contains per-unit cost
                    const costValue = Number(material.cost) || 0;
                    const quantity = Number(material.qnt) || 0;
                    return matSum + (costValue * quantity);
                }
                return matSum;
            }, 0);
        }, 0);

        // Calculate labor costs
        const totalLaborCost = (laborData || []).reduce((sum, labor) => {
            return sum + (Number(labor.totalCost) || 0);
        }, 0);

        // Calculate equipment costs
        const totalEquipmentCost = (equipmentData || []).reduce((sum, equipment) => {
            return sum + (Number(equipment.totalCost) || 0);
        }, 0);

        const totalCost = totalMaterialCost + totalLaborCost + totalEquipmentCost;

        const dateRangeHTML = sortedDates.length > 0 ? `
            <div style="background-color: #f0f9ff; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
                <strong>Report Period:</strong> ${this.formatDate(sortedDates[sortedDates.length - 1])} to ${this.formatDate(sortedDates[0])}
            </div>
        ` : '';

        const summaryHTML = `
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 12px 0; color: #374151;">Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${totalActivities}</div>
                        <div style="font-size: 12px; color: #6b7280;">Total Activities</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #059669;">${this.formatCurrency(totalCost)}</div>
                        <div style="font-size: 12px; color: #6b7280;">Total Project Cost</div>
                    </div>
                    <div>
                        <div style="font-size: 20px; font-weight: bold; color: #10b981;">${this.formatCurrency(totalMaterialCost)}</div>
                        <div style="font-size: 12px; color: #6b7280;">Materials Cost</div>
                    </div>
                    <div>
                        <div style="font-size: 20px; font-weight: bold; color: #f59e0b;">${this.formatCurrency(totalLaborCost)}</div>
                        <div style="font-size: 12px; color: #6b7280;">Labor Cost</div>
                    </div>
                </div>
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                        <div>
                            <div style="font-size: 18px; font-weight: bold; color: #10b981;">${importedCount}</div>
                            <div style="font-size: 12px; color: #6b7280;">Materials Imported</div>
                        </div>
                        <div>
                            <div style="font-size: 18px; font-weight: bold; color: #ef4444;">${usedCount}</div>
                            <div style="font-size: 12px; color: #6b7280;">Materials Used</div>
                        </div>
                        <div>
                            <div style="font-size: 18px; font-weight: bold; color: #3b82f6;">${transferredCount}</div>
                            <div style="font-size: 12px; color: #6b7280;">Materials Transferred</div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 12px;">
                        <div>
                            <div style="font-size: 18px; font-weight: bold; color: #8b5cf6;">${(laborData || []).length}</div>
                            <div style="font-size: 12px; color: #6b7280;">Labor Entries</div>
                        </div>
                        <div>
                            <div style="font-size: 18px; font-weight: bold; color: #f59e0b;">${(equipmentData || []).length}</div>
                            <div style="font-size: 12px; color: #6b7280;">Equipment Entries</div>
                        </div>
                        <div>
                            <div style="font-size: 18px; font-weight: bold; color: #059669;">${this.formatCurrency(totalEquipmentCost)}</div>
                            <div style="font-size: 12px; color: #6b7280;">Equipment Cost</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // ✅ UPDATED: Generate daily sections with materials, labor, and equipment integrated
        const activitiesHTML = sortedDates.map(date => {
            const dayActivities = groupedActivities[date] || [];
            const dayLabor = groupedLabor[date] || [];
            const dayEquipment = groupedEquipment[date] || [];
            
            // Calculate day totals for all cost types
            const dayMaterialTotal = dayActivities.reduce((sum, activity) => {
                // Only count imported materials in daily totals
                if (activity.activity !== 'imported') {
                    return sum;
                }
                
                return sum + activity.materials.reduce((matSum, material) => {
                    if (material.totalCost !== undefined) {
                        return matSum + Number(material.totalCost);
                    } else if (material.perUnitCost !== undefined) {
                        return matSum + (Number(material.perUnitCost) * Number(material.qnt));
                    } else if (material.cost !== undefined) {
                        const costValue = Number(material.cost) || 0;
                        const quantity = Number(material.qnt) || 0;
                        return matSum + (costValue * quantity);
                    }
                    return matSum;
                }, 0);
            }, 0);

            const dayLaborTotal = dayLabor.reduce((sum, labor) => sum + (Number(labor.totalCost) || 0), 0);
            const dayEquipmentTotal = dayEquipment.reduce((sum, equipment) => sum + (Number(equipment.totalCost) || 0), 0);
            const dayTotal = dayMaterialTotal + dayLaborTotal + dayEquipmentTotal;

            const totalEntries = dayActivities.length + dayLabor.length + dayEquipment.length;

            return `
                <div style="page-break-inside: avoid; margin-bottom: 32px;">
                    <div style="background-color: #1e293b; color: white; padding: 16px; border-radius: 8px 8px 0 0; margin-bottom: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h2 style="margin: 0; font-size: 18px;">${this.formatDate(date)}</h2>
                            <div style="text-align: right;">
                                <div style="font-size: 14px; opacity: 0.9;">
                                    ${totalEntries} ${totalEntries === 1 ? 'entry' : 'entries'} 
                                    ${dayActivities.length > 0 ? `(${dayActivities.length} material` : ''}${dayActivities.length > 0 && (dayLabor.length > 0 || dayEquipment.length > 0) ? ', ' : ''}${dayLabor.length > 0 ? `${dayLabor.length} labor` : ''}${dayLabor.length > 0 && dayEquipment.length > 0 ? ', ' : ''}${dayEquipment.length > 0 ? `${dayEquipment.length} equipment` : ''}${dayActivities.length > 0 ? ')' : ''}
                                </div>
                                ${dayTotal > 0 ? `<div style="font-size: 16px; font-weight: bold;">${this.formatCurrency(dayTotal)}</div>` : ''}
                            </div>
                        </div>
                    </div>
                    <div style="border: 1px solid #e2e8f0; border-top: none; padding: 16px; border-radius: 0 0 8px 8px;">
                        ${dayActivities.length > 0 ? `
                            <div style="margin-bottom: ${dayLabor.length > 0 || dayEquipment.length > 0 ? '24px' : '0'};">
                                <h3 style="color: #374151; font-size: 14px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
                                    📦 Material Activities (${dayActivities.length})
                                </h3>
                                ${dayActivities.map(activity => this.generateMaterialActivityHTML(activity)).join('')}
                            </div>
                        ` : ''}
                        
                        ${dayLabor.length > 0 ? `
                            <div style="margin-bottom: ${dayEquipment.length > 0 ? '24px' : '0'};">
                                <h3 style="color: #374151; font-size: 14px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
                                    👷 Labor Costs (${dayLabor.length})
                                </h3>
                                ${this.generateLaborHTML(dayLabor)}
                            </div>
                        ` : ''}
                        
                        ${dayEquipment.length > 0 ? `
                            <div>
                                <h3 style="color: #374151; font-size: 14px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
                                    🚜 Equipment Costs (${dayEquipment.length})
                                </h3>
                                ${this.generateEquipmentHTML(dayEquipment)}
                            </div>
                        ` : ''}
                        
                        ${dayTotal > 0 ? `
                            <div style="margin-top: 16px; padding: 12px; background-color: #f0f9ff; border-radius: 6px; border-left: 4px solid #3B82F6;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-size: 14px; font-weight: 600; color: #374151;">Day Total</div>
                                        <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                                            ${dayMaterialTotal > 0 ? `Materials: ${this.formatCurrency(dayMaterialTotal)}` : ''}${dayMaterialTotal > 0 && (dayLaborTotal > 0 || dayEquipmentTotal > 0) ? ' • ' : ''}${dayLaborTotal > 0 ? `Labor: ${this.formatCurrency(dayLaborTotal)}` : ''}${dayLaborTotal > 0 && dayEquipmentTotal > 0 ? ' • ' : ''}${dayEquipmentTotal > 0 ? `Equipment: ${this.formatCurrency(dayEquipmentTotal)}` : ''}
                                        </div>
                                    </div>
                                    <div style="font-size: 20px; font-weight: bold; color: #3B82F6;">
                                        ${this.formatCurrency(dayTotal)}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${projectName ? `${projectName} - Complete Cost Report` : 'Complete Project Cost Report'}</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.4;
                        color: #374151;
                        margin: 0;
                        padding: 20px;
                        background-color: #ffffff;
                    }
                    .header {
                        margin-bottom: 32px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #e2e8f0;
                    }
                    .company-info {
                        background-color: #f8fafc;
                        padding: 16px;
                        border-radius: 8px;
                        margin-bottom: 24px;
                        border: 1px solid #e2e8f0;
                    }
                    @media print {
                        body { margin: 0; }
                        .page-break { page-break-before: always; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                        <div style="flex: 0 0 auto;">
                            <!-- Client Logo -->
                            <!-- TODO: Replace with actual client logo image when available -->
                            <!-- <img src="data:image/png;base64,..." style="width: 80px; height: 80px; border-radius: 12px; object-fit: cover;" alt="Company Logo" /> -->
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #3B82F6, #1E40AF); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; text-align: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                                ${this.clientData.companyName ? this.clientData.companyName.substring(0, 2).toUpperCase() : 'CM'}
                            </div>
                        </div>
                        <div style="flex: 1; text-align: center; margin: 0 20px;">
                            <h1 style="margin: 0 0 8px 0; color: #1e293b; font-size: 32px; font-weight: 800;">${projectName || 'Project Cost Report'}</h1>
                            <div style="background: linear-gradient(90deg, #3B82F6, #1E40AF); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 16px; font-weight: 600; margin-bottom: 8px;">
                                Material, Labor & Equipment Report
                            </div>
                            <p style="margin: 0; color: #6b7280; font-size: 13px;">Generated on ${new Date().toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</p>
                        </div>
                        <div style="flex: 0 0 auto; width: 80px; text-align: right;">
                            <!-- Company Info Badge -->
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; font-size: 10px; color: #6b7280; text-align: center;">
                                <div style="font-weight: 600; color: #374151;">REPORT</div>
                                <div>ID: ${Date.now().toString().slice(-6)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="company-info">
                    <h3 style="margin: 0 0 12px 0; color: #374151;">Company Information</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                        <div>
                            <strong>Company:</strong> ${this.clientData.companyName || this.userData.company || 'N/A'}
                        </div>
                        <div>
                            <strong>Contact:</strong> ${this.clientData.email || this.userData.email || 'N/A'}
                        </div>
                        <div>
                            <strong>Phone:</strong> ${this.clientData.phone || this.userData.phone || 'N/A'}
                        </div>
                        <div>
                            <strong>Generated by:</strong> ${this.userData.name || 'N/A'}
                        </div>
                    </div>
                </div>

                ${dateRangeHTML}
                ${summaryHTML}

                ${sortedDates.length > 0 ? `
                    <h2 style="color: #1e293b; margin-bottom: 20px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
                        Daily Activity Details
                    </h2>
                    ${activitiesHTML}
                ` : `
                    <div style="text-align: center; padding: 40px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <h3 style="color: #6b7280; margin-bottom: 8px;">No Data Found</h3>
                        <p style="color: #9ca3af; margin: 0;">No material activities, labor entries, or equipment entries were recorded during the selected period.</p>
                    </div>
                `}

                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #9ca3af; font-size: 12px;">
                    <p>This complete cost report was automatically generated by Xsite Application</p>
                    <p>Project: ${projectName || 'N/A'} | Report ID: ${Date.now()}</p>
                </div>
            </body>
            </html>
        `;
    }

    // Generate and download PDF
    async generatePDF(activities: MaterialActivity[], projectName?: string, laborData?: any[], equipmentData?: any[]): Promise<void> {
        try {
            console.log('📄 Starting PDF generation...');
            console.log('📊 Activities to include:', activities.length);
            console.log('📊 Labor entries to include:', laborData?.length || 0);
            console.log('📊 Equipment entries to include:', equipmentData?.length || 0);
            console.log('📊 Project name:', projectName);

            // Generate HTML content
            const htmlContent = this.generateHTML(activities, projectName, laborData, equipmentData);
            console.log('📄 HTML content generated, length:', htmlContent.length);
            
            // Create custom filename: Company Name - Project Name - Date
            const companyName = this.clientData?.companyName || this.userData?.company || 'Company';
            const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const sanitizedCompanyName = companyName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
            const sanitizedProjectName = (projectName || 'Project').replace(/[^a-zA-Z0-9\s]/g, '').trim();
            
            const customFilename = `${sanitizedCompanyName} - ${sanitizedProjectName} - Complete Report - ${currentDate}.pdf`;
            console.log('📄 Custom filename components:');
            console.log('  - Company Name (raw):', companyName);
            console.log('  - Company Name (sanitized):', sanitizedCompanyName);
            console.log('  - Project Name (raw):', projectName);
            console.log('  - Project Name (sanitized):', sanitizedProjectName);
            console.log('  - Current Date:', currentDate);
            console.log('📄 Final custom filename:', customFilename);
            
            // Generate PDF
            console.log('📄 Calling Print.printToFileAsync...');
            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                base64: false,
                margins: {
                    left: 20,
                    top: 20,
                    right: 20,
                    bottom: 20,
                },
            });

            console.log('✅ PDF generated successfully at:', uri);
            console.log('📄 Original filename from Print API:', uri.split('/').pop());
            console.log('📄 Desired custom filename:', customFilename);

            // Copy PDF to a new location with custom filename
            let finalUri = uri; // Default to original URI
            let actualFilename = customFilename; // Track the actual filename being used
            
            try {
                const documentDir = Paths.document;
                if (documentDir) {
                    const customFile = new File(documentDir, customFilename);
                    const customUri = customFile.uri;
                    console.log('📄 Attempting to copy PDF to custom location:', customUri);
                    
                    // Delete existing file if it exists
                    if (customFile.exists) {
                        customFile.delete();
                        console.log('📄 Deleted existing file at custom location');
                    }
                    
                    // Copy the original file to the new location
                    const originalFile = new File(uri);
                    originalFile.copy(customFile);
                    
                    // Verify the file was copied successfully
                    if (customFile.exists) {
                        finalUri = customUri;
                        console.log('✅ PDF successfully copied with custom filename to:', customUri);
                        const fileInfo = customFile.info();
                        console.log('📄 File size:', fileInfo.size, 'bytes');
                        
                        // Delete the original temporary file to avoid confusion
                        try {
                            originalFile.delete();
                            console.log('📄 Deleted original temporary file');
                        } catch (deleteError) {
                            console.warn('⚠️ Could not delete original temp file:', deleteError);
                        }
                    } else {
                        console.warn('⚠️ Custom file not found after copy, using original');
                        actualFilename = 'Complete_Project_Report.pdf'; // Fallback name
                    }
                } else {
                    console.warn('⚠️ Document directory not available, using original URI');
                    actualFilename = 'Complete_Project_Report.pdf'; // Fallback name
                }
            } catch (copyError) {
                console.error('❌ Could not copy PDF with custom name:', copyError);
                console.error('❌ Copy error details:', JSON.stringify(copyError, null, 2));
                actualFilename = 'Complete_Project_Report.pdf'; // Fallback name
                // Continue with original URI if copy fails
            }
            
            console.log('📄 Final PDF URI for sharing:', finalUri);

            // Show options to View or Share the PDF
            console.log('📄 Showing view/share options...');
            console.log('📄 Final URI being used:', finalUri);
            console.log('📄 Actual filename being used:', actualFilename);
            
            setTimeout(() => {
                Alert.alert(
                    'PDF Generated Successfully',
                    `Your material, labor & equipment report has been generated.\n\nFilename: ${actualFilename}\n\nWhat would you like to do?`,
                    [
                        {
                            text: 'View PDF',
                            onPress: async () => {
                                try {
                                    console.log('📖 User selected View PDF');
                                    console.log('📖 PDF URI:', finalUri);
                                    
                                    if (Platform.OS === 'android') {
                                        // On Android, use IntentLauncher to open PDF directly in a PDF viewer
                                        console.log('📖 Opening PDF with IntentLauncher on Android...');
                                        
                                        try {
                                            // Use the legacy API for getContentUriAsync
                                            const contentUri = await FileSystemLegacy.getContentUriAsync(finalUri);
                                            console.log('📖 Content URI:', contentUri);
                                            
                                            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                                                data: contentUri,
                                                flags: 1,
                                                type: 'application/pdf',
                                            });
                                            console.log('📖 PDF opened successfully on Android');
                                        } catch (contentUriError) {
                                            console.warn('⚠️ Could not get content URI, trying direct URI:', contentUriError);
                                            // Fallback: try with direct URI
                                            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                                                data: finalUri,
                                                flags: 1,
                                                type: 'application/pdf',
                                            });
                                            console.log('📖 PDF opened successfully on Android with direct URI');
                                        }
                                    } else {
                                        // On iOS, use sharing (this is the only way to view PDFs in iOS)
                                        console.log('📖 Opening PDF with Sharing on iOS...');
                                        if (await Sharing.isAvailableAsync()) {
                                            await Sharing.shareAsync(finalUri, {
                                                mimeType: 'application/pdf',
                                                dialogTitle: `View: ${actualFilename}`,
                                                UTI: 'com.adobe.pdf'
                                            });
                                            console.log('📖 PDF opened successfully on iOS');
                                        } else {
                                            Alert.alert(
                                                'PDF Ready',
                                                `PDF has been generated successfully: ${actualFilename}`,
                                                [{ text: 'OK' }]
                                            );
                                        }
                                    }
                                } catch (error) {
                                    console.error('❌ Error viewing PDF:', error);
                                    // Fallback to sharing if IntentLauncher fails
                                    try {
                                        console.log('📖 Fallback: trying sharing approach...');
                                        if (await Sharing.isAvailableAsync()) {
                                            await Sharing.shareAsync(finalUri, {
                                                mimeType: 'application/pdf',
                                                dialogTitle: `View: ${actualFilename}`,
                                                UTI: 'com.adobe.pdf'
                                            });
                                        } else {
                                            Alert.alert('Error', 'Could not open PDF for viewing. Error: ' + error);
                                        }
                                    } catch (fallbackError) {
                                        Alert.alert('Error', 'Could not open PDF for viewing. Error: ' + error);
                                    }
                                }
                            }
                        },
                        {
                            text: 'Share PDF',
                            onPress: async () => {
                                try {
                                    console.log('📤 User selected Share PDF');
                                    console.log('📤 PDF URI:', finalUri);
                                    console.log('📤 PDF filename:', actualFilename);
                                    
                                    // Share the PDF with custom filename
                                    if (await Sharing.isAvailableAsync()) {
                                        console.log('📤 Sharing PDF...');
                                        console.log('📤 Final URI being shared:', finalUri);
                                        console.log('📤 Expected filename:', actualFilename);
                                        
                                        await Sharing.shareAsync(finalUri, {
                                            mimeType: 'application/pdf',
                                            dialogTitle: `Share: ${actualFilename}`,
                                            UTI: 'com.adobe.pdf'
                                        });
                                        console.log('✅ PDF shared successfully');
                                    } else {
                                        console.log('📤 Sharing not available');
                                        Alert.alert(
                                            'Sharing Not Available',
                                            `Sharing is not available on this device. PDF generated as: ${actualFilename}`,
                                            [{ text: 'OK' }]
                                        );
                                    }
                                } catch (error) {
                                    console.error('❌ Error sharing PDF:', error);
                                    Alert.alert('Error', 'Could not share PDF. Error: ' + error);
                                }
                            }
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => {
                                console.log('📄 User cancelled PDF action');
                            }
                        }
                    ],
                    { cancelable: true }
                );
            }, 100); // Small delay to ensure UI is ready

        } catch (error) {
            console.error('❌ PDF generation error:', error);
            console.error('❌ Error details:', JSON.stringify(error, null, 2));
            Alert.alert(
                'Error',
                'Failed to generate PDF report. Please try again. Error: ' + (error instanceof Error ? error.message : String(error)),
                [{ text: 'OK' }]
            );
        }
    }
}