// Configuration for notification system

import { domain } from "@/lib/domain";

// API Configuration
export const API_CONFIG = {
    // Replace with your actual domain
    baseUrl: `${domain}`,
    timeout: 10000, // 10 seconds
    headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer YOUR_TOKEN',
    },
};

// Notification refresh interval (in milliseconds)
export const REFRESH_INTERVAL = 30000; // 30 seconds

// Toast auto-hide duration (in milliseconds)
export const TOAST_DURATION = 3000; // 3 seconds// Section
// Update this with your actual section IDs and names
export const SECTION_NAMES: { [key: string]: string } = {
    '68fa9be31b727027e9aa6a02': 'Foundation',
    // Add more section mappings as needed
    // 'section_id_2': 'First Slab',
    // 'section_id_3': 'Second Floor',
};

// Project ID to Name mapping
// Update this with your actual project IDs and names
export const PROJECT_NAMES: { [key: string]: string } = {
    '68cfe34ae77c956698d26a00': 'Construction Project',
};

// Section IDs to fetch material requests from
// Update this array with the section IDs you want to monitor
export const MONITORED_SECTIONS = [
    '68fa9be31b727027e9aa6a02', // Foundation
    // Add more section IDs as needed
];