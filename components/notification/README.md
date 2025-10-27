# Notification System

This notification system integrates with your material request API to display pending material requests that require approval.

## Features

- **Material Request Integration**: Fetches pending material requests from your API
- **Approval/Rejection**: Allows approving or rejecting material requests directly from notifications
- **Swipe to Delete**: Swipe left to reveal delete button (prevents accidental deletions)
- **Real-time Updates**: Automatically fetches and displays new material requests
- **Modular Components**: Clean, reusable component architecture

## Setup

### 1. Configure API Settings

Update `components/notification/config.ts`:

```typescript
export const API_CONFIG = {
    baseUrl: 'https://your-domain.com', // Replace with your actual domain
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
        // 'Authorization': 'Bearer YOUR_TOKEN',
    },
};
```

### 2. Configure Section and Project Mappings

Update the mappings in `config.ts`:

```typescript
export const SECTION_NAMES: { [key: string]: string } = {
    '68fa9be31b727027e9aa6a02': 'Foundation',
    'your_section_id_2': 'First Slab',
    'your_section_id_3': 'Second Floor',
    // Add more sections...
};

export const PROJECT_NAMES: { [key: string]: string } = {
    '68cfe34ae77c956698d26a00': 'Construction Project',
    'your_project_id_2': 'Residential Complex',
    // Add more projects...
};
```

### 3. Configure Monitored Sections

Update which sections to monitor for material requests:

```typescript
export const MONITORED_SECTIONS = [
    '68fa9be31b727027e9aa6a02', // Foundation
    'your_section_id_2',         // First Slab
    // Add more section IDs to monitor...
];
```

## API Integration

### Expected API Response Format

Your API should return data in this format:

```json
{
    "success": true,
    "message": "Data fetched successfully",
    "data": [
        {
            "_id": "68fdd2fcbe475aeaef2d3fe3",
            "clientId": "68cdd5168734ab8f0735aaf5",
            "projectId": "68cfe34ae77c956698d26a00",
            "mainSectionId": "68e01477e5e027dfe3d6ce75",
            "sectionId": "68fa9be31b727027e9aa6a02",
            "materials": [
                {
                    "name": "Cement",
                    "unit": "bags",
                    "cost": 0,
                    "_id": "68fdd2fcbe475aeaef2d3fe4"
                }
            ],
            "status": "pending",
            "message": "Additional materials needed",
            "__v": 0
        }
    ]
}
```

### Required API Endpoints

1. **Fetch Material Requests**: `GET /api/request-material?sectionId={sectionId}`
2. **Approve Request**: `POST /api/approve-material-request` (body: `{requestId, status: 'approved'}`)
3. **Reject Request**: `POST /api/reject-material-request` (body: `{requestId, status: 'rejected'}`)

## Component Structure

```
components/notification/
├── ApprovalButtons.tsx          # Approve/Reject buttons
├── EmptyState.tsx              # Empty state component
├── LoadingState.tsx            # Loading state component
├── NotificationBanners.tsx     # Info banners
├── NotificationHeader.tsx      # Header with back button
├── SwipeableNotificationItem.tsx # Main notification item
├── Toast.tsx                   # Toast notifications
├── api.ts                      # API integration
├── config.ts                   # Configuration
├── data.ts                     # Dummy data
├── types.ts                    # TypeScript types
├── utils.ts                    # Utility functions
└── index.ts                    # Exports
```

## Usage

The notification screen automatically:

1. Fetches material requests from all monitored sections on load
2. Displays them as notifications with approval buttons
3. Allows users to approve/reject requests
4. Shows toast feedback for actions
5. Supports swipe-to-delete functionality

## Customization

### Adding New Notification Types

1. Update the `Notification` type in `types.ts`
2. Add icon mapping in `utils.ts` (`getNotificationIcon`)
3. Update the notification item component if needed

### Modifying API Calls

Update the functions in `api.ts`:
- `fetchMaterialRequests()`
- `approveMaterialRequest()`
- `rejectMaterialRequest()`

### Styling

Each component has its own styles. Modify the `StyleSheet.create()` calls in individual components to customize appearance.

## Error Handling

The system includes comprehensive error handling:
- Network timeouts
- API errors
- Malformed responses
- Fallback to dummy data if API fails

## Performance

- Uses React.memo for component optimization
- Implements proper cleanup for intervals
- Includes loading states for better UX
- Efficient re-rendering with proper dependency arrays