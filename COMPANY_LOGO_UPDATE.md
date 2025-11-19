# Company Logo and Name Update

## Changes Made to `app/(tabs)/index.tsx`

### 1. Added State Variables

```typescript
const [companyName, setCompanyName] = useState<string>("Company Name");
const [companyLogo, setCompanyLogo] = useState<string | null>(null);
```

### 2. Added Client Data Fetching

Fetches company name and logo from the client API on component mount:

```typescript
useEffect(() => {
  const fetchClientData = async () => {
    try {
      const clientId = await getClientId();
      if (clientId) {
        const response = await axios.get(`${domain}/api/client?id=${clientId}`);
        const responseData = response.data as any;

        if (responseData && responseData.clientData) {
          const client = responseData.clientData;
          setCompanyName(client.companyName || client.name || "Company Name");
          setCompanyLogo(client.logo || null);
        }
      }
    } catch (error) {
      console.error("Error fetching client data:", error);
    }
  };

  fetchClientData();
}, []);
```

### 3. Updated Header Display

The header now shows:

- **Company Logo** (if available) - Displays the image from the `logo` field
- **Company Initials** (fallback) - Shows initials if no logo is available
- **Company Name** - Dynamically loaded from client data

```typescript
{
  companyLogo ? (
    <Image
      source={{ uri: companyLogo }}
      style={styles.companyLogo}
      resizeMode="contain"
    />
  ) : (
    <View style={styles.avatarContainer}>
      <Text style={styles.avatarText}>{companyInitials}</Text>
    </View>
  );
}
<View style={styles.userDetails}>
  <Text style={styles.userName}>{companyName}</Text>
  <Text style={styles.userSubtitle}>Project Management Dashboard</Text>
</View>;
```

### 4. Added Image Import

```typescript
import {
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
```

## Changes Made to `style/adminHome.tsx`

### Added Company Logo Style

```typescript
companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
},
```

## API Integration

The component fetches data from:

```
GET /api/client?id={clientId}
```

Expected response structure:

```json
{
  "clientData": {
    "_id": "...",
    "name": "Client Name",
    "companyName": "Company Name",
    "logo": "https://example.com/logo.png",
    "email": "...",
    "phone": "...",
    ...
  }
}
```

## Features

1. **Dynamic Company Name**: Fetched from client data

   - Priority: `companyName` > `name` > 'Company Name' (fallback)

2. **Dynamic Logo**: Displays company logo if available

   - Field name: `logo`
   - Format: URL string
   - Fallback: Shows company initials in colored circle

3. **Automatic Loading**: Fetches on component mount

   - No manual refresh needed
   - Error handling included

4. **Responsive Design**:
   - Logo: 48x48px with rounded corners
   - Initials: Colored circle with white text
   - Both options maintain consistent spacing

## Testing

To test the feature:

1. Ensure your client data has a `logo` field with a valid image URL
2. Open the app and navigate to the home screen
3. The logo should display automatically
4. If no logo exists, initials will show instead

## Troubleshooting

If the logo doesn't appear:

1. Check if the `logo` field exists in your client data
2. Verify the URL is accessible
3. Check console logs for any errors
4. Ensure the clientId is valid

If you see a TypeScript error about `companyLogo` style:

- This is a caching issue
- Restart the development server
- The error will resolve automatically
