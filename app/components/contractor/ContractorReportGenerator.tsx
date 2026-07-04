import React, { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system/legacy';

interface ContractorReportGeneratorProps {
    visible: boolean;
    onClose: () => void;
    contractorData: any;
    projectId: string;
    projectName: string;
    allContractors?: any[];
}

/**
 * Headless report trigger — no modal UI. As soon as `visible` becomes true it
 * builds the PDF and hands off to a native Alert with View / Share / Cancel,
 * matching the flow used by the other cost-summary report generators.
 */
const ContractorReportGenerator: React.FC<ContractorReportGeneratorProps> = ({
    visible,
    onClose,
    contractorData,
    projectId,
    projectName,
    allContractors,
}) => {
    const hasRunRef = useRef(false);

    const isProjectMode = !contractorData && Array.isArray(allContractors) && allContractors.length > 0;

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
        .section-title { font-size:15px; font-weight:700; color:#1e293b; margin:20px 0 10px 0; padding:10px 14px; background:#f1f5f9; border-left:4px solid #3A78B5; border-radius:4px; }
        .summary-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:16px; }
        .summary-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; text-align:center; }
        .summary-card h3 { margin:0 0 6px 0; font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase; }
        .summary-card p { margin:0; font-size:16px; font-weight:700; color:#1e293b; }
        .footer { margin-top:40px; padding:16px; background:#f8fafc; border-radius:8px; text-align:center; font-size:12px; color:#64748b; }
    `;

    const generateSingleContractorHTML = () => {
        const name = getContractorFullName(contractorData);
        const contractType = contractorData?.contractType || 'Contract';
        const totalAmount = contractorData?.totalAmount || 0;
        const totalPaid = contractorData?.totalPaid || 0;
        const paymentHTML = buildPaymentRowsHTML(contractorData?.payments || []);

        return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Contractor Report - ${name}</title><style>${commonCSS}
            .header { text-align:center; margin-bottom:24px; padding:20px; background:linear-gradient(135deg,#3A78B5,#2563eb); color:white; border-radius:12px; }
            .header h1 { margin:0 0 6px 0; font-size:22px; font-weight:700; }
            .header p { margin:3px 0; font-size:13px; opacity:0.9; }
        </style></head><body>
            <div class="header">
                <h1>Contractor Report</h1>
                <p style="font-size:16px;"><strong>${contractType}</strong></p>
                <p>${name}</p>
                <p>Project: ${projectName}</p>
                <p>Generated: ${new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
            </div>
            <div class="summary-grid">
                <div class="summary-card"><h3>Total Amount</h3><p>${formatCurrency(totalAmount)}</p></div>
                <div class="summary-card"><h3>Paid Amount</h3><p style="color:#059669;">${formatCurrency(totalPaid)}</p></div>
            </div>

            <div class="section-title">Transaction Details</div>
            ${(contractorData?.payments || []).length > 0 ? `
                <table><thead><tr>
                    <th>Payment Type</th><th>Description</th><th style="text-align:right;">Amount</th>
                </tr></thead><tbody>${paymentHTML}</tbody></table>
            ` : '<div class="no-data">No transactions recorded.</div>'}

            <div class="footer">
                <p><strong>Construction Management System</strong></p>
                <p>Report ID: ${contractorData?._id || 'N/A'} | Generated: ${new Date().toISOString()}</p>
            </div>
        </body></html>`;
    };

    const generateAllContractorsHTML = () => {
        const contractors = allContractors || [];
        const now = new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

        // Project-level totals
        const projectTotalAmount = contractors.reduce((s, c) => s + (c.totalAmount || 0), 0);
        const projectPaid = contractors.reduce((s, c) => s + (c.totalPaid || 0), 0);

        const contractorSectionsHTML = contractors.map((c: any) => {
            const name = getContractorFullName(c);
            const contractType = c.contractType || 'Contract';
            const totalAmount = c.totalAmount || 0;
            const totalPaid = c.totalPaid || 0;
            const payments = c.payments || [];
            const paymentHTML = buildPaymentRowsHTML(payments);

            return `
            <div style="margin-bottom:40px; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
                <div style="background:linear-gradient(135deg,#1e40af,#3A78B5); padding:16px 20px; color:white;">
                    <div style="font-size:18px; font-weight:700;">${contractType}</div>
                    <div style="font-size:13px; opacity:0.85; margin-top:3px;">${name}</div>
                </div>
                <div style="padding:16px 20px;">
                    <div class="summary-grid">
                        <div class="summary-card"><h3>Total Amount</h3><p>${formatCurrency(totalAmount)}</p></div>
                        <div class="summary-card"><h3>Paid Amount</h3><p style="color:#059669;">${formatCurrency(totalPaid)}</p></div>
                    </div>

                    <div class="section-title">Transaction Details</div>
                    ${payments.length > 0 ? `
                        <table><thead><tr>
                            <th>Payment Type</th><th>Description</th><th style="text-align:right;">Amount</th>
                        </tr></thead><tbody>${paymentHTML}</tbody></table>
                    ` : '<div class="no-data">No transactions recorded.</div>'}
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
                    <div class="summary-card"><h3>Total Amount</h3><p>${formatCurrency(projectTotalAmount)}</p></div>
                    <div class="summary-card"><h3>Paid Amount</h3><p style="color:#059669;">${formatCurrency(projectPaid)}</p></div>
                </div>
            </div>

            ${contractorSectionsHTML}

            <div class="footer">
                <p><strong>Construction Management System</strong></p>
                <p>Generated: ${new Date().toISOString()}</p>
            </div>
        </body></html>`;
    };

    const generateAndPromptReport = async () => {
        try {
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

            let finalUri = uri;
            try {
                const permanentUri = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}${filename}`;
                const info = await FileSystem.getInfoAsync(permanentUri);
                if (info.exists) await FileSystem.deleteAsync(permanentUri);
                await FileSystem.moveAsync({ from: uri, to: permanentUri });
                finalUri = permanentUri;
            } catch {
                /* fall back to the original uri */
            }

            const reportLabel = isProjectMode ? 'Project Contractor Report' : 'Contractor Report';

            setTimeout(() => {
                Alert.alert(
                    '✅ Report Ready',
                    `${reportLabel} has been generated.\n\nFilename: ${filename}`,
                    [
                        {
                            text: 'View Report',
                            onPress: async () => {
                                try {
                                    if (Platform.OS === 'android') {
                                        const contentUri = await FileSystem.getContentUriAsync(finalUri);
                                        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                                            data: contentUri,
                                            flags: 1,
                                            type: 'application/pdf',
                                        });
                                    } else if (await Sharing.isAvailableAsync()) {
                                        await Sharing.shareAsync(finalUri, {
                                            mimeType: 'application/pdf',
                                            dialogTitle: `View: ${filename}`,
                                            UTI: 'com.adobe.pdf',
                                        });
                                    }
                                } catch {
                                    if (await Sharing.isAvailableAsync()) {
                                        await Sharing.shareAsync(finalUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
                                    }
                                }
                            },
                        },
                        {
                            text: 'Share Report',
                            onPress: async () => {
                                if (await Sharing.isAvailableAsync()) {
                                    await Sharing.shareAsync(finalUri, {
                                        mimeType: 'application/pdf',
                                        dialogTitle: `Share: ${filename}`,
                                        UTI: 'com.adobe.pdf',
                                    });
                                }
                            },
                        },
                        { text: 'Cancel', style: 'cancel' },
                    ],
                    { cancelable: true }
                );
            }, 100);
        } catch (error) {
            Alert.alert(
                'Error',
                'Failed to generate the contractor report. Please try again. Error: ' + (error instanceof Error ? error.message : String(error)),
                [{ text: 'OK' }]
            );
        } finally {
            onClose();
        }
    };

    useEffect(() => {
        if (!visible) {
            hasRunRef.current = false;
            return;
        }
        if (hasRunRef.current) return;
        hasRunRef.current = true;

        if (!contractorData && !isProjectMode) {
            onClose();
            return;
        }
        generateAndPromptReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    return null;
};

export default ContractorReportGenerator;
