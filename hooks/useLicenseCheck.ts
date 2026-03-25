import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { domain } from '@/lib/domain';
import { getClientId } from '@/functions/clientId';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LicenseStatus {
    hasAccess: boolean;
    license: number;
    isLicenseActive: boolean;
    licenseExpiryDate?: string;
    loading: boolean;
    error?: string;
}

export const useLicenseCheck = () => {
    const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>({
        hasAccess: true, // Default to true while loading
        license: 0,
        isLicenseActive: false,
        loading: true,
    });
    const router = useRouter();

    const checkLicense = async () => {
        try {
            console.log('🔐 Checking license status...');
            
            // Get user data to check if staff
            const userDetailsString = await AsyncStorage.getItem("user");
            if (!userDetailsString) {
                console.warn('⚠️ No user data found');
                setLicenseStatus({
                    hasAccess: false,
                    license: 0,
                    isLicenseActive: false,
                    loading: false,
                    error: 'No user data found'
                });
                return;
            }

            const userData = JSON.parse(userDetailsString);
            
            // Staff users always have app access (project-level filtering happens in API)
            if (userData.role && userData.role !== 'admin') {
                console.log('✅ Staff user - app access granted (project filtering at API level)');
                setLicenseStatus({
                    hasAccess: true,
                    license: -1, // Treat as unlimited for staff at app level
                    isLicenseActive: true,
                    loading: false,
                });
                return;
            }

            // Get client ID for admin users
            let clientId = userData.clientId || userData._id;
            if (!clientId) {
                clientId = await getClientId();
            }
            if (!clientId) {
                console.warn('⚠️ No client ID found');
                setLicenseStatus({
                    hasAccess: false,
                    license: 0,
                    isLicenseActive: false,
                    loading: false,
                    error: 'No client ID found'
                });
                return;
            }

            console.log('🔍 Fetching license for admin client:', clientId);

            // Fetch client license data with skipCache
            const response = await axios.get(`${domain}/api/clients?id=${clientId}&skipCache=true`);
            
            if (response.data.success && response.data.data) {
                const client = response.data.data;
                const license = client.license !== undefined ? client.license : 0;
                const isLicenseActive = client.isLicenseActive !== undefined ? client.isLicenseActive : false;

                console.log('📊 Admin license status:', {
                    license,
                    isLicenseActive,
                    licenseExpiryDate: client.licenseExpiryDate
                });

                // Determine access for admin
                // -1 = Lifetime (always access)
                // 0 = Expired (no access)
                // >0 = Active (has access)
                const hasAccess = license === -1 || (license > 0 && isLicenseActive);

                if (!hasAccess) {
                    console.error('❌ Admin license expired - access denied');
                }

                setLicenseStatus({
                    hasAccess,
                    license,
                    isLicenseActive,
                    licenseExpiryDate: client.licenseExpiryDate,
                    loading: false,
                });
            } else {
                console.warn('⚠️ Failed to fetch license data');
                setLicenseStatus({
                    hasAccess: false,
                    license: 0,
                    isLicenseActive: false,
                    loading: false,
                    error: 'Failed to fetch license data'
                });
            }
        } catch (error: any) {
            console.error('❌ Error checking license:', error);
            setLicenseStatus({
                hasAccess: false,
                license: 0,
                isLicenseActive: false,
                loading: false,
                error: error.message || 'Failed to check license'
            });
        }
    };

    useEffect(() => {
        checkLicense();
    }, []);

    return {
        ...licenseStatus,
        recheckLicense: checkLicense,
    };
};
