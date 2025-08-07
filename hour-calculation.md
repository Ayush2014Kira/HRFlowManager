# Hour Calculation System

## Overview
The HRMS system includes sophisticated hour calculation capabilities for accurate attendance tracking and payroll processing.

## Working Hours Configuration
Each company can configure:
- **Standard working hours**: Start and end times (e.g., 9:00 AM - 6:00 PM)
- **Break times**: Optional lunch breaks with start/end times
- **Working days**: Configure which days are working days (Monday-Friday default)
- **Overtime rules**: Define when overtime starts (after 8 hours, or after standard hours)

## Hour Calculation Logic

### 1. Regular Hours Calculation
```
Regular Hours = MIN(Actual Work Hours, Standard Work Hours)
```

### 2. Overtime Calculation
```
Overtime Hours = MAX(0, Actual Work Hours - Standard Work Hours)
```

### 3. Break Time Handling
- Unpaid breaks are automatically deducted from total hours
- Paid breaks count toward regular hours
- Break time is configurable per company

### 4. Late Arrival/Early Departure
- Late arrival after grace period (configurable) affects total hours
- Early departure before minimum required hours affects total hours
- Grace periods can be set per company (e.g., 15 minutes)

## eSSL Integration for Hour Calculation

### Punch Data Processing
1. **Raw Data Import**: Import punch records from eSSL devices
2. **Pair Matching**: Match IN/OUT punches for the same employee/day
3. **Hour Calculation**: Calculate total hours between paired punches
4. **Break Deduction**: Subtract configured break times
5. **Validation**: Flag unusual patterns (missing punches, excessive hours)

### Multi-Location Support
- Track hours across different locations
- Location-specific working hour rules
- Travel time between locations (configurable)

## Advanced Features

### 1. Shift Management
- **Day Shift**: Standard 9-5 working hours
- **Night Shift**: Overnight shifts with date handling
- **Rotating Shifts**: Different schedules for different weeks
- **Weekend Shifts**: Special rates and calculations

### 2. Holiday Handling
- **Public Holidays**: Automatic detection and special rates
- **Company Holidays**: Custom company-specific holidays
- **Holiday Work**: Premium rates for holiday work

### 3. Leave Integration
- **Paid Leave**: Counts as regular working hours
- **Unpaid Leave**: Deducted from total hours
- **Half-day Leave**: Partial hour adjustments
- **Sick Leave**: Special handling per company policy

## Payroll Integration

### Hour-based Calculations
- **Hourly Rate**: Base salary ÷ (Standard Hours × Working Days)
- **Regular Pay**: Regular Hours × Hourly Rate
- **Overtime Pay**: Overtime Hours × (Hourly Rate × Overtime Multiplier)
- **Deductions**: Late/absence deductions based on hour calculations

### Reports and Analytics
- **Daily Hour Summary**: Track daily working patterns
- **Weekly Overtime**: Monitor overtime trends
- **Monthly Totals**: Complete hour breakdown for payroll
- **Exception Reports**: Flag unusual patterns or missing data

## Configuration Examples

### Standard Company Setup
```json
{
  "workingHours": {
    "start": "09:00",
    "end": "18:00",
    "breakStart": "12:00",
    "breakEnd": "13:00",
    "workDays": [1, 2, 3, 4, 5],
    "overtimeAfter": 8,
    "graceMinutes": 15
  }
}
```

### Flexible Hours Setup
```json
{
  "workingHours": {
    "flexibleStart": true,
    "coreHours": {
      "start": "10:00",
      "end": "16:00"
    },
    "minimumHours": 8,
    "maximumHours": 12
  }
}
```

## Implementation Status

✅ **Completed**:
- Basic punch in/out tracking
- Simple hour calculation
- Multi-company support structure
- eSSL device integration framework

🚧 **In Progress**:
- Advanced hour calculation rules
- Break time handling
- Shift management
- Holiday integration

📋 **Planned**:
- Flexible working hours
- Advanced overtime rules
- Payroll integration enhancements
- Comprehensive reporting

## Best Practices

1. **Data Validation**: Always validate punch data before processing
2. **Exception Handling**: Flag and review unusual patterns
3. **Audit Trail**: Maintain complete history of hour calculations
4. **Regular Sync**: Sync eSSL devices frequently for accurate data
5. **Backup Procedures**: Maintain backups of attendance data