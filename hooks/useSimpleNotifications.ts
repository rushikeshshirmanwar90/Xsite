import { useEffect, useState } from 'react';
import SimpleNotificationService from '@/services/SimpleNotificationService';
import { useAuth } from '@/contexts/AuthContext';

// Helper function to generate notification content based on activity type
const generateNotificationContent = (activityData: any) => {
  const { activityType, staffName, projectName, sectionName, miniSectionName, materials, transferDetails, message } = activityData;
  
  let title = '';
  let enhancedMessage = '';
  
  switch (activityType) {
    // Project Activities
    case 'project_created':
      title = `New Project Created`;
      enhancedMessage = `${staffName} created project "${projectName}"`;
      break;
    case 'project_updated':
      title = `Project Updated`;
      enhancedMessage = `${staffName} updated project "${projectName}"${message ? `: ${message}` : ''}`;
      break;
    case 'project_deleted':
      title = `Project Deleted`;
      enhancedMessage = `${staffName} deleted project "${projectName}"`;
      break;
      
    // Section Activities
    case 'section_created':
      title = `New Section Created`;
      enhancedMessage = `${staffName} created section "${sectionName}" in ${projectName}`;
      break;
    case 'section_updated':
      title = `Section Updated`;
      enhancedMessage = `${staffName} updated section "${sectionName}" in ${projectName}`;
      break;
    case 'section_deleted':
      title = `Section Deleted`;
      enhancedMessage = `${staffName} deleted section "${sectionName}" from ${projectName}`;
      break;
      
    // Mini-Section Activities
    case 'mini_section_created':
      title = `New Mini-Section Created`;
      enhancedMessage = `${staffName} created mini-section "${miniSectionName}" in ${sectionName}`;
      break;
    case 'mini_section_updated':
      title = `Mini-Section Updated`;
      enhancedMessage = `${staffName} updated mini-section "${miniSectionName}" in ${sectionName}`;
      break;
    case 'mini_section_deleted':
      title = `Mini-Section Deleted`;
      enhancedMessage = `${staffName} deleted mini-section "${miniSectionName}" from ${sectionName}`;
      break;
      
    // Staff Activities
    case 'staff_added':
      title = `New Staff Added`;
      enhancedMessage = `${staffName} added new staff member to ${projectName}`;
      break;
    case 'staff_updated':
      title = `Staff Updated`;
      enhancedMessage = `${staffName} updated staff information in ${projectName}`;
      break;
    case 'staff_removed':
      title = `Staff Removed`;
      enhancedMessage = `${staffName} removed staff member from ${projectName}`;
      break;
      
    // Labor Activities
    case 'labor_added':
      title = `Labor Added`;
      enhancedMessage = `${staffName} added labor entry in ${projectName}`;
      break;
      
    // Material Activities
    case 'material_added':
    case 'material_imported':
      title = `Materials Imported`;
      if (materials && materials.length > 0) {
        const materialNames = materials.slice(0, 2).map((m: any) => m.name).join(', ');
        const totalCost = materials.reduce((sum: number, m: any) => sum + (m.cost || 0), 0);
        enhancedMessage = `${staffName} imported ${materials.length} material${materials.length > 1 ? 's' : ''} (${materialNames}${materials.length > 2 ? '...' : ''}) to ${projectName}`;
        if (totalCost > 0) {
          enhancedMessage += ` - ₹${totalCost.toLocaleString('en-IN')}`;
        }
      } else {
        enhancedMessage = `${staffName} imported materials to ${projectName}`;
      }
      break;
      
    case 'usage_added':
    case 'material_used':
      title = `Materials Used`;
      if (materials && materials.length > 0) {
        const materialNames = materials.slice(0, 2).map((m: any) => m.name).join(', ');
        enhancedMessage = `${staffName} used ${materials.length} material${materials.length > 1 ? 's' : ''} (${materialNames}${materials.length > 2 ? '...' : ''}) in ${projectName}`;
      } else {
        enhancedMessage = `${staffName} used materials in ${projectName}`;
      }
      break;
      
    case 'material_transferred':
      title = `Materials Transferred`;
      if (transferDetails) {
        enhancedMessage = `${staffName} transferred materials from ${transferDetails.fromProject.name} to ${transferDetails.toProject.name}`;
      } else {
        enhancedMessage = `${staffName} transferred materials between projects`;
      }
      break;
      
    // Admin Updates
    case 'admin_update':
      title = `Admin Update`;
      enhancedMessage = `${staffName} made administrative changes${projectName ? ` in ${projectName}` : ''}`;
      break;
      
    // Default fallback
    default:
      title = `Activity Update`;
      enhancedMessage = activityData.details || `${staffName} performed an activity${projectName ? ` in ${projectName}` : ''}`;
      break;
  }
  
  // Add custom message if provided
  if (message && !enhancedMessage.includes(message)) {
    enhancedMessage += message ? ` - ${message}` : '';
  }
  
  return {
    title,
    message: enhancedMessage
  };
};

