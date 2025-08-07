# HRMS Mobile App Setup Guide

## Overview
This guide helps you create a React Native mobile application for the HRMS system. The backend already includes mobile API endpoints with token-based authentication.

## Mobile API Endpoints

### Authentication
- `POST /api/mobile/auth/login` - Login and get auth token
- `POST /api/mobile/auth/refresh` - Refresh expired token

### Employee Dashboard
- `GET /api/mobile/dashboard` - Get employee dashboard data

### Attendance
- `POST /api/mobile/attendance/punch` - Punch in/out with GPS location
- `GET /api/mobile/attendance/status` - Get today's punch status

### Leave Management
- `POST /api/mobile/leave/apply` - Apply for leave
- `GET /api/mobile/leave/balance` - Get leave balance
- `GET /api/mobile/leave/history` - Get leave application history

### Profile
- `GET /api/mobile/profile` - Get employee profile

## React Native Setup Steps

### 1. Initialize React Native Project
```bash
# Install React Native CLI
npm install -g @react-native-community/cli

# Create new project
npx react-native init HRMSMobile
cd HRMSMobile

# Install required dependencies
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install react-native-geolocation-service
npm install react-native-permissions
npm install axios
npm install react-native-paper # For UI components
```

### 2. Required Permissions (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
```

### 3. Basic App Structure
```
src/
├── components/
│   ├── AttendancePunch.js
│   ├── LeaveForm.js
│   └── Dashboard.js
├── screens/
│   ├── LoginScreen.js
│   ├── DashboardScreen.js
│   ├── AttendanceScreen.js
│   ├── LeaveScreen.js
│   └── ProfileScreen.js
├── services/
│   ├── api.js
│   ├── auth.js
│   └── location.js
├── utils/
│   ├── storage.js
│   └── constants.js
└── navigation/
    └── AppNavigator.js
```

### 4. API Service Example (src/services/api.js)
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'http://your-server-domain.com'; // Replace with your server URL

class ApiService {
  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Add token to requests
    this.axios.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async login(username, password) {
    const response = await this.axios.post('/api/mobile/auth/login', {
      username,
      password,
    });
    
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }

  async getDashboard() {
    const response = await this.axios.get('/api/mobile/dashboard');
    return response.data;
  }

  async punchAttendance(type, location) {
    const response = await this.axios.post('/api/mobile/attendance/punch', {
      type,
      location: location ? `${location.latitude},${location.longitude}` : null,
      address: location?.address || null,
    });
    return response.data;
  }

  async applyLeave(leaveData) {
    const response = await this.axios.post('/api/mobile/leave/apply', leaveData);
    return response.data;
  }

  async getLeaveBalance() {
    const response = await this.axios.get('/api/mobile/leave/balance');
    return response.data;
  }
}

export default new ApiService();
```

### 5. Location Service Example (src/services/location.js)
```javascript
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

class LocationService {
  async requestPermission() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  async getCurrentLocation() {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }
}

export default new LocationService();
```

### 6. Sample Login Screen (src/screens/LoginScreen.js)
```javascript
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Card, Title } from 'react-native-paper';
import ApiService from '../services/api';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoading(true);
    try {
      await ApiService.login(username, password);
      navigation.replace('MainTabs');
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.error || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>HRMS Login</Title>
          
          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            autoCapitalize="none"
          />
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
          >
            Login
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
});
```

### 7. Sample Attendance Screen (src/screens/AttendanceScreen.js)
```javascript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import ApiService from '../services/api';
import LocationService from '../services/location';

export default function AttendanceScreen() {
  const [loading, setLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null);

  const handlePunch = async (type) => {
    setLoading(true);
    try {
      const location = await LocationService.getCurrentLocation();
      const result = await ApiService.punchAttendance(type, location);
      Alert.alert('Success', result.message);
      // Refresh status
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to record attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Attendance</Title>
          <Paragraph>Record your attendance with GPS location</Paragraph>
          
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => handlePunch('in')}
              loading={loading}
              style={[styles.button, styles.punchIn]}
            >
              Punch In
            </Button>
            
            <Button
              mode="contained"
              onPress={() => handlePunch('out')}
              loading={loading}
              style={[styles.button, styles.punchOut]}
            >
              Punch Out
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 10,
  },
  punchIn: {
    backgroundColor: '#4CAF50',
  },
  punchOut: {
    backgroundColor: '#F44336',
  },
});
```

## Key Features to Implement

### Core Features
- [x] Login with token-based authentication
- [x] Employee dashboard with leave balance and attendance summary
- [x] GPS-based attendance punch in/out
- [x] Leave application submission
- [x] Leave balance viewing
- [ ] Push notifications for leave approvals
- [ ] Offline mode for core features
- [ ] QR code scanning for office entry

### Advanced Features
- [ ] Field work tracking with route mapping
- [ ] Expense submission with photo attachments
- [ ] Salary slip download
- [ ] Team management (for managers)
- [ ] Real-time chat for HR queries

## Deployment

### Android
```bash
cd android
./gradlew assembleRelease
```

### iOS
```bash
cd ios
xcodebuild -workspace HRMSMobile.xcworkspace -scheme HRMSMobile archive
```

## Server Configuration

Make sure your server allows CORS for mobile app domain:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-mobile-app-domain.com'],
  credentials: true
}));
```

## Testing

Use the demo credentials to test mobile app:
- Username: `john.smith`
- Password: `john123`

The mobile API endpoints are now active and ready for your React Native app to consume.