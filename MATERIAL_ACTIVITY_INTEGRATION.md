# Material Activity API Integration

## Overview

Integrated the Material Activity API to track who imported materials and who used them in the construction management system.

## API Details

### Endpoint

```
POST /api/materialActivity
```

### Payload Structure

```typescript
{
  clientId: string;
  projectId: string;
  materials: Array<{
    name: string;
    unit: string;
    specs: Record<string, unknown>;
    qnt: number;
    cost: number;
    addedAt: Date;
  }>;
  message: string;
  activity: "imported" | "used";
  user: {
    userId: string;
    fullName: string;
  }
}
```

## Implementation

### 1. Helper Functions Added

#### `getUserData()`

Retrieves user information from AsyncStorage:

```typescript
{
  userId: string; // User's ID
  fullName: string; // User's full name
}
```

#### `getClientIdFromStorage()`

Retrieves the client ID from AsyncStorage.

#### `logMaterialActivity()`

Logs material activity (imported or used) to the API:

- Automatically gets user data
- Automatically gets client ID
- Sends activity log to the API
- Non-blocking (doesn't throw errors if logging fails)

### 2. Integration Points

#### When Materials are Imported

**Location:** `addMaterialRequest()` function in `app/details.tsx`

**Flow:**

1. User adds materials via the Material Form Modal
2. Materials are saved to the database via `/api/material`
3. **NEW:** Activity is logged via `/api/materialActivity` with `activity: "imported"`
4. Materials list is refreshed

**Logged Data:**

- Material name, unit, specs, quantity, cost
- User who imported
- Project ID
- Message from the form
- Timestamp

#### When Materials are Used

**Location:** `handleAddMaterialUsage()` function in `app/details.tsx`

**Flow:**

1. User allocates materials to a mini-section via the Usage Form
2. Material usage is saved via `/api/material-usage`
3. **NEW:** Activity is logged via `/api/materialActivity` with `activity: "used"`
4. Materials list is refreshed
5. Tab switches to "Used Materials"

**Logged Data:**

- Material name, unit, specs, quantity, cost
- User who used the material
- Project ID
- Message indicating which section it was used in
- Timestamp

### 3. Error Handling

The activity logging is **non-critical** and won't block the main operations:

- If activity logging fails, the material addition/usage still succeeds
- Errors are logged to console but not shown to users
- This ensures the main functionality always works

## Benefits

1. **Audit Trail**: Complete history of who imported and used materials
2. **Accountability**: Track which user performed each action
3. **Reporting**: Can generate reports on material usage by user
4. **Transparency**: Full visibility into material flow
5. **Non-Intrusive**: Doesn't affect existing functionality

## Usage Examples

### Example 1: Importing Materials

```typescript
// User adds 3 materials
Materials: [
  { name: "Cement", unit: "bags", qnt: 100, cost: 50000 },
  { name: "Steel", unit: "kg", qnt: 500, cost: 75000 },
  { name: "Bricks", unit: "pieces", qnt: 10000, cost: 30000 }
]

// Activity logged:
{
  activity: "imported",
  user: { userId: "123", fullName: "John Doe" },
  materials: [...],
  message: "Initial material import for foundation work"
}
```

### Example 2: Using Materials

```typescript
// User allocates cement to a mini-section
Material: { name: "Cement", unit: "bags", qnt: 20, cost: 10000 }

// Activity logged:
{
  activity: "used",
  user: { userId: "123", fullName: "John Doe" },
  materials: [{...}],
  message: "Used in Ground Floor - Mini Section ID: abc123"
}
```

## Database Schema

The MaterialActivity collection stores:

```typescript
{
  _id: ObjectId,
  user: {
    userId: string,
    fullName: string
  },
  clientId: string,
  projectId: string,
  materials: [{
    name: string,
    unit: string,
    specs: object,
    qnt: number,
    cost: number,
    addedAt: date
  }],
  message: string,
  activity: "imported" | "used",
  createdAt: date,
  updatedAt: date
}
```

## Testing

To verify the integration:

1. **Test Material Import:**

   - Add materials via the "Add Material" button
   - Check console for "✅ Material activity logged successfully"
   - Verify in database that activity was recorded with `activity: "imported"`

2. **Test Material Usage:**

   - Use materials via the "Add Usage" button
   - Check console for "✅ Material activity logged successfully"
   - Verify in database that activity was recorded with `activity: "used"`

3. **Test Error Handling:**
   - Temporarily break the API endpoint
   - Verify that material addition/usage still works
   - Check console for error logs

## Future Enhancements

Possible additions:

1. Activity history view in the UI
2. User-wise material usage reports
3. Material flow visualization
4. Export activity logs to Excel/PDF
5. Real-time activity notifications
6. Material usage analytics by user

## Notes

- Activity logging happens **after** the main operation succeeds
- Logging is **asynchronous** and doesn't block the UI
- User data is retrieved from AsyncStorage (login session)
- Client ID is automatically determined from user session
- All timestamps are in UTC
