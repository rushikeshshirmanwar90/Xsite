# Material Activity Notifications - Implementation Guide

## What's Been Added

I've created a complete notification system to display material activities (imported/used) from your external API.

## Files Created

### 1. `components/notifications/MaterialActivityNotifications.tsx`
A full-featured notification modal component that:
- Fetches material activities from `{domain}/api/materialActivity`
- Displays activities in a beautiful card-based UI
- Shows user info, materials, quantities, costs, and messages
- Includes filter tabs (All, Imported, Used)
- Has pull-to-refresh functionality
- Shows relative timestamps (e.g., "2h ago", "3d ago")
- Handles loading and empty states

## Integration in details.tsx

The notification button has been added to your details page:

```tsx
// New button appears below the header
<TouchableOpacity onPress={() => setShowNotifications(true)}>
  <Ionicons name="notifications" size={20} color="#3B82F6" />
  <Text>Activity Log</Text>
</TouchableOpacity>
```

## Features

### 1. **Filter Tabs**
- **All**: Shows all activities
- **Imported**: Shows only imported materials
- **Used**: Shows only used materials

### 2. **Activity Cards**
Each card displays:
- Activity type icon (import/use)
- User who performed the action
- Timestamp (relative time)
- List of materials with quantities
- Total cost
- Optional message

### 3. **Pull to Refresh**
Users can pull down to refresh the activity list

### 4. **Automatic Filtering**
- If `projectId` is provided, shows only that project's activities
- Otherwise shows all activities for the client

## API Integration

The component calls your external API:

```typescript
GET {domain}/api/materialActivity?clientId={id}&projectId={id}&activity={type}
```

### Query Parameters:
- `clientId` (required): Fetched from AsyncStorage
- `projectId` (optional): Filters to specific project
- `activity` (optional): 'imported' or 'used'

### Expected Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "user": {
        "userId": "...",
        "fullName": "John Doe"
      },
      "clientId": "...",
      "projectId": "...",
      "materials": [
        {
          "_id": "...",
          "name": "Cement",
          "unit": "bags",
          "qnt": 50,
          "cost": 7500,
          "specs": { "brand": "UltraTech" }
        }
      ],
      "message": "For foundation work",
      "activity": "imported",
      "createdAt": "2025-11-19T14:36:29.634Z",
      "updatedAt": "2025-11-19T14:36:29.634Z"
    }
  ]
}
```

## Usage

### In details.tsx:
```tsx
// State
const [showNotifications, setShowNotifications] = useState(false);

// Button to open
<TouchableOpacity onPress={() => setShowNotifications(true)}>
  <Text>Activity Log</Text>
</TouchableOpacity>

// Modal component
<MaterialActivityNotifications
  visible={showNotifications}
  onClose={() => setShowNotifications(false)}
  projectId={projectId} // Optional: filter to specific project
/>
```

### In other components:
```tsx
import MaterialActivityNotifications from '@/components/notifications/MaterialActivityNotifications';

// For all activities
<MaterialActivityNotifications
  visible={visible}
  onClose={onClose}
/>

// For specific project
<MaterialActivityNotifications
  visible={visible}
  onClose={onClose}
  projectId="691dd517e36235d711ae1c2e"
/>

// With custom clientId
<MaterialActivityNotifications
  visible={visible}
  onClose={onClose}
  clientId="68cdd5168734ab8f0735aaf5"
  projectId="691dd517e36235d711ae1c2e"
/>
```

## Styling

The component uses a modern, clean design with:
- Card-based layout
- Color-coded activity types (green for import, red for use)
- Smooth animations
- Responsive design
- Shadow effects
- Icon badges

## Error Handling

The component handles:
- Network errors
- Missing clientId
- Empty states
- Loading states
- API errors with toast notifications

## Customization

You can easily customize:

### Colors:
```typescript
const getActivityColor = (activity: 'imported' | 'used') => {
  return activity === 'imported' ? '#10B981' : '#EF4444';
};
```

### Date Format:
```typescript
const formatDate = (dateString: string) => {
  // Customize the date formatting logic
};
```

### Card Layout:
Modify the `renderActivityItem` function to change how cards are displayed.

## Testing

To test the notification system:

1. **Import some materials** using the "Add Material" button
2. **Use some materials** using the "Add Usage" button
3. **Click "Activity Log"** button to see the notifications
4. **Try the filters** to see imported vs used materials
5. **Pull down** to refresh the list

## Future Enhancements

Possible improvements:
- Real-time updates using WebSocket
- Badge showing unread count
- Mark as read functionality
- Delete activity option
- Export activity log
- Date range filtering
- Search functionality

## Troubleshooting

### No activities showing:
- Check if clientId is correctly stored in AsyncStorage
- Verify API endpoint is correct
- Check network logs for API errors

### Activities not refreshing:
- Pull down to manually refresh
- Check if the API is returning updated data

### Wrong activities showing:
- Verify projectId is being passed correctly
- Check filter selection (All/Imported/Used)
