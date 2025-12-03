# Xsite - Construction Management Application

## Table of Contents

1. [Application Overview](#application-overview)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Route Structure](#route-structure)
5. [Data Models](#data-models)
6. [API Endpoints](#api-endpoints)
7. [Data Flow](#data-flow)
8. [Authentication Flow](#authentication-flow)
9. [Key Features](#key-features)

---

## Application Overview

**Xsite** is a comprehensive construction site management mobile application built with React Native and Expo. It enables construction companies to manage projects, track materials, monitor budgets, manage staff, and analyze project performance in real-time.

### Core Capabilities

- Multi-project management with hierarchical structure
- Material inventory tracking (imported & used)
- Budget analysis and visualization
- Staff management and assignment
- Activity logging and notifications
- Real-time data synchronization
- Responsive design for tablets and phones

---

## Technology Stack

### Frontend

- **Framework**: React Native 0.81.4
- **Navigation**: Expo Router 6.0.3
- **UI Components**: React Native core components
- **Icons**: @expo/vector-icons (Ionicons)
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Storage**: AsyncStorage
- **Animations**: React Native Animated API
- **Gestures**: react-native-gesture-handler
- **Charts**: Custom PieChart and BarChart components

### Backend Integration

- **HTTP Client**: Axios 1.12.2
- **API Base URL**: https://real-estate-apis.vercel.app
- **Authentication**: Email/Password with OTP verification

### Development Tools

- **Language**: TypeScript 5.9.2
- **Build Tool**: EAS Build
- **Linting**: ESLint with Expo config

---

## Application Architecture

### Project Structure

```
app/
├── (tabs)/              # Main tab navigation screens
│   ├── index.tsx        # Home/Projects list
│   ├── dashboard.tsx    # Analytics dashboard
│   ├── add-project.tsx  # Project management
│   ├── staff.tsx        # Staff management
│   └── profile.tsx      # User profile
├── manage_project/      # Project detail management
│   └── [id].tsx         # Dynamic project sections
├── analytics/           # Analytics screens
│   ├── project-sections-analytics.tsx
│   ├── mini-sections-analytics.tsx
│   └── materials-analytics.tsx
├── details.tsx          # Material management
├── notification.tsx     # Activity feed
├── login.tsx            # Authentication
└── _layout.tsx          # Root layout with auth guard

contexts/
└── AuthContext.tsx      # Global authentication state

functions/
├── login.ts             # Authentication APIs
├── project.ts           # Project APIs
├── staff.ts             # Staff APIs
├── details.ts           # Section/Material APIs
└── clientId.tsx         # User session helpers

types/
├── project.ts           # Project data models
├── staff.ts             # Staff data models
├── details.ts           # Material/Section models
└── analytics.ts         # Analytics models

components/
├── details/             # Material management components
├── staff/               # Staff management components
├── notifications/       # Activity notification components
├── PieChart.tsx         # Budget visualization
└── BarChart.tsx         # Section comparison
```

### State Management Pattern

- **Local State**: Component-level useState for UI state
- **Global State**: AuthContext for authentication
- **Persistent State**: AsyncStorage for user session
- **Server State**: Direct API calls with loading states

---

## Route Structure

### Authentication Routes

| Route    | Component | Purpose                                     | Protected |
| -------- | --------- | ------------------------------------------- | --------- |
| `/login` | login.tsx | User authentication with email/OTP/password | No        |

### Main Tab Routes (Protected)

| Route                 | Component       | Purpose                   | Icon          |
| --------------------- | --------------- | ------------------------- | ------------- |
| `/(tabs)/`            | index.tsx       | Projects list view        | home          |
| `/(tabs)/dashboard`   | dashboard.tsx   | Budget analytics & charts | pulse         |
| `/(tabs)/add-project` | add-project.tsx | Create/manage projects    | add           |
| `/(tabs)/staff`       | staff.tsx       | Staff directory           | people        |
| `/(tabs)/profile`     | profile.tsx     | User profile & settings   | person-circle |

### Dynamic Routes (Protected)

| Route                  | Component            | Purpose                 | Params                                         |
| ---------------------- | -------------------- | ----------------------- | ---------------------------------------------- |
| `/manage_project/[id]` | [id].tsx             | Manage project sections | id, name, sectionData                          |
| `/project-sections`    | project-sections.tsx | View project sections   | id, name, sectionData                          |
| `/details`             | details.tsx          | Material management     | projectId, projectName, sectionId, sectionName |
| `/notification`        | notification.tsx     | Activity feed           | -                                              |

### Analytics Routes (Protected)

| Route                                   | Component                      | Purpose                       |
| --------------------------------------- | ------------------------------ | ----------------------------- |
| `/analytics/project-sections-analytics` | project-sections-analytics.tsx | Section-level budget analysis |
| `/analytics/mini-sections-analytics`    | mini-sections-analytics.tsx    | Sub-section analytics         |
| `/analytics/materials-analytics`        | materials-analytics.tsx        | Material cost breakdown       |

### Navigation Flow

```
Login → (tabs) → Dashboard/Projects
              ↓
         Add Project → Manage Sections → Material Details
              ↓
         Analytics → Section Analytics → Material Analytics
              ↓
         Notifications (Activity Feed)
```

---

## Data Models

### User/Client Model

```typescript
interface User {
  _id: string;
  clientId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  gstNumber?: string;
  password: string; // Hashed
  verified: boolean;
  userType: "client" | "staff" | "admin";
}
```

### Project Model

```typescript
interface Project {
  _id: string;
  name: string;
  address: string;
  description: string;
  clientId: string;
  assignedStaff: StaffMembers[];
  budget?: number;
  spent?: number;
  progress?: number;
  section?: ProjectSection[];
  MaterialAvailable?: MaterialItem[];
  MaterialUsed?: MaterialItem[];
  createdAt: string;
  updatedAt: string;
}
```

### Project Section Model

```typescript
interface ProjectSection {
  _id: string;
  sectionId: string;
  name: string;
  type: "Buildings" | "rowhouse" | "other";
  projectId: string;
  totalHouses?: number; // For rowhouse type
  createdAt: string;
  updatedAt: string;
}
```

### Mini Section Model

```typescript
interface Section {
  _id: string;
  name: string;
  projectDetails: {
    projectName: string;
    projectId: string;
  };
  mainSectionDetails: {
    sectionName: string;
    sectionId: string;
  };
  MaterialUsed: MaterialItem[];
  MaterialAvailable: MaterialItem[];
  createdAt: string;
  updatedAt: string;
}
```

### Material Model

```typescript
interface MaterialItem {
  _id: string;
  name: string;
  unit: string;
  specs: Record<string, any>;
  qnt: number;
  cost: number;
  sectionId?: string;
  miniSectionId?: string;
  addedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Staff Model

```typescript
interface Staff {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  assignedProjects: string[];
  role: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}
```

### Activity Model

```typescript
interface Activity {
  _id: string;
  clientId: string;
  user: {
    userId: string;
    fullName: string;
    email?: string;
  };
  projectName?: string;
  sectionName?: string;
  miniSectionName?: string;
  activityType: string;
  category: "project" | "section" | "mini_section" | "material" | "staff";
  action: string;
  description: string;
  message?: string;
  createdAt: string;
}
```

### Material Activity Model

```typescript
interface MaterialActivity {
  _id: string;
  clientId: string;
  user: {
    userId: string;
    fullName: string;
  };
  projectId: string;
  projectName?: string;
  sectionName?: string;
  miniSectionName?: string;
  materials: Array<{
    name: string;
    unit: string;
    specs?: Record<string, any>;
    qnt: number;
    cost: number;
  }>;
  message?: string;
  activity: "imported" | "used";
  createdAt: string;
}
```

---

## API Endpoints

### Base URL

```
https://real-estate-apis.vercel.app
```

### Authentication APIs

#### Find User

```http
POST /api/findUser
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "isUser": {
    "userType": "client",
    "verified": true
  }
}
```

#### Send OTP

```http
POST /api/otp
Content-Type: application/json

{
  "email": "user@example.com",
  "OTP": 123456
}
```

#### Set Password

```http
POST /api/password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword",
  "userType": "client"
}
```

#### Login

```http
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword"
}

Response:
{
  "success": true,
  "message": "Login successful"
}
```

#### Forget Password

```http
POST /api/forget-password
Content-Type: application/json

{
  "email": "user@example.com",
  "userType": "client"
}
```

#### Get User Details

```http
GET /api/{userType}?email={email}

Response:
{
  "data": {
    "_id": "...",
    "email": "...",
    "name": "...",
    "clientId": "..."
  }
}
```

---

### Project APIs

#### Get Projects

```http
GET /api/project?clientId={clientId}

Response: Array<Project>
```

#### Create Project

```http
POST /api/project
Content-Type: application/json

{
  "name": "Project Name",
  "address": "Project Address",
  "description": "Description",
  "clientId": "...",
  "assignedStaff": [...]
}

Response:
{
  "data": Project
}
```

#### Get Single Project

```http
GET /api/project/{projectId}

Response: Project
```

---

### Section APIs

#### Create Building Section

```http
POST /api/building
Content-Type: application/json

{
  "projectId": "...",
  "name": "Building A"
}

Response: ProjectSection
```

#### Update Building Section

```http
PUT /api/building?id={sectionId}
Content-Type: application/json

{
  "name": "Updated Building Name"
}
```

#### Delete Building Section

```http
DELETE /api/building?projectId={projectId}&sectionId={sectionId}
```

#### Create Rowhouse Section

```http
POST /api/rowHouse
Content-Type: application/json

{
  "projectId": "...",
  "name": "Rowhouse Block",
  "totalHouses": 10
}
```

#### Update Rowhouse Section

```http
PUT /api/rowHouse?rh={sectionId}
Content-Type: application/json

{
  "name": "Updated Name",
  "totalHouses": 12
}
```

#### Delete Rowhouse Section

```http
DELETE /api/rowHouse?projectId={projectId}&sectionId={sectionId}
```

#### Create Other Section

```http
POST /api/otherSection
Content-Type: application/json

{
  "projectId": "...",
  "name": "Custom Section"
}
```

#### Update Other Section

```http
PUT /api/otherSection?rh={sectionId}
Content-Type: application/json

{
  "name": "Updated Name"
}
```

#### Delete Other Section

```http
DELETE /api/otherSection?projectId={projectId}&sectionId={sectionId}
```

---

### Mini Section APIs

#### Get Mini Sections

```http
GET /api/mini-section?sectionId={sectionId}

Response:
{
  "success": true,
  "message": "...",
  "data": Array<Section>
}
```

#### Create Mini Section

```http
POST /api/mini-section
Content-Type: application/json

{
  "name": "Foundation",
  "projectDetails": {
    "projectId": "...",
    "projectName": "..."
  },
  "mainSectionDetails": {
    "sectionId": "...",
    "sectionName": "..."
  }
}
```

#### Update Mini Section

```http
PUT /api/mini-section?id={miniSectionId}
Content-Type: application/json

{
  "name": "Updated Name"
}
```

#### Delete Mini Section

```http
DELETE /api/mini-section?id={miniSectionId}
```

---

### Material APIs

#### Get Available Materials

```http
GET /api/material?projectId={projectId}&clientId={clientId}

Response:
{
  "success": true,
  "MaterialAvailable": Array<MaterialItem>
}
```

#### Import Materials

```http
POST /api/material
Content-Type: application/json

{
  "projectId": "...",
  "clientId": "...",
  "materials": [
    {
      "name": "Cement",
      "unit": "bags",
      "qnt": 100,
      "cost": 50000,
      "specs": {...}
    }
  ]
}
```

#### Get Used Materials

```http
GET /api/material-usage?projectId={projectId}&clientId={clientId}

Response:
{
  "success": true,
  "MaterialUsed": Array<MaterialItem>
}
```

#### Use Materials

```http
POST /api/material-usage
Content-Type: application/json

{
  "projectId": "...",
  "clientId": "...",
  "miniSectionId": "...",
  "materials": [
    {
      "materialId": "...",
      "name": "Cement",
      "unit": "bags",
      "qnt": 10,
      "cost": 5000,
      "specs": {...}
    }
  ]
}
```

---

### Staff APIs

#### Get All Staff

```http
GET /api/staff

Response:
{
  "data": Array<Staff>
}
```

#### Create Staff

```http
POST /api/staff
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "role": "Site Engineer",
  "clientId": "...",
  "assignedProjects": []
}
```

---

### Activity APIs

#### Get Activities

```http
GET /api/activity?clientId={clientId}&limit=50

Response:
{
  "activities": Array<Activity>
}
```

#### Log Activity

```http
POST /api/activity
Content-Type: application/json

{
  "clientId": "...",
  "user": {
    "userId": "...",
    "fullName": "..."
  },
  "activityType": "create",
  "category": "project",
  "action": "created",
  "description": "Created new project",
  "projectName": "...",
  "message": "..."
}
```

#### Get Material Activities

```http
GET /api/materialActivity?clientId={clientId}&limit=50

Response: Array<MaterialActivity>
```

#### Log Material Activity

```http
POST /api/materialActivity
Content-Type: application/json

{
  "clientId": "...",
  "projectId": "...",
  "user": {
    "userId": "...",
    "fullName": "..."
  },
  "materials": [...],
  "activity": "imported",
  "message": "Imported 100 bags of cement"
}
```

---

### Client APIs

#### Get Client Details

```http
GET /api/client?id={clientId}

Response:
{
  "clientData": {
    "_id": "...",
    "name": "...",
    "email": "...",
    "phone": "...",
    "companyName": "...",
    "address": "...",
    "gstNumber": "..."
  }
}
```

---

## Data Flow

### 1. Authentication Flow

```
User Opens App
    ↓
Check AsyncStorage for 'user'
    ↓
┌─────────────────┬─────────────────┐
│   User Found    │  User Not Found │
│   (Logged In)   │  (Not Logged)   │
└────────┬────────┴────────┬────────┘
         ↓                 ↓
    Navigate to       Navigate to
    /(tabs)           /login
         ↓                 ↓
    Dashboard         Login Screen
                           ↓
                      Enter Email
                           ↓
                   POST /api/findUser
                           ↓
              ┌────────────┴────────────┐
              │                         │
         Verified                  Not Verified
              │                         │
              ↓                         ↓
      Enter Password              Generate OTP
              │                         │
              ↓                    POST /api/otp
      POST /api/login                   │
              │                         ↓
              ↓                   Enter OTP Code
      Get User Details                  │
              │                         ↓
              ↓                   Verify OTP
      Store in AsyncStorage             │
              │                         ↓
              └─────────┬───────────────┘
                        ↓
                  Set Password
                        ↓
              POST /api/password
                        ↓
              Get User Details
                        ↓
              Store in AsyncStorage
                        ↓
              Navigate to /(tabs)
```

### 2. Project Management Flow

```
Dashboard/Home
    ↓
View Projects List
    ↓
GET /api/project?clientId={clientId}
    ↓
Display Projects
    ↓
┌───────────────────┬───────────────────┐
│   Add Project     │  Manage Project   │
└─────────┬─────────┴─────────┬─────────┘
          ↓                   ↓
    Fill Project Form    Select Project
          ↓                   ↓
    POST /api/project    Navigate to
          ↓              /manage_project/[id]
    Refresh List              ↓
                        View Sections
                              ↓
                    ┌─────────┴─────────┐
                    │                   │
              Add Section         Manage Section
                    │                   │
                    ↓                   ↓
            POST /api/building    Edit/Delete
            POST /api/rowHouse         │
            POST /api/otherSection     ↓
                    │            PUT/DELETE
                    │            /api/{sectionType}
                    └─────────┬─────────┘
                              ↓
                        Refresh Sections
```

### 3. Material Management Flow

```
Select Section
    ↓
Navigate to /details
    ↓
GET /api/material?projectId={projectId}&clientId={clientId}
GET /api/material-usage?projectId={projectId}&clientId={clientId}
    ↓
Display Materials (Imported/Used Tabs)
    ↓
┌───────────────────┬───────────────────┐
│  Import Materials │   Use Materials   │
└─────────┬─────────┴─────────┬─────────┘
          ↓                   ↓
    Fill Material Form   Select Material
          ↓                   ↓
    POST /api/material   Fill Usage Form
          ↓                   ↓
    Log Activity        POST /api/material-usage
          ↓                   ↓
    POST /api/          Log Activity
    materialActivity          ↓
          ↓            POST /api/materialActivity
          └─────────┬─────────┘
                    ↓
            Refresh Materials
                    ↓
            Update UI State
```

### 4. Analytics Flow

```
Dashboard Tab
    ↓
GET /api/project?clientId={clientId}
    ↓
Calculate Budget Data
    ↓
┌─────────────────────────────────┐
│  For Each Project:              │
│  - MaterialAvailable.cost       │
│  - MaterialUsed.cost            │
│  - Total = Available + Used     │
└─────────────────┬───────────────┘
                  ↓
        Transform to PieChart Data
                  ↓
        Display Budget Visualization
                  ↓
        Click on Project Slice
                  ↓
        Navigate to Section Analytics
                  ↓
        Display Section-wise Budget
                  ↓
        Click on Section
                  ↓
        Navigate to Material Analytics
                  ↓
        Display Material Cost Breakdown
```

### 5. Activity Logging Flow

```
User Action (Create/Update/Delete)
    ↓
Prepare Activity Data
    ↓
┌─────────────────────────────────┐
│  Activity Data:                 │
│  - clientId                     │
│  - user (userId, fullName)      │
│  - activityType                 │
│  - category                     │
│  - action                       │
│  - description                  │
│  - projectName (optional)       │
│  - sectionName (optional)       │
│  - message (optional)           │
└─────────────────┬───────────────┘
                  ↓
        POST /api/activity
                  ↓
        Activity Logged
                  ↓
        Visible in Notifications
```

### 6. Staff Management Flow

```
Staff Tab
    ↓
GET /api/staff
    ↓
Display Staff List
    ↓
┌───────────────────┬───────────────────┐
│   Add Staff       │  View Staff       │
└─────────┬─────────┴─────────┬─────────┘
          ↓                   ↓
    Fill Staff Form      Display Details
          ↓                   ↓
    POST /api/staff      Assigned Projects
          ↓                   ↓
    Refresh List         Contact Info
```

---

## Authentication Flow

### Login Process

1. **Email Entry**

   - User enters email
   - App calls `POST /api/findUser` with email
   - Response indicates if user exists and is verified

2. **OTP Verification (New Users)**

   - If user not verified:
     - Generate 6-digit OTP
     - Call `POST /api/otp` to send email
     - User enters OTP
     - App verifies OTP locally
     - Proceed to password setup

3. **Password Setup (New Users)**

   - User creates password (min 8 characters)
   - Call `POST /api/password` with email, password, userType
   - Fetch user details with `GET /api/{userType}?email={email}`
   - Store user data in AsyncStorage
   - Navigate to main app

4. **Login (Existing Users)**

   - User enters password
   - Call `POST /api/login` with email and password
   - On success, fetch user details
   - Store in AsyncStorage
   - Navigate to main app

5. **Forget Password**
   - User clicks "Forgot Password"
   - Call `POST /api/findUser` to get userType
   - Call `POST /api/forget-password` with email and userType
   - Password reset link sent to email

### Session Management

- **Storage**: User data stored in AsyncStorage with key `'user'`
- **Auth Context**: Global AuthContext provides:

  - `isAuthenticated`: Boolean flag
  - `isLoading`: Loading state
  - `user`: User object
  - `clientId`: Client identifier
  - `checkAuthStatus()`: Refresh auth state
  - `logout()`: Clear session

- **Auth Guard**: Root layout checks auth state and redirects:

  - Unauthenticated users → `/login`
  - Authenticated users → `/(tabs)`

- **Auto-refresh**: Auth status checked:
  - On app mount
  - When app comes to foreground
  - Every 30 seconds

### Logout Process

1. User clicks logout in profile
2. Confirmation dialog shown
3. On confirm:
   - Remove 'user' from AsyncStorage
   - Clear AuthContext state
   - Navigate to `/login`

---

## Key Features

### 1. Project Management

**Hierarchical Structure:**

```
Client
  └── Projects
       └── Sections (Buildings/Rowhouses/Other)
            └── Mini Sections
                 └── Materials (Available/Used)
```

**Features:**

- Create/edit/delete projects
- Assign staff to projects
- Track project budget and progress
- View project statistics
- Pull-to-refresh for real-time updates

**Navigation:**

- Home → Project List
- Add Project → Create new project
- Manage Project → View/edit sections
- Section Details → Material management

---

### 2. Material Management

**Material Lifecycle:**

1. **Import Materials**: Add materials to project inventory
2. **Allocate to Sections**: Assign materials to specific sections
3. **Track Usage**: Record material consumption
4. **Monitor Costs**: Track expenses per material

**Features:**

- Import materials with specifications
- Custom material specs (dynamic fields)
- Material usage tracking
- Date-wise grouping of materials
- Search and filter materials
- Material activity logging

**Material Specifications:**

- Steel: Sizes, rod length
- Bricks: Quantity
- Electrical: Wire sqmm, meters, pipes
- Plumbing: Pipe type, diameter, length
- Granite: Color, thickness, area
- Wall Putty: Brand, coverage, coats

---

### 3. Budget Analytics

**Three-Level Analytics:**

**Level 1: Project Overview**

- Pie chart showing budget distribution across projects
- Total expenses calculation
- Project-wise breakdown
- Click to drill down to sections

**Level 2: Section Analytics**

- Budget allocation per section
- Available vs Used materials cost
- Section comparison
- Click to drill down to materials

**Level 3: Material Analytics**

- Material-wise cost breakdown
- Quantity tracking
- Usage patterns
- Cost optimization insights

**Visualizations:**

- Interactive Pie Charts
- Bar Charts for comparisons
- Color-coded categories
- Hover effects and animations

---

### 4. Staff Management

**Features:**

- Add staff members
- Assign to projects
- Track roles and responsibilities
- Contact information
- Search and filter staff

**Staff Roles:**

- Site Engineer
- Supervisor
- Contractor
- Labor
- Custom roles

---

### 5. Activity Feed & Notifications

**Activity Types:**

- Project activities (create, update, delete)
- Section activities (add, modify, remove)
- Material activities (import, use)
- Staff activities (assign, update)

**Features:**

- Real-time activity logging
- Date-wise grouping
- User attribution
- Material activity cards with details
- Pull-to-refresh
- Filter by category (All/Project/Material)

**Activity Categories:**

- Project Management
- Section Management
- Material Import
- Material Usage
- Staff Assignment

---

### 6. Responsive Design

**Device Support:**

- Phones (portrait)
- Tablets (landscape/portrait)
- Adaptive layouts

**Responsive Utilities:**

```typescript
wp(percentage); // Width percentage
hp(percentage); // Height percentage
fs(size); // Font size
sp(size); // Spacing
br(radius); // Border radius
iconSize(size); // Icon size
```

**Breakpoints:**

- Phone: < 768px
- Tablet: >= 768px

---

### 7. Data Synchronization

**Strategies:**

- Pull-to-refresh on all list screens
- Optimistic UI updates
- Request debouncing (500ms)
- Request cancellation on unmount
- Loading states and error handling

**Performance Optimizations:**

- Prevent duplicate API calls
- Cancel pending requests
- Debounce rapid refreshes
- Animated list rendering
- Lazy loading

---

### 8. User Experience

**UI/UX Features:**

- Smooth animations
- Loading indicators
- Error messages with retry
- Empty states with guidance
- Confirmation dialogs
- Toast notifications
- Safe area handling
- Gesture support

**Navigation:**

- Tab-based main navigation
- Stack navigation for details
- Back button support
- Deep linking support
- Route parameters

---

## Complete API Reference Summary

### API Endpoint Categories

| Category           | Endpoints   | Purpose                                       |
| ------------------ | ----------- | --------------------------------------------- |
| **Authentication** | 7 endpoints | User login, registration, password management |
| **Projects**       | 3 endpoints | CRUD operations for projects                  |
| **Sections**       | 9 endpoints | Manage building/rowhouse/other sections       |
| **Mini Sections**  | 4 endpoints | Sub-section management                        |
| **Materials**      | 4 endpoints | Material inventory and usage                  |
| **Staff**          | 2 endpoints | Staff management                              |
| **Activities**     | 4 endpoints | Activity logging and retrieval                |
| **Client**         | 1 endpoint  | Client profile information                    |

**Total API Endpoints: 34**

---

## Error Handling

### Client-Side Error Handling

```typescript
try {
  const response = await axios.get(url);
  // Process response
} catch (error: any) {
  console.error("Error:", error);

  // Handle different error types
  if (error.response?.status === 404) {
    toast.warning("Resource not found");
  } else if (error.response?.status === 500) {
    toast.error("Server error");
  } else {
    toast.error(error.message || "An error occurred");
  }
}
```

### Common Error Scenarios

1. **Network Errors**: No internet connection
2. **Authentication Errors**: Invalid credentials, expired session
3. **Validation Errors**: Invalid input data
4. **Not Found Errors**: Resource doesn't exist
5. **Server Errors**: Backend issues

### Error Recovery

- Retry buttons on error screens
- Pull-to-refresh to reload data
- Automatic session refresh
- Graceful degradation
- User-friendly error messages

---

## State Management Patterns

### Local Component State

```typescript
const [data, setData] = useState<Type[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Global Authentication State

```typescript
const { isAuthenticated, user, clientId, logout } = useAuth();
```

### Persistent Storage

```typescript
// Save
await AsyncStorage.setItem("user", JSON.stringify(userData));

// Retrieve
const userString = await AsyncStorage.getItem("user");
const user = JSON.parse(userString);

// Remove
await AsyncStorage.removeItem("user");
```

### Performance Optimization

```typescript
// Debouncing
const isLoadingRef = useRef(false);
const lastLoadTimeRef = useRef<number>(0);
const DEBOUNCE_DELAY = 500;

// Request cancellation
const abortControllerRef = useRef<AbortController | null>(null);
abortControllerRef.current = new AbortController();
```

---

## Security Considerations

### Authentication

- Password hashing on backend
- OTP verification for new users
- Session management with AsyncStorage
- Auto-logout on session expiry

### API Security

- HTTPS communication
- Client ID validation
- User ID verification
- Request authentication

### Data Protection

- Sensitive data not logged
- Secure storage practices
- Input validation
- XSS prevention

---

## Development Workflow

### Running the App

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

### Building for Production

```bash
# Configure EAS Build
npm run build:configure

# Build Android preview
npm run build:preview

# Build Android production
npm run build:production

# Check build status
npm run build:status
```

### Code Quality

```bash
# Run linter
npm run lint

# Type checking (TypeScript)
tsc --noEmit
```

---

## Future Enhancements

### Planned Features

1. Offline mode with local database
2. Photo attachments for materials
3. QR code scanning for materials
4. PDF report generation
5. Multi-language support
6. Push notifications
7. Real-time collaboration
8. Advanced analytics with charts
9. Export data to Excel/CSV
10. Material supplier management

### Technical Improvements

1. Redux for state management
2. React Query for server state
3. WebSocket for real-time updates
4. Image optimization
5. Code splitting
6. Performance monitoring
7. Crash reporting
8. A/B testing
9. Analytics integration
10. CI/CD pipeline

---

## Troubleshooting

### Common Issues

**1. Login Issues**

- Clear AsyncStorage
- Check network connection
- Verify API endpoint
- Check user credentials

**2. Data Not Loading**

- Pull to refresh
- Check clientId in storage
- Verify API responses
- Check network logs

**3. Navigation Issues**

- Clear navigation state
- Restart app
- Check route parameters
- Verify auth state

**4. Build Issues**

- Clear node_modules
- Clear cache: `expo start -c`
- Update dependencies
- Check EAS configuration

---

## Support & Resources

### Documentation

- Expo Documentation: https://docs.expo.dev
- React Native: https://reactnative.dev
- TypeScript: https://www.typescriptlang.org

### Community

- GitHub Issues
- Stack Overflow
- Expo Forums
- React Native Community

---

## Conclusion

Xsite is a comprehensive construction management solution that provides:

- Complete project lifecycle management
- Real-time material tracking
- Budget analytics and visualization
- Staff coordination
- Activity monitoring

The application follows modern React Native best practices with TypeScript, proper error handling, performance optimization, and responsive design. The modular architecture allows for easy maintenance and future enhancements.

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Application Version**: 1.0.0
