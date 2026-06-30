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
    allContractors?: any[];
    /** Pre-fetched labor map from parent (staffId → entries). When provided,
     *  the component skips all internal API calls and opens instantly. */
    prefetchedLaborMap?: Record<string, LaborEntry[]>;
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

const ContractorReportGenerator: React.FC<ContractorReportGeneratorProps> = ({
    visible,
    onClose,
    contractorData,
    projectId,
    projectName,
    allContractors,
    prefetchedLaborMap,
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [laborEntries, setLaborEntries] = useState<LaborEntry[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [allContractorsLaborMap, setAllContractorsLaborMap] = useState<Record<string, LaborEntry[]>>(
        prefetchedLaborMap ?? {}
    );
    const [selectedContractorIds, setSelectedContractorIds] = useState<Record<string, boolean>>({});

    const isProjectMode = !contractorData && Array.isArray(allContractors) && allContractors.length > 0;

    React.useEffect(() => {
        if (visible && isProjectMode && allContractors) {
            const initialSelection: Record<string, boolean> = {};
            allContractors.forEach((c: any) => {
                const id = String(c._id || c.staffId?._id || c.staffId);
                initialSelection[id] = true;
            });
            setSelectedContractorIds(initialSelection);
        }
    }, [visible, allContractors, isProjectMode]);

    const selectedContractors = isProjectMode
        ? (allContractors || []).filter((c: any) => {
            const id = String(c._id || c.staffId?._id || c.staffId);
            return !!selectedContractorIds[id];
          })
        : [];

    const isAllSelected = isProjectMode && allContractors && allContractors.length > 0 &&
        allContractors.every((c: any) => {
            const id = String(c._id || c.staffId?._id || c.staffId);
            return !!selectedContractorIds[id];
        });

    const handleToggleSelectAll = () => {
        if (!allContractors) return;
        const nextValue = !isAllSelected;
        const newSelection: Record<string, boolean> = {};
        allContractors.forEach((c: any) => {
            const id = String(c._id || c.staffId?._id || c.staffId);
            newSelection[id] = nextValue;
        });
        setSelectedContractorIds(newSelection);
    };

    const handleToggleContractor = (id: string) => {
        setSelectedContractorIds(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    React.useEffect(() => {
        if (!visible) return;

        // If labor data was pre-fetched by the parent (behind the loading overlay),
        // use it directly — no network calls needed, modal opens instantly.
        if (prefetchedLaborMap && Object.keys(prefetchedLaborMap).length > 0) {
            setAllContractorsLaborMap(prefetchedLaborMap);
            return;
        }

        let active = true;
        // Fallback: fetch internally if no pre-fetched data was provided.
        const t = setTimeout(() => {
            if (isProjectMode) {
                fetchAllContractorsData(active);
            } else if (contractorData) {
                fetchSingleContractorData(active);
            }
        }, 300);
        return () => {
            active = false;
            clearTimeout(t);
        };
    }, [visible, contractorData, isProjectMode, prefetchedLaborMap]);

    const fetchSingleContractorData = async (active = true) => {
        if (!contractorData) return;
        try {
            if (active) setLoadingData(true);
            const staffId = contractorData.staffId?._id || contractorData.staffId;
            const res = await apiClient.get('/api/labor', {
                params: { projectId, addedBy: staffId },
            });
            const result = res.data;
            if (active) {
                setLaborEntries(result.success && result.data ? result.data.laborEntries || [] : []);
            }
        } catch {
            if (active) setLaborEntries([]);
        } finally {
            if (active) setLoadingData(false);
        }
    };

    const fetchAllContractorsData = async (active = true) => {
        if (!allContractors || allContractors.length === 0) return;
        try {
            if (active) setLoadingData(true);
            const results = await Promise.allSettled(
                allContractors.map(async (c) => {
                    const staffId = c.staffId?._id || c.staffId;
                    const res = await apiClient.get('/api/labor', {
                        params: { projectId, addedBy: staffId },
                    });
                    const result = res.data;
                    const entries: LaborEntry[] = result.success && result.data
                        ? result.data.laborEntries || []
                        : [];
                    return { staffId: String(staffId), entries };
                })
            );
            const map: Record<string, LaborEntry[]> = {};
            results.forEach((r) => {
                if (r.status === 'fulfilled') {
                    map[r.value.staffId] = r.value.entries;
                }
            });
            if (active) setAllContractorsLaborMap(map);
        } catch {
            if (active) setAllContractorsLaborMap({});
        } finally {
            if (active) setLoadingData(false);
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);

    const formatDateForPDF = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const getContractorFullName = (c: any) =>
        c?.staffId
            ? `${c.staffId.firstName || ''} ${c.staffId.lastName || ''}`.trim()
            : 'Unknown Contractor';

    const buildLaborRowsHTML = (entries: LaborEntry[]) => {
        if (entries.length === 0) return '';
        const byDate = entries.reduce((acc: any, e) => {
            const d = new Date(e.addedAt).toDateString();
            if (!acc[d]) acc[d] = [];
            acc[d].push(e);
            return acc;
        }, {});

        return Object.entries(byDate)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, rows]: [string, any]) => {
                const dayTotal = rows.reduce((s: number, r: any) => s + r.totalCost, 0);
                const rowsHTML = rows.map((r: any) => `
                    <tr style="background:#f8fafc;">
                        <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;">${r.type}</td>
                        <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;font-size:12px;">${r.count}</td>
                        <td style="padding:8px;border:1px solid #e2e8f0;text-align:right;font-size:12px;">${formatCurrency(r.perLaborCost)}</td>
                        <td style="padding:8px;border:1px solid #e2e8f0;text-align:right;font-weight:600;font-size:12px;">${formatCurrency(r.totalCost)}</td>
                    </tr>`).join('');
                return `
                    <tr style="background:#1e293b;">
                        <td colspan="4" style="padding:10px;color:white;font-weight:600;font-size:13px;">
                            📅 ${formatDateForPDF(date)} — Total: ${formatCurrency(dayTotal)}
                        </td>
                    </tr>${rowsHTML}`;
            }).join('');
    };

    const buildPaymentRowsHTML = (payments: any[]) => {
        if (!payments || payments.length === 0) return '';
        const byDate = payments.reduce((acc: any, p) => {
            const d = new Date(p.paymentDate).toDateString();
            if (!acc[d]) acc[d] = [];
            acc[d].push(p);
            return acc;
        }, {});

        return Object.entries(byDate)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, ps]: [string, any]) => {
                const dayTotal = ps.reduce((s: number, p: any) => s + p.amount, 0);
                const rowsHTML = ps.map((p: any) => `
                    <tr style="background:#f0fdf4;">
                        <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;">
                            <span style="background:#dcfce7;color:#166534;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;">
                                ${(p.paymentType || 'payment').toUpperCase()}
                            </span>
                        </td>
                        <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;">${p.notes || 'Payment recorded'}</td>
                        <td style="padding:8px;border:1px solid #e2e8f0;text-align:right;font-weight:600;color:#059669;font-size:12px;">${formatCurrency(p.amount)}</td>
                    </tr>`).join('');
                return `
                    <tr style="background:#059669;">
                        <td colspan="3" style="padding:10px;color:white;font-weight:600;font-size:13px;">
                            💰 ${formatDateForPDF(date)} — Total Paid: ${formatCurrency(dayTotal)}
                        </td>
                    </tr>${rowsHTML}`;
            }).join('');
    };

    const commonCSS = `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin:0; padding:20px; background:#fff; color:#1e293b; line-height:1.4; }
        table { width:100%; border-collapse:collapse; margin-bottom:16px; background:white; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
        th { background:#374151; color:white; padding:10px 12px; text-align:left; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; }
        td { padding:10px; border:1px solid #e2e8f0; font-size:13px; }
        .no-data { text-align:center; padding:30px; color:#64748b; font-style:italic; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:16px; }
        .section-title { font-size:15px; font-weight:700; color:#1e293b; margin:20px 0 10px 0; padding:10px 14px; background:#f1f5f9; border-left:4px solid #2E72F0; border-radius:4px; }
        .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:16px; }
        .summary-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; text-align:center; }
        .summary-card h3 { margin:0 0 6px 0; font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase; }
        .summary-card p { margin:0; font-size:16px; font-weight:700; color:#1e293b; }
        .footer { margin-top:40px; padding:16px; background:#f8fafc; border-radius:8px; text-align:center; font-size:12px; color:#64748b; }
    `;

    const generateSingleContractorHTML = () => {
        const name = getContractorFullName(contractorData);
        const totalBudget = contractorData?.totalAmount || 0;
        const totalPaid = contractorData?.totalPaid || 0;
        const totalWorkDone = contractorData?.usedAmount || 0;
        const contractType = contractorData?.contractType || 'Unknown';
        const contractStatus = contractorData?.status || 'active';
        const outstanding = Math.max(0, totalWorkDone - totalPaid);

        const laborHTML = buildLaborRowsHTML(laborEntries);
        const paymentHTML = buildPaymentRowsHTML(contractorData?.payments || []);

        return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Contractor Report - ${name}</title><style>${commonCSS}
            .header { text-align:center; margin-bottom:24px; padding:20px; background:linear-gradient(135deg,#2E72F0,#2563eb); color:white; border-radius:12px; }
            .header h1 { margin:0 0 6px 0; font-size:22px; font-weight:700; }
            .header p { margin:3px 0; font-size:13px; opacity:0.9; }
            .status-badge { display:inline-block; padding:3px 8px; border-radius:4px; font-size:10px; font-weight:600; text-transform:uppercase; ${contractStatus === 'completed' ? 'background:#dcfce7;color:#166534;' : 'background:#fef3c7;color:#92400e;'} }
        </style></head><body>
            <div class="header">
                <h1>Contractor Report</h1>
                <p><strong>${name}</strong></p>
                <p>Project: ${projectName}</p>
                <p>Contract Type: ${contractType} &nbsp;•&nbsp; Status: <span class="status-badge">${contractStatus}</span></p>
                <p>Generated: ${new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
            </div>
            <div class="summary-grid">
                <div class="summary-card"><h3>Total Budget</h3><p>${formatCurrency(totalBudget)}</p></div>
                <div class="summary-card"><h3>Work Done</h3><p>${formatCurrency(totalWorkDone)}</p></div>
                <div class="summary-card"><h3>Total Paid</h3><p style="color:#059669;">${formatCurrency(totalPaid)}</p></div>
                <div class="summary-card"><h3>Outstanding</h3><p style="color:${outstanding > 0 ? '#dc2626' : '#059669'};">${formatCurrency(outstanding)}</p></div>
            </div>

            <div class="section-title">Work Logs (Day-wise)</div>
            ${laborEntries.length > 0 ? `
                <table><thead><tr>
                    <th>Worker Type</th><th style="text-align:center;">Count</th>
                    <th style="text-align:right;">Rate / Worker</th><th style="text-align:right;">Total Cost</th>
                </tr></thead><tbody>${laborHTML}</tbody></table>
            ` : '<div class="no-data">No work logs recorded.</div>'}

            <div class="section-title">Payment History (Day-wise)</div>
            ${(contractorData?.payments || []).length > 0 ? `
                <table><thead><tr>
                    <th>Payment Type</th><th>Description</th><th style="text-align:right;">Amount</th>
                </tr></thead><tbody>${paymentHTML}</tbody></table>
            ` : '<div class="no-data">No payments recorded.</div>'}

            <div class="footer">
                <p><strong>Construction Management System</strong></p>
                <p>Report ID: ${contractorData?._id || 'N/A'} | Generated: ${new Date().toISOString()}</p>
            </div>
        </body></html>`;
    };

    const generateAllContractorsHTML = () => {
        const contractors = selectedContractors;
        const now = new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

        // Project-level totals
        const projectBudget = contractors.reduce((s, c) => s + (c.totalAmount || 0), 0);
        const projectPaid = contractors.reduce((s, c) => s + (c.totalPaid || 0), 0);
        const projectWorkDone = contractors.reduce((s, c) => s + (c.usedAmount || 0), 0);
        const projectOutstanding = Math.max(0, projectWorkDone - projectPaid);

        const contractorSectionsHTML = contractors.map((c: any) => {
            const name = getContractorFullName(c);
            const staffId = String(c.staffId?._id || c.staffId);
            const entries = allContractorsLaborMap[staffId] || [];
            const totalBudget = c.totalAmount || 0;
            const totalPaid = c.totalPaid || 0;
            const totalWorkDone = c.usedAmount || 0;
            const outstanding = Math.max(0, totalWorkDone - totalPaid);
            const contractType = c.contractType || 'Unknown';
            const contractStatus = c.status || 'active';
            const payments = c.payments || [];

            const laborTotal = entries.reduce((s: number, e: LaborEntry) => s + e.totalCost, 0);
            const paymentTotal = payments.reduce((s: number, p: any) => s + p.amount, 0);

            const laborHTML = buildLaborRowsHTML(entries);
            const paymentHTML = buildPaymentRowsHTML(payments);

            const statusBadgeStyle = contractStatus === 'completed'
                ? 'background:#dcfce7;color:#166534;'
                : 'background:#fef3c7;color:#92400e;';

            return `
            <div style="margin-bottom:40px; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
                <div style="background:linear-gradient(135deg,#1e40af,#2E72F0); padding:16px 20px; color:white;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="font-size:18px; font-weight:700;">${name}</div>
                            <div style="font-size:12px; opacity:0.85; margin-top:3px;">
                                ${contractType} &nbsp;•&nbsp;
                                <span style="display:inline-block;${statusBadgeStyle}padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;">${contractStatus}</span>
                            </div>
                        </div>
                        <div style="text-align:right; font-size:12px; opacity:0.85;">
                            <div>Labor Cost: <strong>${formatCurrency(laborTotal)}</strong></div>
                            <div>Paid: <strong>${formatCurrency(paymentTotal)}</strong></div>
                        </div>
                    </div>
                </div>
                <div style="padding:16px 20px;">
                    <div class="summary-grid">
                        <div class="summary-card"><h3>Contract Budget</h3><p>${formatCurrency(totalBudget)}</p></div>
                        <div class="summary-card"><h3>Work Done</h3><p>${formatCurrency(totalWorkDone)}</p></div>
                        <div class="summary-card"><h3>Total Paid</h3><p style="color:#059669;">${formatCurrency(totalPaid)}</p></div>
                        <div class="summary-card"><h3>Outstanding</h3><p style="color:${outstanding > 0 ? '#dc2626' : '#059669'};">${formatCurrency(outstanding)}</p></div>
                    </div>

                    <div class="section-title">Work Logs (Day-wise)</div>
                    ${entries.length > 0 ? `
                        <table><thead><tr>
                            <th>Worker Type</th><th style="text-align:center;">Count</th>
                            <th style="text-align:right;">Rate / Worker</th><th style="text-align:right;">Total Cost</th>
                        </tr></thead><tbody>${laborHTML}</tbody></table>
                    ` : '<div class="no-data">No work logs recorded.</div>'}

                    <div class="section-title">Payment History (Day-wise)</div>
                    ${payments.length > 0 ? `
                        <table><thead><tr>
                            <th>Payment Type</th><th>Description</th><th style="text-align:right;">Amount</th>
                        </tr></thead><tbody>${paymentHTML}</tbody></table>
                    ` : '<div class="no-data">No payments recorded.</div>'}
                </div>
            </div>`;
        }).join('');

        return `<!DOCTYPE html><html><head><meta charset="utf-8">
        <title>Project Contractor Report - ${projectName}</title>
        <style>${commonCSS}
            .main-header { text-align:center; margin-bottom:24px; padding:20px; background:linear-gradient(135deg,#0f172a,#1e40af); color:white; border-radius:12px; }
            .main-header h1 { margin:0 0 6px 0; font-size:24px; font-weight:700; }
            .main-header p { margin:3px 0; font-size:13px; opacity:0.9; }
            .project-summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px 20px; margin-bottom:28px; }
            .project-summary h2 { margin:0 0 14px 0; font-size:16px; font-weight:700; color:#1e293b; }
        </style></head><body>
            <div class="main-header">
                <h1>Project Contractor Report</h1>
                <p><strong>${projectName}</strong></p>
                <p>${contractors.length} Contractor${contractors.length !== 1 ? 's' : ''}</p>
                <p>Generated: ${now}</p>
            </div>

            <div class="project-summary">
                <h2>Project Financial Summary</h2>
                <div class="summary-grid">
                    <div class="summary-card"><h3>Total Budget</h3><p>${formatCurrency(projectBudget)}</p></div>
                    <div class="summary-card"><h3>Work Done</h3><p>${formatCurrency(projectWorkDone)}</p></div>
                    <div class="summary-card"><h3>Total Paid</h3><p style="color:#059669;">${formatCurrency(projectPaid)}</p></div>
                    <div class="summary-card"><h3>Outstanding</h3><p style="color:${projectOutstanding > 0 ? '#dc2626' : '#059669'};">${formatCurrency(projectOutstanding)}</p></div>
                </div>
            </div>

            ${contractorSectionsHTML}

            <div class="footer">
                <p><strong>Construction Management System</strong></p>
                <p>Generated: ${new Date().toISOString()}</p>
            </div>
        </body></html>`;
    };

    const generateAndShareReport = async () => {
        try {
            setIsGenerating(true);
            const htmlContent = isProjectMode
                ? generateAllContractorsHTML()
                : generateSingleContractorHTML();

            const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });

            const nameSlug = isProjectMode
                ? projectName.replace(/[^a-zA-Z0-9]/g, '_')
                : getContractorFullName(contractorData).replace(/[^a-zA-Z0-9]/g, '_');
            const timestamp = new Date().toISOString().split('T')[0];
            const prefix = isProjectMode ? 'Project_Contractor_Report' : 'Contractor_Report';
            const filename = `${prefix}_${nameSlug}_${timestamp}.pdf`;

            let permanentUri = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}${filename}`;

            try {
                const info = await FileSystem.getInfoAsync(permanentUri);
                if (info.exists) await FileSystem.deleteAsync(permanentUri);
                await FileSystem.moveAsync({ from: uri, to: permanentUri });
            } catch {
                try {
                    await FileSystem.copyAsync({ from: uri, to: permanentUri });
                    try { await FileSystem.deleteAsync(uri); } catch {}
                } catch {
                    permanentUri = uri;
                }
            }

            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert('Report Generated', `Saved to: ${permanentUri}`, [{ text: 'OK' }]);
                return;
            }

            await Sharing.shareAsync(permanentUri, {
                mimeType: 'application/pdf',
                dialogTitle: isProjectMode
                    ? `Project Report - ${projectName}`
                    : `Contractor Report - ${getContractorFullName(contractorData)}`,
                UTI: 'com.adobe.pdf',
            });
        } catch (error) {
            Alert.alert('Report Generation Failed', 'There was an error generating the report. Please try again.', [{ text: 'OK' }]);
        } finally {
            setIsGenerating(false);
        }
    };

    if (!contractorData && !isProjectMode) return null;

    const totalLaborCost = isProjectMode
        ? selectedContractors.reduce((sum, c) => {
            const staffId = String(c.staffId?._id || c.staffId);
            const entries = allContractorsLaborMap[staffId] || [];
            return sum + entries.reduce((s, e) => s + e.totalCost, 0);
          }, 0)
        : laborEntries.reduce((s, e) => s + e.totalCost, 0);

    const totalPayments = isProjectMode
        ? selectedContractors.reduce((s, c) => s + (c.payments || []).reduce((ps: number, p: any) => ps + p.amount, 0), 0)
        : (contractorData?.payments || []).reduce((s: number, p: any) => s + p.amount, 0);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.headerIcon}>
                                <Ionicons name="document-text" size={24} color={isProjectMode ? '#2E72F0' : '#10B981'} />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>
                                    {isProjectMode ? 'Project Report' : 'Contractor Report'}
                                </Text>
                                <Text style={styles.headerSubtitle}>
                                    {isProjectMode
                                        ? `${selectedContractors.length} of ${allContractors!.length} Selected`
                                        : getContractorFullName(contractorData)}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {isProjectMode ? (
                            <>
                                <View style={styles.summaryCard}>
                                    <Text style={styles.summaryTitle}>Project Financial Summary</Text>
                                    <View style={styles.summaryGrid}>
                                        <View style={styles.summaryItem}>
                                            <Text style={styles.summaryLabel}>Total Budget</Text>
                                            <Text style={styles.summaryValue}>
                                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
                                                    selectedContractors.reduce((s, c) => s + (c.totalAmount || 0), 0)
                                                )}
                                            </Text>
                                        </View>
                                        <View style={styles.summaryItem}>
                                            <Text style={styles.summaryLabel}>Total Paid</Text>
                                            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalPayments)}
                                            </Text>
                                        </View>
                                        <View style={styles.summaryItem}>
                                            <Text style={styles.summaryLabel}>Labor Cost</Text>
                                            <Text style={styles.summaryValue}>
                                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalLaborCost)}
                                            </Text>
                                        </View>
                                        <View style={styles.summaryItem}>
                                            <Text style={styles.summaryLabel}>Selected</Text>
                                            <Text style={styles.summaryValue}>{selectedContractors.length}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.previewCard}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <Text style={styles.previewTitle}>Select Contractors</Text>
                                        <TouchableOpacity
                                            onPress={handleToggleSelectAll}
                                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name={isAllSelected ? "checkbox" : "square-outline"}
                                                size={18}
                                                color="#2E72F0"
                                            />
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#2E72F0' }}>
                                                Select All
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    {(allContractors || []).map((c: any, i: number) => {
                                        const cId = String(c._id || c.staffId?._id || c.staffId);
                                        const isSelected = !!selectedContractorIds[cId];
                                        return (
                                            <TouchableOpacity
                                                key={i}
                                                style={styles.previewItem}
                                                activeOpacity={0.75}
                                                onPress={() => handleToggleContractor(cId)}
                                            >
                                                <Ionicons
                                                    name={isSelected ? "checkbox" : "square-outline"}
                                                    size={22}
                                                    color={isSelected ? "#2E72F0" : "#94A3B8"}
                                                    style={{ marginRight: 10 }}
                                                />
                                                <View style={styles.previewContent}>
                                                    <Text style={styles.previewItemTitle}>{getContractorFullName(c)}</Text>
                                                    <Text style={styles.previewItemDesc}>
                                                        {c.contractType} • {loadingData ? 'Loading...' : `${(allContractorsLaborMap[String(c.staffId?._id || c.staffId)] || []).length} labor entries, ${(c.payments || []).length} payments`}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </>
                        ) : (
                            <>
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
                                                contractorData.status === 'completed' ? styles.statusCompleted : styles.statusActive,
                                            ]}>
                                                <Text style={[
                                                    styles.statusText,
                                                    contractorData.status === 'completed' ? styles.statusTextCompleted : styles.statusTextActive,
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
                                <View style={styles.previewCard}>
                                    <Text style={styles.previewTitle}>Report Contents</Text>
                                    <View style={styles.previewItem}>
                                        <Ionicons name="construct-outline" size={20} color="#2E72F0" />
                                        <View style={styles.previewContent}>
                                            <Text style={styles.previewItemTitle}>Work Logs (Day-wise)</Text>
                                            <Text style={styles.previewItemDesc}>
                                                {loadingData ? 'Loading...' : `${laborEntries.length} work entries recorded`}
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
                                            <Text style={styles.previewItemDesc}>Budget utilization and outstanding amounts</Text>
                                        </View>
                                    </View>
                                </View>
                            </>
                        )}

                        {loadingData && (
                            <View style={styles.loadingCard}>
                                <ActivityIndicator size="small" color="#2E72F0" />
                                <Text style={styles.loadingText}>Loading data...</Text>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[
                                styles.generateButton,
                                (isGenerating || loadingData || (isProjectMode && selectedContractors.length === 0)) && styles.generateButtonDisabled
                            ]}
                            onPress={generateAndShareReport}
                            activeOpacity={0.8}
                            disabled={isGenerating || loadingData || (isProjectMode && selectedContractors.length === 0)}
                        >
                            {isGenerating ? (
                                <>
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                    <Text style={styles.generateButtonText}>Generating PDF...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons
                                        name={(isProjectMode && selectedContractors.length === 0) ? "alert-circle-outline" : "download"}
                                        size={20}
                                        color="#FFFFFF"
                                    />
                                    <Text style={styles.generateButtonText}>
                                        {(isProjectMode && selectedContractors.length === 0)
                                            ? "Select at least 1 contractor"
                                            : "Generate & Share PDF Report"}
                                    </Text>
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
