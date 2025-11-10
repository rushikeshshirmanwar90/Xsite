# useUser Hook Documentation

A comprehensive React hook for managing user authentication and data across Admin, Staff, and Customer user types.

## Features

- ✅ Automatic user data loading from AsyncStorage
- ✅ Support for Admin, Staff, and Customer user types
- ✅ Refresh user data from API
- ✅ Update user information
- ✅ Logout functionality
- ✅ Type-safe with TypeScript
- ✅ Helper functions for role checking

## Installation

The hook is already set up in your project at `hooks/useUser.ts`.

## Basic Usage

```tsx
import { useUser } from '@/hooks/useUser';

function MyComponent() {
  const { user, userType, loading, error } = useUser();

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;
  if (!user) return <Text>Not logged in</Text>;

  return (
    <View>
      <Text>Welcome, {user.firstName} {user.lastName}!</Text>
      <Text>Email: {user.email}</Text>
      <Text>User Type: {userType}</Text>
    </View>
  );
}
```

## API Reference

### Hook Return Values

```typescript
{
  user: User | null;              // Current user data
  userType: UserType | null;      // 'admin' | 'staff' | 'user'
  loading: boolean;               // Loading state
  error: string | null;           // Error message if any
  refreshUser: () => Promise<void>;     // Refresh user data from API
  logout: () => Promise<void>;          // Logout user
  updateUser: (updates: Partial<User>) => Promise<boolean>;  // Update user data
}
```

### User Types

#### AdminUser
```typescript
{
  _id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: number;
  password?: string;
}
```

#### StaffUser
```typescript
{
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password?: string;
  clientId: string;
  role: 'site-engineer' | 'supervisor' | 'manager';
  assignedProjects?: string[];
}
```

#### CustomerUser
```typescript
{
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password?: string;
  clientId: string;
  verified: boolean;
  otp?: number;
  properties?: any;
  createdAt?: string;
  updatedAt?: string;
}
```

## Helper Functions

### getUserDisplayName(user)
Returns the full name of the user.

```tsx
import { getUserDisplayName } from '@/hooks/useUser';

const displayName = getUserDisplayName(user);
// Returns: "John Doe"
```

### isAdmin(user)
Checks if the user is an admin.

```tsx
import { isAdmin } from '@/hooks/useUser';

if (isAdmin(user)) {
  // Show admin-only content
}
```

### isStaff(user)
Checks if the user is a staff member.

```tsx
import { isStaff } from '@/hooks/useUser';

if (isStaff(user)) {
  // Show staff-only content
}
```

### isCustomer(user)
Checks if the user is a customer.

```tsx
import { isCustomer } from '@/hooks/useUser';

if (isCustomer(user)) {
  // Show customer-only content
}
```

### getUserRole(user)
Gets the role of a staff user.

```tsx
import { getUserRole } from '@/hooks/useUser';

const role = getUserRole(user);
// Returns: 'site-engineer' | 'supervisor' | 'manager' | null
```

## Common Use Cases

### 1. Display User Profile

```tsx
function UserProfile() {
  const { user, userType, loading } = useUser();

  if (loading) return <ActivityIndicator />;

  return (
    <View>
      <Text>Name: {user?.firstName} {user?.lastName}</Text>
      <Text>Email: {user?.email}</Text>
      <Text>Phone: {user?.phoneNumber}</Text>
      <Text>Type: {userType}</Text>
    </View>
  );
}
```

### 2. Refresh User Data

```tsx
function RefreshButton() {
  const { refreshUser, loading } = useUser();

  return (
    <TouchableOpacity 
      onPress={refreshUser}
      disabled={loading}
    >
      <Text>Refresh</Text>
    </TouchableOpacity>
  );
}
```

### 3. Update User Information

```tsx
function UpdateProfile() {
  const { updateUser } = useUser();

  const handleUpdate = async () => {
    const success = await updateUser({
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '9876543210'
    });

    if (success) {
      toast.success('Profile updated!');
    } else {
      toast.error('Update failed');
    }
  };

  return (
    <TouchableOpacity onPress={handleUpdate}>
      <Text>Update Profile</Text>
    </TouchableOpacity>
  );
}
```

### 4. Logout

```tsx
function LogoutButton() {
  const { logout } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <TouchableOpacity onPress={handleLogout}>
      <Text>Logout</Text>
    </TouchableOpacity>
  );
}
```

### 5. Role-Based Rendering

```tsx
function Dashboard() {
  const { user } = useUser();

  return (
    <View>
      {isAdmin(user) && <AdminDashboard />}
      {isStaff(user) && <StaffDashboard role={getUserRole(user)} />}
      {isCustomer(user) && <CustomerDashboard />}
    </View>
  );
}
```

### 6. Protected Route

```tsx
function ProtectedScreen() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  if (loading) return <ActivityIndicator />;
  if (!user) return null;

  return <YourProtectedContent />;
}
```

### 7. Staff Role Check

```tsx
function StaffOnlyFeature() {
  const { user } = useUser();

  if (!isStaff(user)) {
    return <Text>Access Denied</Text>;
  }

  const role = getUserRole(user);

  return (
    <View>
      <Text>Staff Role: {role}</Text>
      {role === 'manager' && <ManagerFeatures />}
      {role === 'site-engineer' && <EngineerFeatures />}
      {role === 'supervisor' && <SupervisorFeatures />}
    </View>
  );
}
```

## Error Handling

The hook automatically handles errors and provides error messages:

```tsx
function MyComponent() {
  const { user, error, loading } = useUser();

  if (loading) return <ActivityIndicator />;
  
  if (error) {
    return (
      <View>
        <Text style={{ color: 'red' }}>Error: {error}</Text>
        <TouchableOpacity onPress={() => refreshUser()}>
          <Text>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <YourContent />;
}
```

## Notes

- User data is automatically loaded from AsyncStorage on mount
- The hook supports both new ('user' key) and legacy storage keys ('admin', 'staff')
- All API calls use the domain from `@/lib/domain`
- User type is automatically detected based on user data structure
- AsyncStorage is updated automatically after successful operations

## Examples

See `hooks/useUser.example.tsx` for complete working examples of all features.
