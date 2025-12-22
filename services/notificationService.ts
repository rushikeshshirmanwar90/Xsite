import { domain } from '@/lib/domain';
import axios from 'axios';
import { emailService, WelcomeEmailPayload } from './emailService';

export interface NotificationPayload {
    recipientEmail: string;
    recipientName: string;
    subject: string;
    message: string;
    type: string;
    clientId: string;
    staffId?: string;
    companyName: string;
    metadata?: Record<string, any>;
}

export class NotificationService {
    private static instance: NotificationService;
    
    private constructor() {}
    
    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    /**
     * Send a welcome message to a newly added staff member
     */
    async sendStaffWelcomeMessage(payload: NotificationPayload): Promise<boolean> {
        try {
            console.log('📱 Sending staff welcome notification...');
            console.log('📋 Notification payload:', JSON.stringify(payload, null, 2));
            console.log('🌐 Domain:', domain);
            
            // First, send the actual email using the email service
            console.log('📧 Sending actual welcome email...');
            const emailPayload: WelcomeEmailPayload = {
                email: payload.recipientEmail,
                staffName: payload.recipientName,
                companyName: payload.companyName
            };
            
            const emailSent = await emailService.sendWelcomeEmail(emailPayload);
            
            if (!emailSent) {
                console.error('❌ Failed to send welcome email');
                return false;
            }
            
            console.log('✅ Welcome email sent successfully');
            
            // Then, log the notification in the system (optional)
            try {
                const url = `${domain}/api/notifications/staff-welcome`;
                console.log('📤 Logging notification: POST URL:', url);
                
                const response = await axios.post(url, payload);
                
                console.log('📥 Notification log response status:', response.status);
                console.log('📥 Notification log response data:', JSON.stringify(response.data, null, 2));
                
                if (response.data.success) {
                    console.log('✅ Staff welcome notification logged successfully');
                } else {
                    console.warn('⚠️ Failed to log notification, but email was sent');
                }
            } catch (logError: any) {
                console.warn('⚠️ Failed to log notification, but email was sent:', logError.message);
                // Don't fail the whole process if logging fails
            }
            
            return true;
            
        } catch (error: any) {
            console.error('❌ Error in sendStaffWelcomeMessage:', error);
            console.error('❌ Error message:', error.message);
            if (error.response) {
                console.error('❌ Error response status:', error.response.status);
                console.error('❌ Error response data:', error.response.data);
            }
            if (error.request) {
                console.error('❌ Error request:', error.request);
            }
            return false;
        }
    }

    /**
     * Create a welcome message template
     */
    createWelcomeMessage(staffName: string, companyName: string, role: string): string {
        return `Dear ${staffName},

Welcome to ${companyName}! 

We are excited to have you join our team as a ${role}. You have been successfully added to our construction management system.

Here's what you need to know:
• Your role: ${role}
• Company: ${companyName}
• Access: You can now log in to the system using your email address

Please contact your administrator if you have any questions or need assistance getting started.

We look forward to working with you!

Best regards,
${companyName} Team`;
    }

    /**
     * Create a welcome message subject
     */
    createWelcomeSubject(companyName: string): string {
        return `Welcome to ${companyName} - You've been added as a staff member`;
    }

    /**
     * Send a general notification (can be extended for other types)
     */
    async sendNotification(type: string, payload: NotificationPayload): Promise<boolean> {
        switch (type) {
            case 'staff_welcome':
                return this.sendStaffWelcomeMessage(payload);
            default:
                console.warn(`⚠️ Unknown notification type: ${type}`);
                return false;
        }
    }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();