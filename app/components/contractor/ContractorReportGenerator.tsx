import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import apiClient from '@/utils/axiosConfig';
import { getClientId } from '@/functions/clientId';

interface ContractorReportGeneratorProps {
    visible: boolean;
    onClose: () => void;
    contractorData: any;
    projectId: string;
    projectName: string;
}

interface LaborEntry {
    _id: string;
    type: string;
    category: string;
    count: number;
    perLaborCost: number;
    totalCost: number;
    addedAt: string;
}

interface WorkLogActivity {
    _id: string;
    type: 'material' | 'completion';
    title: string;
    description: string;
    timestamp: Date;
    user: {
        userId: string;
        fullName: string;
    };
    projectId?: string;
    projectName?: string;
    sectionId?: string;
    sectionName?: string;
    miniSectionId?: string;
    miniSectionName?: string;
    category: string;
    action: string;
    data?: any;
}

const ContractorReportGenerator: React.FC<ContractorReportGeneratorProps> = ({
    visible,
    onClose,
    contractorData,
    projectId,
    projectName,
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [laborEntries, setLaborEntries] = useState<LaborEntry[]>([]);
    const [workLogActivities, setWorkLogActivities] = useState<WorkLogActivity[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    // Fetch contractor labor data when modal opens
    React.useEffect(() => {
        if (visible && contractorData) {
            fetchContractorData();
        }
    }, [visible, contractorData]);

    const fetchContractorData = async () => {
        if (!contractorData) return;
        
        try {
            setLoadingData(true);
            const staffId = contractorData.staffId?._id || contractorData.staffId;
            const clientId = await getClientId();
            
            // Fetch labor entries and work log activities in parallel
            const [laborResponse, materialActivitiesResponse, completionActivitiesResponse] = await Promise.allSettled([
                // Fetch labor entries
                apiClient.get('/api/labor', {
                    params: {
                        projectId: projectId,
                        addedBy: staffId
                    }
                }),
                // Fetch material activities
                apiClient.get(`/api/(Xsite)/materialActivity`, {
                    params: {
                        projectId: projectId,
                        clientId: clientId
                    }
                }),
                // Fetch completion activities
                apiClient.get('/api/activity', {
                    params: {
                        projectId: projectId,
                        clientId: clientId
                    }
                })
            ]);
            
            // Process labor entries
            if (laborResponse.status === 'fulfilled') {
                const result = laborResponse.value.data;
                if (result.success && result.data) {
                    setLaborEntries(result.data.laborEntries || []);
                } else {
                    setLaborEntries([]);
                }
            } else {
                console.error('Failed to fetch labor entries:', laborResponse.reason);
                setLaborEntries([]);
            }
            
            // Process work log activities
            const workLogs: WorkLogActivity[] = [];
            
            // Process material activities
            if (materialActivitiesResponse.status === 'fulfilled') {
                const materialData = materialActivitiesResponse.value.data;
                if (materialData.success && materialData.data?.activities) {
                    materialData.data.activities.forEach((activity: any) => {
                        // Check if this activity was performed by the contractor
                        if (activity.user?.userId === staffId) {
                            workLogs.push({
                                _id: activity._id,
                                type: 'material',
                                title: getMaterialActivityTitle(activity),
                                description: getMaterialActivityDescription(activity),
                                timestamp: new Date(activity.date || activity.createdAt),
                                user: activity.user,
                                projectId: activity.projectId,
                                projectName: activity.projectName,
                                sectionId: activity.sectionId,
                                sectionName: activity.sectionName,
                                miniSectionId: activity.miniSectionId,
                                miniSectionName: activity.miniSectionName,
                                category: 'material',
                                action: activity.activity,
                                data: {
                                    materials: activity.materials,
                                    materialCount: activity.materials?.length || 0,
                                    totalCost: activity.materials?.reduce((sum: number, m: any) => sum + (m.totalCost || m.cost || 0), 0) || 0
                                }
                            });
                        }
                    });
                }
            }
            
            // Process completion activities
            if (completionActivitiesResponse.status === 'fulfilled') {
                const completionData = completionActivitiesResponse.value.data;
                if (completionData.success && completionData.data?.activities) {
                    completionData.data.activities.forEach((activity: any) => {
                        // Check if this activity was performed by the contractor
                        if (activity.user?.userId === staffId && 
                            (activity.category === 'section' || activity.category === 'mini_section' || activity.category === 'completion')) {
                            workLogs.push({
                                _id: activity._id,
                                type: 'completion',
                                title: getCompletionActivityTitle(activity),
                                description: activity.description,
                                timestamp: new Date(activity.date || activity.createdAt),
                                user: activity.user,
                                projectId: activity.projectId,
                                projectName: activity.projectName,
                                sectionId: activity.sectionId,
                                sectionName: activity.sectionName,
                                miniSectionId: activity.miniSectionId,
                                miniSectionName: activity.miniSectionName,
                                category: activity.category,
                                action: activity.action,
                                data: {
                                    activityType: activity.activityType,
                                    metadata: activity.metadata
                                }
                            });
                        }
                    });
                }
            }
            
            // Sort work logs by timestamp (newest first)
            workLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            setWorkLogActivities(workLogs);
            
        } catch (err) {
            console.error('Failed to fetch contractor data:', err);
            setLaborEntries([]);
            setWorkLogActivities([]);
        } finally {
            setLoadingData(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const formatDateForPDF = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-IN', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const getContractorName = () => {
        return contractorData?.staffId
            ? `${contractorData.staffId.firstName} ${contractorData.staffId.lastName}`
            : 'Unknown Contractor';
    };

    // Helper functions for work log activities
    const getMaterialActivityTitle = (activity: any): string => {
        const materialCount = activity.materials?.length || 0;
        const materialText = materialCount === 1 ? 'material' : 'materials';
        
        switch (activity.activity) {
            case 'imported':
                return `📦 ${materialCount} ${materialText} imported`;
            case 'used':
                return `🔧 ${materialCount} ${materialText} used`;
            case 'transferred':
                return `↔️ ${materialCount} ${materialText} transferred`;
            default:
                return `📋 Material activity`;
        }
    };

    const getMaterialActivityDescription = (activity: any): string => {
        const materialCount = activity.materials?.length || 0;
        const totalCost = activity.materials?.reduce((sum: number, m: any) => sum + (m.totalCost || m.cost || 0), 0) || 0;
        const costText = totalCost > 0 ? ` (₹${totalCost.toLocaleString()})` : '';
        
        let location = activity.projectName || 'Unknown Project';
        if (activity.sectionName) {
            location += ` → ${activity.sectionName}`;
        }
        if (activity.miniSectionName) {
            location += ` → ${activity.miniSectionName}`;
        }
        
        switch (activity.activity) {
            case 'imported':
                return `Imported ${materialCount} material${materialCount > 1 ? 's' : ''}${costText} to ${location}`;
            case 'used':
                return `Used ${materialCount} material${materialCount > 1 ? 's' : ''}${costText} in ${location}`;
            case 'transferred':
                return `Transferred ${materialCount} material${materialCount > 1 ? 's' : ''}${costText} from ${location}`;
            default:
                return `Performed material activity in ${location}`;
        }
    };

    const getCompletionActivityTitle = (activity: any): string => {
        switch (activity.activityType) {
            case 'section_completed':
                return '✅ Section Completed';
            case 'section_reopened':
                return '🔄 Section Reopened';
            case 'mini_section_completed':
                return '✅ Mini-Section Completed';
            case 'mini_section_reopened':
                return '🔄 Mini-Section Reopened';
            case 'project_completed':
                return '🎉 Project Completed';
            case 'project_reopened':
                return '🔄 Project Reopened';
            default:
                return '📋 Completion Activity';
        }
    };

    const generateHTMLReport = () => {
        const contractorName = getContractorName();
        const totalPaid = contractorData?.totalPaid || 0;
        const totalBudget = contractorData?.totalAmount || 0;
        const totalWorkDone = contractorData?.usedAmount || 0;
        const contractType = contractorData?.contractType || 'Unknown';
        const contractStatus = contractorData?.status || 'active';

        // Group labor entries by date
        const laborByDate = laborEntries.reduce((acc: any, entry) => {
            const date = new Date(entry.addedAt).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(entry);
            return acc;
        }, {});

        // Group payments by date
        const paymentsByDate = (contractorData?.payments || []).reduce((acc: any, payment: any) => {
            const date = new Date(payment.paymentDate).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(payment);
            return acc;
        }, {});

        // Group work log activities by date
        const workLogsByDate = workLogActivities.reduce((acc: any, activity) => {
            const date = activity.timestamp.toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(activity);
            return acc;
        }, {});

        // Get all unique dates and sort them
        const allDates = Array.from(new Set([
            ...Object.keys(laborByDate),
            ...Object.keys(paymentsByDate),
            ...Object.keys(workLogsByDate)
        ])).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        const laborRowsHTML = Object.entries(laborByDate)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, entries]: [string, any]) => {
                const dateTotal = entries.reduce((sum: number, entry: any) => sum + entry.totalCost, 0);
                const entriesHTML = entries.map((entry: any) => `
                    <tr style="background-color: #f8fafc;">
                        <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 12px;">${entry.type}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; font-size: 12px;">${entry.count}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-size: 12px;">${formatCurrency(entry.perLaborCost)}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600; font-size: 12px;">${formatCurrency(entry.totalCost)}</td>
                    </tr>
                `).join('');

                return `
                    <tr style="background-color: #1e293b;">
                        <td colspan="4" style="padding: 12px; color: white; font-weight: 600; font-size: 14px;">
                            📅 ${formatDateForPDF(date)} - Total: ${formatCurrency(dateTotal)}
                        </td>
                    </tr>
                    ${entriesHTML}
                `;
            }).join('');

        const paymentRowsHTML = Object.entries(paymentsByDate)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, payments]: [string, any]) => {
                const dateTotal = payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
                const paymentsHTML = payments.map((payment: any) => `
                    <tr style="background-color: #f0fdf4;">
                        <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 12px;">
                            <span style="background-color: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
                                ${payment.paymentType?.toUpperCase() || 'PAYMENT'}
                            </span>
                        </td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 12px;">${payment.notes || 'Payment recorded'}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #059669; font-size: 12px;">${formatCurrency(payment.amount)}</td>
                    </tr>
                `).join('');

                return `
                    <tr style="background-color: #059669;">
                        <td colspan="3" style="padding: 12px; color: white; font-weight: 600; font-size: 14px;">
                            💰 ${formatDateForPDF(date)} - Total Paid: ${formatCurrency(dateTotal)}
                        </td>
                    </tr>
                    ${paymentsHTML}
                `;
            }).join('');

        const workLogRowsHTML = Object.entries(workLogsByDate)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, activities]: [string, any]) => {
                const activitiesHTML = activities.map((activity: any) => {
                    const activityIcon = activity.type === 'material' ? '📦' : '✅';
                    const activityColor = activity.type === 'material' ? '#3B82F6' : '#10B981';
                    const locationText = activity.sectionName 
                        ? `${activity.sectionName}${activity.miniSectionName ? ` → ${activity.miniSectionName}` : ''}`
                        : 'Project Level';
                    
                    return `
                        <tr style="background-color: #f8fafc;">
                            <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 12px;">
                                <span style="margin-right: 6px;">${activityIcon}</span>
                                ${activity.title}
                            </td>
                            <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 12px;">
                                ${locationText}
                            </td>
                            <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 12px;">
                                ${activity.description}
                            </td>
                            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; font-size: 12px;">
                                <span style="background-color: ${activityColor}20; color: ${activityColor}; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
                                    ${activity.action.toUpperCase()}
                                </span>
                            </td>
                        </tr>
                    `;
                }).join('');

                return `
                    <tr style="background-color: #7C3AED;">
                        <td colspan="4" style="padding: 12px; color: white; font-weight: 600; font-size: 14px;">
                            📋 ${formatDateForPDF(date)} - ${activities.length} Activities
                        </td>
                    </tr>
                    ${activitiesHTML}
                `;
            }).join('');

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Contractor Report - ${contractorName}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #ffffff;
                    color: #1e293b;
                    line-height: 1.4;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                    border-radius: 12px;
                }
                .header h1 {
                    margin: 0 0 8px 0;
                    font-size: 24px;
                    font-weight: 700;
                }
                .header p {
                    margin: 4px 0;
                    font-size: 14px;
                    opacity: 0.9;
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 30px;
                }
                .summary-card {
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 16px;
                    text-align: center;
                }
                .summary-card h3 {
                    margin: 0 0 8px 0;
                    font-size: 12px;
                    color: #64748b;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .summary-card p {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: #1e293b;
                }
                .section {
                    margin-bottom: 30px;
                }
                .section h2 {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 16px 0;
                    padding: 12px 16px;
                    background-color: #f1f5f9;
                    border-left: 4px solid #3b82f6;
                    border-radius: 4px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    background-color: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                th {
                    background-color: #374151;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                td {
                    padding: 10px;
                    border: 1px solid #e2e8f0;
                    font-size: 13px;
                }
                .no-data {
                    text-align: center;
                    padding: 40px;
                    color: #64748b;
                    font-style: italic;
                    background-color: #f8fafc;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .footer {
                    margin-top: 40px;
                    padding: 20px;
                    background-color: #f8fafc;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 12px;
                    color: #64748b;
                }
                .status-badge {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                    ${contractStatus === 'completed' 
                        ? 'background-color: #dcfce7; color: #166534;' 
                        : 'background-color: #fef3c7; color: #92400e;'
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📋 Contractor Report</h1>
                <p><strong>${contractorName}</strong></p>
                <p>Project: ${projectName}</p>
                <p>Contract Type: ${contractType} • Status: <span class="status-badge">${contractStatus}</span></p>
                <p>Generated on: ${new Date().toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
            </div>

            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Total Budget</h3>
                    <p>${formatCurrency(totalBudget)}</p>
                </div>
                <div class="summary-card">
                    <h3>Work Done Value</h3>
                    <p>${formatCurrency(totalWorkDone)}</p>
                </div>
                <div class="summary-card">
                    <h3>Total Paid</h3>
                    <p style="color: #059669;">${formatCurrency(totalPaid)}</p>
                </div>
                <div class="summary-card">
                    <h3>Outstanding</h3>
                    <p style="color: ${totalWorkDone - totalPaid > 0 ? '#dc2626' : '#059669'};">
                        ${formatCurrency(Math.max(0, totalWorkDone - totalPaid))}
                    </p>
                </div>
            </div>

            <div class="section">
                <h2>🔨 Work Logs (Day-wise)</h2>
                ${laborEntries.length > 0 ? `
                    <table>
                        <thead>
                            <tr>
                                <th>Worker Type</th>
                                <th style="text-align: center;">Count</th>
                                <th style="text-align: right;">Rate per Worker</th>
                                <th style="text-align: right;">Total Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${laborRowsHTML}
                        </tbody>
                    </table>
                ` : `
                    <div class="no-data">
                        <p>No work logs recorded for this contractor.</p>
                    </div>
                `}
            </div>

            <div class="section">
                <h2>📋 Activity Logs (Labor & Mistri Work)</h2>
                ${workLogActivities.length > 0 ? `
                    <table>
                        <thead>
                            <tr>
                                <th>Activity</th>
                                <th>Location</th>
                                <th>Description</th>
                                <th style="text-align: center;">Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${workLogRowsHTML}
                        </tbody>
                    </table>
                ` : `
                    <div class="no-data">
                        <p>No activity logs recorded for this contractor.</p>
                    </div>
                `}
            </div>

            <div class="section">
                <h2>💰 Payment History (Day-wise)</h2>
                ${(contractorData?.payments || []).length > 0 ? `
                    <table>
                        <thead>
                            <tr>
                                <th>Payment Type</th>
                                <th>Description</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${paymentRowsHTML}
                        </tbody>
                    </table>
                ` : `
                    <div class="no-data">
                        <p>No payments recorded for this contractor.</p>
                    </div>
                `}
            </div>

            <div class="footer">
                <p><strong>Construction Management System</strong></p>
                <p>This report was automatically generated and contains confidential information.</p>
                <p>Report ID: ${contractorData?._id || 'N/A'} | Generated: ${new Date().toISOString()}</p>
            </div>
        </body>
        </html>
        `;
    };

    const generateAndShareReport = async () => {
        if (!contractorData) {
            Alert.alert('Error', 'No contractor data available for report generation.');
            return;
        }

        try {
            setIsGenerating(true);
            console.log('🔄 Starting contractor report generation...');

            // Generate HTML content
            const htmlContent = generateHTMLReport();
            console.log('✅ HTML content generated');

            // Generate PDF
            console.log('📄 Creating PDF...');
            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                base64: false,
            });

            console.log('✅ PDF created at:', uri);

            // Create a better filename
            const contractorName = getContractorName().replace(/[^a-zA-Z0-9]/g, '_');
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `Contractor_Report_${contractorName}_${timestamp}.pdf`;

            // Create permanent location with proper error handling
            let permanentUri = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}${filename}`;
            
            try {
                // Check if destination file already exists and delete it
                const fileInfo = await FileSystem.getInfoAsync(permanentUri);
                if (fileInfo.exists) {
                    await FileSystem.deleteAsync(permanentUri);
                    console.log('🗑️ Existing file deleted:', permanentUri);
                }
                
                // Move to permanent location
                await FileSystem.moveAsync({
                    from: uri,
                    to: permanentUri,
                });
                console.log('✅ PDF moved to permanent location:', permanentUri);
            } catch (moveError) {
                console.log('⚠️ Move failed, trying copy instead:', moveError);
                // If move fails, try copying instead
                try {
                    await FileSystem.copyAsync({
                        from: uri,
                        to: permanentUri,
                    });
                    console.log('✅ PDF copied to permanent location:', permanentUri);
                    
                    // Clean up the temporary file
                    try {
                        await FileSystem.deleteAsync(uri);
                        console.log('🗑️ Temporary file cleaned up');
                    } catch (deleteError) {
                        console.log('⚠️ Could not delete temporary file:', deleteError);
                    }
                } catch (copyError) {
                    console.error('❌ Both move and copy failed:', copyError);
                    // Use the original URI if both operations fail
                    permanentUri = uri;
                    console.log('📄 Using original temporary URI:', permanentUri);
                }
            }

            // Check if sharing is available
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert(
                    'Report Generated',
                    `Report has been generated successfully!\n\nLocation: ${permanentUri}`,
                    [{ text: 'OK' }]
                );
                return;
            }

            // Share the PDF
            console.log('📤 Sharing PDF...');
            await Sharing.shareAsync(permanentUri, {
                mimeType: 'application/pdf',
                dialogTitle: `Contractor Report - ${getContractorName()}`,
                UTI: 'com.adobe.pdf',
            });

            console.log('✅ Report shared successfully');

        } catch (error) {
            console.error('❌ Error generating contractor report:', error);
            Alert.alert(
                'Report Generation Failed',
                'There was an error generating the contractor report. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsGenerating(false);
        }
    };

    if (!contractorData) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.headerIcon}>
                                <Ionicons name="document-text" size={24} color="#10B981" />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>Contractor Report</Text>
                                <Text style={styles.headerSubtitle}>{getContractorName()}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Contract Summary */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Contract Summary</Text>
                            <View style={styles.summaryGrid}>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Contract Type</Text>
                                    <Text style={styles.summaryValue}>{contractorData.contractType}</Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Status</Text>
                                    <View style={[
                                        styles.statusBadge,
                                        contractorData.status === 'completed' ? styles.statusCompleted : styles.statusActive
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            contractorData.status === 'completed' ? styles.statusTextCompleted : styles.statusTextActive
                                        ]}>
                                            {contractorData.status?.toUpperCase() || 'ACTIVE'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Total Budget</Text>
                                    <Text style={styles.summaryValue}>{formatCurrency(contractorData.totalAmount || 0)}</Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Total Paid</Text>
                                    <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                                        {formatCurrency(contractorData.totalPaid || 0)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Report Contents Preview */}
                        <View style={styles.previewCard}>
                            <Text style={styles.previewTitle}>📋 Report Contents</Text>
                            <View style={styles.previewItem}>
                                <Ionicons name="construct-outline" size={20} color="#3B82F6" />
                                <View style={styles.previewContent}>
                                    <Text style={styles.previewItemTitle}>Work Logs (Day-wise)</Text>
                                    <Text style={styles.previewItemDesc}>
                                        {loadingData ? 'Loading...' : `${laborEntries.length} work entries recorded`}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.previewItem}>
                                <Ionicons name="clipboard-outline" size={20} color="#7C3AED" />
                                <View style={styles.previewContent}>
                                    <Text style={styles.previewItemTitle}>Activity Logs (Labor & Mistri Work)</Text>
                                    <Text style={styles.previewItemDesc}>
                                        {loadingData ? 'Loading...' : `${workLogActivities.length} activities recorded`}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.previewItem}>
                                <Ionicons name="cash-outline" size={20} color="#10B981" />
                                <View style={styles.previewContent}>
                                    <Text style={styles.previewItemTitle}>Payment History (Day-wise)</Text>
                                    <Text style={styles.previewItemDesc}>
                                        {(contractorData.payments || []).length} payments recorded
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.previewItem}>
                                <Ionicons name="analytics-outline" size={20} color="#8B5CF6" />
                                <View style={styles.previewContent}>
                                    <Text style={styles.previewItemTitle}>Financial Summary</Text>
                                    <Text style={styles.previewItemDesc}>
                                        Budget utilization and outstanding amounts
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Data Loading State */}
                        {loadingData && (
                            <View style={styles.loadingCard}>
                                <ActivityIndicator size="small" color="#3B82F6" />
                                <Text style={styles.loadingText}>Loading contractor data...</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Generate Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.generateButton, (isGenerating || loadingData) && styles.generateButtonDisabled]}
                            onPress={generateAndShareReport}
                            activeOpacity={0.8}
                            disabled={isGenerating || loadingData}
                        >
                            {isGenerating ? (
                                <>
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                    <Text style={styles.generateButtonText}>Generating PDF...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="download" size={20} color="#FFFFFF" />
                                    <Text style={styles.generateButtonText}>Generate & Share PDF Report</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
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
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
        paddingTop: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    summaryCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        marginVertical: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 12,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    summaryItem: {
        flex: 1,
        minWidth: '45%',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    statusActive: {
        backgroundColor: '#DCFCE7',
    },
    statusCompleted: {
        backgroundColor: '#E0E7FF',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    statusTextActive: {
        color: '#15803D',
    },
    statusTextCompleted: {
        color: '#4338CA',
    },
    previewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 16,
    },
    previewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    previewContent: {
        marginLeft: 12,
        flex: 1,
    },
    previewItemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    previewItemDesc: {
        fontSize: 12,
        color: '#64748B',
    },
    loadingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748B',
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
    },
    generateButtonDisabled: {
        opacity: 0.6,
    },
    generateButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default ContractorReportGenerator;