export const useSimpleNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  
  const notificationService = SimpleNotificationService.getInstance();

  useEffect(() => {
    // Only initialize when user is authenticated and available
    if (isAuthenticated && user) {
      console.log('🔔 User authenticated, initializing notifications...');
      initializeNotifications();
    } else {
      console.log('🔔 User not authenticated, skipping notification initialization');
      setIsLoading(false);
      setIsInitialized(false);
    }
  }, [user, isAuthenticated]);

  const initializeNotifications = async () => {
    if (!user || !isAuthenticated) {
      console.log('❌ No user or not authenticated, cannot initialize notifications');
      setIsLoading(false);
      setIsInitialized(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔔 Starting notification initialization for user:', {
        userId: user._id,
        userType: user.role || user.userType,
        email: user.email,
        hasClients: !!user.clients?.length,
      });
      
      // Initialize the service
      const initialized = await notificationService.initialize();
      console.log('🔔 Service initialization result:', initialized);
      
      if (initialized) {
        // Register token with backend
        console.log('🔔 Registering token with user data...');
        const registered = await notificationService.registerToken(user);
        console.log('🔔 Token registration result:', registered);
        setIsInitialized(registered);
        
        if (registered) {
          console.log('✅ Notifications fully initialized and ready');
        } else {
          console.log('⚠️ Token registration failed, notifications may not work');
        }
      } else {
        console.log('⚠️ Service initialization failed');
        setIsInitialized(false);
      }
      
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  };

  const sendProjectNotification = async (activityData: {
    projectId?: string;
    clientId?: string; // Add clientId as a valid field
    activityType: 'material_added' | 'usage_added' | 'labor_added' | 'admin_update' | 
                  'project_created' | 'project_updated' | 'project_deleted' |
                  'section_created' | 'section_updated' | 'section_deleted' |
                  'mini_section_created' | 'mini_section_updated' | 'mini_section_deleted' |
                  'staff_added' | 'staff_updated' | 'staff_removed' |
                  'material_imported' | 'material_used' | 'material_transferred';
    staffName: string;
    projectName?: string;
    sectionName?: string;
    miniSectionName?: string;
    details: string;
    staffId?: string; // ID of the user performing the action
    // Additional fields for different activity types
    category?: 'project' | 'section' | 'mini_section' | 'staff' | 'labor' | 'material';
    materials?: Array<{
      name: string;
      unit: string;
      qnt: number;
      cost: number;
    }>;
    transferDetails?: {
      fromProject: { id: string; name: string };
      toProject: { id: string; name: string };
    };
    message?: string;
  }) => {
    // Validate user role before sending notification
    if (!user || !isAuthenticated) {
      console.log('❌ User not authenticated, cannot send notification');
      return false;
    }

    // Determine recipient type based on business logic:
    // - Staff activities should notify only admins of the client
    // - Admin activities should ALWAYS notify other admins of the same client
    const userRole = user.role || user.userType;
    let recipientType: 'admins' | 'staff';
    
    console.log('🔍 User role analysis:', {
      userId: user._id,
      userRole: userRole,
      userRoleField: user.role,
      userTypeField: user.userType,
      isStaff: userRole === 'staff',
      isAdmin: userRole === 'admin' || userRole === 'client',
    });
    
    if (userRole === 'staff') {
      // Staff activities should only notify admins of the client
      recipientType = 'admins';
      console.log('🔔 Staff activity detected - notifications will go to admins only');
      console.log('🎯 Expected behavior: Staff should NOT receive notifications, only admins should');
    } else if (userRole === 'admin' || userRole === 'client') {
      // Admin activities should ALWAYS notify other admins of the same client
      recipientType = 'admins';
      console.log('🔔 Admin activity detected - notifications will go to other admins of the same client');
      console.log('🎯 Expected behavior: Performing admin should NOT receive notification, other admins should');
    } else {
      // Default fallback
      recipientType = 'admins';
      console.log('⚠️ Unknown user role, defaulting to notify admins only');
    }

    // Generate enhanced notification title and message based on activity type
    const notificationContent = generateNotificationContent(activityData);

    const enhancedActivityData = {
      ...activityData,
      recipientType,
      performerRole: userRole, // Add performer role for backend validation
      performerId: user._id, // Add performer ID to prevent self-notification
      // Override details with enhanced message if generated
      details: notificationContent.message || activityData.details,
      title: notificationContent.title,
      // ✅ Ensure clientId is passed through properly
      clientId: activityData.clientId,
    };

    console.log('📤 Sending notification with enhanced data:', {
      projectId: enhancedActivityData.projectId,
      clientId: enhancedActivityData.clientId, // Log clientId
      activityType: enhancedActivityData.activityType,
      recipientType: enhancedActivityData.recipientType,
      performerRole: enhancedActivityData.performerRole,
      performerId: enhancedActivityData.performerId,
      staffId: enhancedActivityData.staffId,
      note: 'Backend will use clientId if provided, otherwise get from project',
      isInitialized,
    });

    if (!isInitialized) {
      console.log('⚠️ Notifications not initialized, attempting to reinitialize...');
      await initializeNotifications();
      
      if (!isInitialized) {
        console.log('❌ Could not initialize notifications, sending will likely fail');
      }
    }

    return await notificationService.sendProjectNotification(enhancedActivityData);
  };

  const scheduleTestNotification = async (title: string, body: string) => {
    return await notificationService.scheduleLocalNotification(title, body);
  };

  // Convenience methods for different activity types
  const sendActivityNotification = async (activityType: string, activityDetails: {
    staffName: string;
    projectName?: string;
    sectionName?: string;
    miniSectionName?: string;
    details: string;
    projectId?: string;
    clientId?: string; // Add clientId support
    staffId?: string;
    category?: 'project' | 'section' | 'mini_section' | 'staff' | 'labor' | 'material';
    materials?: Array<{
      name: string;
      unit: string;
      qnt: number;
      cost: number;
    }>;
    transferDetails?: {
      fromProject: { id: string; name: string };
      toProject: { id: string; name: string };
    };
    message?: string;
  }) => {
    const validActivityTypes = [
      'material_added', 'usage_added', 'labor_added', 'admin_update',
      'project_created', 'project_updated', 'project_deleted',
      'section_created', 'section_updated', 'section_deleted',
      'mini_section_created', 'mini_section_updated', 'mini_section_deleted',
      'staff_added', 'staff_updated', 'staff_removed',
      'material_imported', 'material_used', 'material_transferred'
    ];

    if (!validActivityTypes.includes(activityType)) {
      console.warn(`⚠️ Unknown activity type: ${activityType}. Using default handling.`);
    }

    return await sendProjectNotification({
      activityType: activityType as any,
      ...activityDetails
    });
  };

  return {
    isInitialized,
    isLoading,
    sendProjectNotification,
    sendActivityNotification, // New convenience method
    scheduleTestNotification,
    reinitialize: initializeNotifications,
  };
};