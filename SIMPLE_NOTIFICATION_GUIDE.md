# 📱 Simple Notification System

## 🎯 **Purpose**

Simple notification system for project activities:
- **Staff actions** → **Notify Admins**: Material added, Usage added, Labor cost added
- **Admin actions** → **Notify Staff**: Project updates

## 🚀 **Quick Setup**

### **1. Add to Your App**

Replace the complex notification system with this simple one:

```typescript
// In your main app or component
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';

const { sendProjectNotification } = useSimpleNotifications();
```

### **2. Send Notifications**

#### **When Staff Adds Material:**
```typescript
await sendProjectNotification({
  projectId: 'your-project-id',
  activityType: 'material_added',
  staffName: 'John Doe',
  projectName: 'Building Construction',
  details: 'Added 50 bags of cement',
  recipientType: 'admins', // Notify admins
});
```

#### **When Staff Adds Usage:**
```typescript
await sendProjectNotification({
  projectId: 'your-project-id',
  activityType: 'usage_added',
  staffName: 'John Doe',
  projectName: 'Building Construction',
  details: 'Updated material usage for foundation',
  recipientType: 'admins', // Notify admins
});
```

#### **When Staff Adds Labor Cost:**
```typescript
await sendProjectNotification({
  projectId: 'your-project-id',
  activityType: 'labor_added',
  staffName: 'John Doe',
  projectName: 'Building Construction',
  details: 'Added labor cost: ₹5,000 for masonry',
  recipientType: 'admins', // Notify admins
});
```

#### **When Admin Updates Project:**
```typescript
await sendProjectNotification({
  projectId: 'your-project-id',
  activityType: 'admin_update',
  staffName: 'Admin Name',
  projectName: 'Building Construction',
  details: 'Updated project timeline and budget',
  recipientType: 'staff', // Notify staff
});
```

## 🧪 **Testing**

### **1. Add Test Component**

Add the test component to any screen:

```typescript
import SimpleNotificationTest from '@/components/SimpleNotificationTest';

// In your render
<SimpleNotificationTest />
```

### **2. Test All Scenarios**

The test component has buttons for:
- 📦 Material Added → Admins
- 📊 Usage Added → Admins  
- 👷 Labor Added → Admins
- ⚡ Admin Update → Staff
- 🧪 Local Test Notification

## 📁 **Files Created**

### **Frontend:**
- `services/SimpleNotificationService.ts` - Main service
- `hooks/useSimpleNotifications.ts` - React hook
- `components/SimpleNotificationTest.tsx` - Test component

### **Backend:**
- `api/simple-push-token/route.ts` - Token registration
- `api/send-project-notification/route.ts` - Send notifications

## 🔧 **Integration Examples**

### **In Material Add Form:**
```typescript
const handleAddMaterial = async (materialData) => {
  // Save material to database
  await saveMaterial(materialData);
  
  // Send notification to admins
  await sendProjectNotification({
    projectId: materialData.projectId,
    activityType: 'material_added',
    staffName: user.name,
    projectName: project.name,
    details: `Added ${materialData.quantity} ${materialData.name}`,
    recipientType: 'admins',
  });
};
```

### **In Usage Update Form:**
```typescript
const handleUpdateUsage = async (usageData) => {
  // Update usage in database
  await updateUsage(usageData);
  
  // Send notification to admins
  await sendProjectNotification({
    projectId: usageData.projectId,
    activityType: 'usage_added',
    staffName: user.name,
    projectName: project.name,
    details: `Updated usage for ${usageData.activity}`,
    recipientType: 'admins',
  });
};
```

### **In Labor Cost Form:**
```typescript
const handleAddLabor = async (laborData) => {
  // Save labor cost to database
  await saveLaborCost(laborData);
  
  // Send notification to admins
  await sendProjectNotification({
    projectId: laborData.projectId,
    activityType: 'labor_added',
    staffName: user.name,
    projectName: project.name,
    details: `Added labor cost: ₹${laborData.amount} for ${laborData.work}`,
    recipientType: 'admins',
  });
};
```

## ✅ **Benefits**

1. **Simple**: No complex security, just basic notifications
2. **Focused**: Only for your specific use case
3. **Easy**: One function call to send notifications
4. **Reliable**: Uses Expo's proven notification system
5. **Testable**: Built-in test component

## 🚀 **Next Steps**

1. **Test the system** using `SimpleNotificationTest` component
2. **Integrate** into your material/usage/labor forms
3. **Deploy** the backend APIs
4. **Remove** the complex security system files (optional)

This simple system will handle all your notification needs without the complexity!