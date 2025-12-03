# Xsite - Quick Reference Guide

## Application Summary

**Xsite** is a construction site management mobile app built with React Native/Expo for managing projects, materials, budgets, staff, and activities.

---

## Key Routes

### Main Navigation (Tabs)

- `/(tabs)/` - Projects list
- `/(tabs)/dashboard` - Budget analytics
- `/(tabs)/add-project` - Project management
- `/(tabs)/staff` - Staff directory
- `/(tabs)/profile` - User profile

### Detail Routes

- `/login` - Authentication
- `/manage_project/[id]` - Section management
- `/details` - Material management
- `/notification` - Activity feed
- `/analytics/*` - Budget analytics (3 levels)

---

## Data Hierarchy

```
Client
  └── Projects
       ├── Sections (Buildings/Rowhouses/Other)
       │    └── Mini Sections
       │         └── Materials (Available/Used)
       └── Staff Assignments
```

---

## Core APIs (Base: https://real-estate-apis.vercel.app)

### Authentication

- `POST /api/findUser` - Check user existence
- `POST /api/otp` - Send OTP
- `POST /api/password` - Set password
- `POST /api/login` - User login
- `POST /api/forget-password` - Reset password
- `GET /api/{userType}?email={email}` - Get user details

### Projects

- `GET /api/project?clientId={id}` - List projects
- `POST /api/project` - Create project
- `GET /api/project/{id}` - Get project

### Sections

- `POST /api/building` - Create building
- `PUT /api/building?id={id}` - Update building
- `DELETE /api/building?projectId={pid}&sectionId={sid}` - Delete
- `POST /api/rowHouse` - Create rowhouse
- `PUT /api/rowHouse?rh={id}` - Update rowhouse
- `DELETE /api/rowHouse?projectId={pid}&sectionId={sid}` - Delete
- `POST /api/otherSection` - Create other section
- `PUT /api/otherSection?rh={id}` - Update other
- `DELETE /api/otherSection?projectId={pid}&sectionId={sid}` - Delete

### Mini Sections

- `GET /api/mini-section?sectionId={id}` - List mini sections
- `POST /api/mini-section` - Create mini section
- `PUT /api/mini-section?id={id}` - Update mini section
- `DELETE /api/mini-section?id={id}` - Delete mini section

### Materials

- `GET /api/material?projectId={pid}&clientId={cid}` - Get available
- `POST /api/material` - Import materials
- `GET /api/material-usage?projectId={pid}&clientId={cid}` - Get used
- `POST /api/material-usage` - Use materials

### Staff

- `GET /api/staff` - List staff
- `POST /api/staff` - Create staff

### Activities

- `GET /api/activity?clientId={id}&limit=50` - Get activities
- `POST /api/activity` - Log activity
- `GET /api/materialActivity?clientId={id}&limit=50` - Get material activities
- `POST /api/materialActivity` - Log material activity

### Client

- `GET /api/client?id={id}` - Get client details

---

## Key Data Models

### User

```typescript
{
  _id, clientId, name, email, phone, companyName, userType;
}
```

### Project

```typescript
{ _id, name, address, clientId, assignedStaff[], section[], MaterialAvailable[], MaterialUsed[] }
```

### Section

```typescript
{ _id, sectionId, name, type: 'Buildings'|'rowhouse'|'other', projectId }
```

### Material

```typescript
{
  _id, name, unit, qnt, cost, specs, sectionId, miniSectionId;
}
```

### Staff

```typescript
{ _id, firstName, lastName, email, phoneNumber, role, clientId, assignedProjects[] }
```

---

## Common Patterns

### Fetch Data

```typescript
const res = await axios.get(`${domain}/api/endpoint?param=${value}`);
const data = res.data;
```

### Create Resource

```typescript
const res = await axios.post(`${domain}/api/endpoint`, payload);
```

### Update Resource

```typescript
const res = await axios.put(`${domain}/api/endpoint?id=${id}`, payload);
```

### Delete Resource

```typescript
const res = await axios.delete(`${domain}/api/endpoint?id=${id}`);
```

### Get User Session

```typescript
const userString = await AsyncStorage.getItem("user");
const user = JSON.parse(userString);
const clientId = user.clientId;
```

---

## Responsive Utilities

```typescript
import { wp, hp, fs, sp, br, iconSize } from "@/utils/responsive";

// Usage
width: wp(50); // 50% of screen width
height: hp(30); // 30% of screen height
fontSize: fs(16); // Responsive font size
padding: sp(10); // Responsive spacing
borderRadius: br(8); // Responsive border radius
size: iconSize(24); // Responsive icon size
```

---

## Activity Logging

```typescript
import { logSectionCreated, logMaterialImported } from "@/utils/activityLogger";

// Log section creation
logSectionCreated(projectId, projectName, sectionId, sectionName, sectionType);

// Log material import
logMaterialImported(projectId, projectName, sectionId, sectionName, materials);
```

---

## Error Handling

```typescript
try {
  const res = await axios.get(url);
  // Success
} catch (error: any) {
  if (error.response?.status === 404) {
    toast.warning("Not found");
  } else {
    toast.error(error.message || "Error occurred");
  }
}
```

---

## Performance Tips

1. **Debounce API calls** - Use refs to prevent rapid calls
2. **Cancel requests** - Use AbortController
3. **Optimize re-renders** - Use React.memo, useMemo, useCallback
4. **Lazy load** - Load data on demand
5. **Cache data** - Store frequently accessed data

---

## Development Commands

```bash
npm start              # Start dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run lint           # Run linter
npm run build:preview  # Build preview
```

---

## Common Issues & Fixes

| Issue            | Solution                              |
| ---------------- | ------------------------------------- |
| Login fails      | Clear AsyncStorage, check credentials |
| Data not loading | Pull to refresh, check clientId       |
| Navigation stuck | Restart app, check auth state         |
| Build fails      | Clear cache: `expo start -c`          |

---

**Quick Tip**: Use pull-to-refresh on all list screens to reload data!
