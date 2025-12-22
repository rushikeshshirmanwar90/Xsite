import { domain } from '@/lib/domain';
import axios from 'axios';

export interface WelcomeEmailPayload {
    email: string;
    staffName: string;
    companyName: string;
}

export interface OTPVerificationPayload {
    email: string;
    staffName: string;
    companyName: string;
    otp?: string; // Optional OTP to be sent in email
}

// API Response interfaces
interface ApiResponse {
    success?: boolean;
    message?: string;
    error?: string;
}

interface OTPResponse extends ApiResponse {
    otp?: string;
    messageId?: string;
    info?: {
        messageId: string;
        accepted: string[];
    };
}

interface VerifyOTPResponse extends ApiResponse {
    data?: {
        email: string;
        verifiedAt: string;
    };
}

export class EmailService {
    private static instance: EmailService;
    
    private constructor() {}
    
    public static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    /**
     * Send a welcome email to a newly added staff member
     */
    async sendWelcomeEmail(payload: WelcomeEmailPayload): Promise<boolean> {
        try {
            console.log('📧 Sending welcome email...');
            console.log('📋 Email payload:', JSON.stringify(payload, null, 2));
            console.log('🌐 Domain:', domain);
            
            const url = `${domain}/api/send-mail`;
            console.log('📤 POST URL:', url);
            
            const response = await axios.post<ApiResponse>(url, payload);
            
            console.log('📥 Email response status:', response.status);
            console.log('📥 Email response data:', JSON.stringify(response.data, null, 2));
            
            if (response.status === 200) {
                console.log('✅ Welcome email sent successfully');
                return true;
            } else {
                console.error('❌ Welcome email failed with status:', response.status);
                return false;
            }
        } catch (error: any) {
            console.error('❌ Error sending welcome email:', error);
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
     * Send OTP email for verification using new API
     */
    async sendOTPEmail(payload: OTPVerificationPayload): Promise<boolean> {
        try {
            console.log('📧 Sending OTP email...');
            console.log('📋 OTP Email payload:', JSON.stringify(payload, null, 2));
            console.log('🌐 Domain:', domain);
            
            const url = `${domain}/api/send-otp`;
            console.log('� POST UReL:', url);
            
            const response = await axios.post<OTPResponse>(url, payload);
            
            console.log('📥 OTP Email response status:', response.status);
            console.log('📥 OTP Email response data:', JSON.stringify(response.data, null, 2));
            
            // Check for success: either success=true OR status 200 with message/otp present
            if (response.status === 200 && (response.data.success || response.data.message || response.data.otp)) {
                console.log('✅ OTP email sent successfully');
                return true;
            } else {
                console.error('❌ OTP email failed with status:', response.status);
                return false;
            }
        } catch (error: any) {
            console.error('❌ Error sending OTP email:', error);
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
     * Verify OTP
     */
    async verifyOTP(email: string, otp: string, staffId?: string): Promise<boolean> {
        try {
            console.log('🔐 Verifying OTP...');
            console.log('📧 Email:', email);
            console.log('🔢 OTP:', otp);
            console.log('🆔 Staff ID:', staffId);
            console.log('🌐 Domain:', domain);
            
            const url = `${domain}/api/verify-otp`;
            console.log('📤 POST URL:', url);
            
            const payload = { email, otp, staffId };
            const response = await axios.post<VerifyOTPResponse>(url, payload);
            
            console.log('📥 Verify OTP response status:', response.status);
            console.log('📥 Verify OTP response data:', JSON.stringify(response.data, null, 2));
            
            if (response.status === 200 && response.data.success) {
                console.log('✅ OTP verified successfully');
                return true;
            } else {
                console.error('❌ OTP verification failed with status:', response.status);
                return false;
            }
        } catch (error: any) {
            console.error('❌ Error verifying OTP:', error);
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
     * Send a general email (can be extended for other types)
     */
    async sendEmail(type: string, payload: WelcomeEmailPayload | OTPVerificationPayload): Promise<boolean> {
        switch (type) {
            case 'staff_welcome':
                return this.sendWelcomeEmail(payload as WelcomeEmailPayload);
            case 'otp_verification':
                return this.sendOTPEmail(payload as OTPVerificationPayload);
            default:
                console.warn(`⚠️ Unknown email type: ${type}`);
                return false;
        }
    }
}

// Export singleton instance
export const emailService = EmailService.getInstance();