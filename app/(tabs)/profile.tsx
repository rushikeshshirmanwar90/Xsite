import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';


// Main Profile Component
const CompanyProfile: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'projects'>('overview');

    const { logout } = useAuth();


    useEffect(() => {
        const fetchData = async () => {
            const userDetailsString = await AsyncStorage.getItem("user");
            // console.log("********************************************")
            // const data = JSON.parse(userDetailsString || '{}');
            // console.log(data.clientId);
            // console.log("********************************************")
        }

        fetchData()

    }, [])


    const handleLogout = async () => {
        try {
            await logout();
            // Navigation will be handled automatically by the AuthContext and layout
        } catch (error) {
            console.error('Logout error:', error);
        }
    };



    return (
        <SafeAreaView>
            <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />


            <TouchableOpacity onPress={handleLogout} >
                <Text>Logout</Text>
            </TouchableOpacity>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({

});

export default CompanyProfile;