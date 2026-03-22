import { useState, useEffect } from 'react';
import axios from 'axios';
import { domain } from '@/lib/domain';
import { getClientId } from '@/functions/clientId';

export interface UnifiedActivity {
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

export const useUnifiedActivities = () => {
  const [activities, setActivities] = useState<UnifiedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const clientId = await getClientId();
      if (!clientId) {
        throw new Error('Client ID not found');
      }

      console.log('🔍 Fetching unified activities for client:', clientId);

      // Fetch both material activities and completion activities in parallel
      const [materialResponse, completionResponse] = await Promise.allSettled([
        axios.get(`${domain}/api/(Xsite)/materialActivity?clientId=${clientId}`),
        axios.get(`${domain}/api/activity?clientId=${clientId}`)
      ]);

      const unifiedActivities: UnifiedActivity[] = [];

      // Process material activities
      if (materialResponse.status === 'fulfilled') {
        const materialData = materialResponse.value.data;
        console.log('✅ Material activities fetched:', materialData.data?.activities?.length || 0);
        
        if (materialData.success && materialData.data?.activities) {
          materialData.data.activities.forEach((activity: any) => {
            unifiedActivities.push({
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
              action: activity.activity, // 'imported', 'used', 'transferred'
              data: {
                materials: activity.materials,
                materialCount: activity.materials?.length || 0,
                totalCost: activity.materials?.reduce((sum: number, m: any) => sum + (m.totalCost || m.cost || 0), 0) || 0
              }
            });
          });
        }
      } else {
        console.warn('❌ Failed to fetch material activities:', materialResponse.reason);
      }

      // Process completion activities
      if (completionResponse.status === 'fulfilled') {
        const completionData = completionResponse.value.data;
        console.log('✅ Completion activities fetched:', completionData.data?.activities?.length || 0);
        
        if (completionData.success && completionData.data?.activities) {
          completionData.data.activities.forEach((activity: any) => {
            // Only include completion-related activities
            if (activity.category === 'section' || activity.category === 'mini_section' || activity.category === 'completion') {
              unifiedActivities.push({
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
                action: activity.action, // 'complete', 'reopen'
                data: {
                  activityType: activity.activityType,
                  metadata: activity.metadata
                }
              });
            }
          });
        }
      } else {
        console.warn('❌ Failed to fetch completion activities:', completionResponse.reason);
      }

      // Sort all activities by timestamp (newest first)
      unifiedActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      console.log('🎉 Unified activities processed:', unifiedActivities.length);
      setActivities(unifiedActivities);

    } catch (fetchError: any) {
      console.error('❌ Error fetching unified activities:', fetchError);
      setError(fetchError.message || 'Failed to fetch activities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const refresh = () => {
    fetchActivities();
  };

  return {
    activities,
    isLoading,
    error,
    refresh,
  };
};

// Helper functions to generate titles and descriptions
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
      return `${activity.user.fullName} imported ${materialCount} material${materialCount > 1 ? 's' : ''}${costText} to ${location}`;
    case 'used':
      return `${activity.user.fullName} used ${materialCount} material${materialCount > 1 ? 's' : ''}${costText} in ${location}`;
    case 'transferred':
      return `${activity.user.fullName} transferred ${materialCount} material${materialCount > 1 ? 's' : ''}${costText} from ${location}`;
    default:
      return `${activity.user.fullName} performed material activity in ${location}`;
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

export default useUnifiedActivities;