/**
 * Script to add test notifications directly to the Xsite app's local storage
 * This simulates receiving notifications to test the display system
 */

const AsyncStorage = require('@react-native-async-storage/async-storage');

// Mock AsyncStorage for Node.js testing
const mockStorage = {};
const MockAsyncStorage = {
  getItem: async (key) => {
    return mockStorage[key] || null;
  },
  setItem: async (key, value) => {
    mockStorage[key] = value;
  },
  removeItem: async (key) => {
    delete mockStorage[key];
  }
};

async function addTestNotifications() {
  console.log('📱 Adding Test Notifications to Local Storage');
  console.log('==============================================');

  const testNotifications = [
    {
      id: 'test_1_' + Date.now(),
      title: '📥 Materials Imported',
      body: 'John Doe imported 25 materials: Cement, Steel and 1 more in Foundation Project',
      data: {
        activityId: 'test_activity_1',
        projectId: 'test_project_1',
        activityType: 'material_activity',
        category: 'material',
        action: 'imported',
        route: 'notification'
      },
      timestamp: new Date(),
      isRead: false,
      source: 'backend'
    },
    {
      id: 'test_2_' + Date.now(),
      title: '🔄 Materials Transferred',
      body: 'Jane Smith transferred 10 materials from Project A to Project B',
      data: {
        activityId: 'test_activity_2',
        projectId: 'test_project_2',
        activityType: 'material_activity',
        category: 'material',
        action: 'transferred',
        route: 'notification'
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isRead: false,
      source: 'push'
    },
    {
      id: 'test_3_' + Date.now(),
      title: '🔨 Materials Used',
      body: 'Mike Johnson used 15 materials: Concrete, Rebar in Construction Phase',
      data: {
        activityId: 'test_activity_3',
        projectId: 'test_project_3',
        activityType: 'material_activity',
        category: 'material',
        action: 'used',
        route: 'notification'
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      isRead: true,
      source: 'backend'
    },
    {
      id: 'test_4_' + Date.now(),
      title: '🏗️ Project Update',
      body: 'New project "Residential Complex" created by Admin User',
      data: {
        activityId: 'test_activity_4',
        projectId: 'test_project_4',
        activityType: 'project_created',
        category: 'project',
        action: 'create',
        route: 'notification'
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      isRead: false,
      source: 'backend'
    },
    {
      id: 'test_5_' + Date.now(),
      title: '👥 Staff Update',
      body: 'New staff member assigned to Downtown Office Project',
      data: {
        activityId: 'test_activity_5',
        projectId: 'test_project_5',
        activityType: 'staff_assigned',
        category: 'staff',
        action: 'assign',
        route: 'notification'
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      isRead: true,
      source: 'push'
    }
  ];

  try {
    // Store the test notifications
    await MockAsyncStorage.setItem('local_notifications', JSON.stringify(testNotifications));
    
    console.log('✅ Added', testNotifications.length, 'test notifications');
    console.log('📊 Notification summary:');
    
    testNotifications.forEach((notification, index) => {
      const timeAgo = Math.round((Date.now() - new Date(notification.timestamp).getTime()) / (1000 * 60));
      console.log(`   ${index + 1}. ${notification.title}`);
      console.log(`      ${notification.isRead ? '✅ Read' : '🔴 Unread'} | ${timeAgo}m ago | ${notification.source}`);
    });

    const unreadCount = testNotifications.filter(n => !n.isRead).length;
    console.log(`\n📈 Total: ${testNotifications.length} notifications (${unreadCount} unread)`);

    console.log('\n📱 Instructions for Xsite App:');
    console.log('==============================');
    console.log('1. Copy the following JSON to your app\'s AsyncStorage:');
    console.log('   Key: "local_notifications"');
    console.log('   Value: (see below)');
    console.log('\n📋 JSON Data:');
    console.log('```json');
    console.log(JSON.stringify(testNotifications, null, 2));
    console.log('```');

    console.log('\n🔧 Alternative: Use the NotificationManager in your app:');
    console.log('```javascript');
    console.log('const notificationManager = NotificationManager.getInstance();');
    console.log('');
    testNotifications.forEach((notification, index) => {
      console.log(`// Add notification ${index + 1}`);
      console.log(`await notificationManager.addNotification({`);
      console.log(`  title: "${notification.title}",`);
      console.log(`  body: "${notification.body}",`);
      console.log(`  data: ${JSON.stringify(notification.data)},`);
      console.log(`  isRead: ${notification.isRead},`);
      console.log(`  source: "${notification.source}"`);
      console.log(`});`);
      console.log('');
    });
    console.log('```');

    return testNotifications;

  } catch (error) {
    console.error('❌ Error adding test notifications:', error);
    return [];
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { addTestNotifications };
}

// Run if called directly
if (require.main === module) {
  addTestNotifications().catch(console.error);
}