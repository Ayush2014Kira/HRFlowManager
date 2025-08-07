import { db } from "./db";
import { fieldWorkVisits, attendanceRecords, employees } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

export interface LocationUpdate {
  employeeId: string;
  coordinates: GPSCoordinates;
  address?: string;
  isFieldWork?: boolean;
}

export class GPSTrackingService {
  private readonly OFFICE_RADIUS = 100; // meters
  private readonly MAX_SPEED_THRESHOLD = 120; // km/h to detect invalid GPS data

  async updateEmployeeLocation(update: LocationUpdate) {
    try {
      const { employeeId, coordinates, address, isFieldWork } = update;

      // Validate GPS coordinates
      if (!this.isValidGPSCoordinates(coordinates)) {
        throw new Error('Invalid GPS coordinates');
      }

      // Check for suspicious movement (teleportation detection)
      const lastLocation = await this.getLastKnownLocation(employeeId);
      if (lastLocation && this.isSuspiciousMovement(lastLocation, coordinates)) {
        console.warn(`⚠️ Suspicious GPS movement detected for employee ${employeeId}`);
        // Log but don't reject - could be legitimate fast travel
      }

      // Get employee info
      const [employee] = await db.select()
        .from(employees)
        .where(eq(employees.id, employeeId));

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Check if employee is in field work
      if (isFieldWork) {
        await this.handleFieldWorkLocation(employeeId, coordinates, address);
      }

      // Update attendance with location if punch-in/out
      await this.updateAttendanceLocation(employeeId, coordinates, address);

      console.log(`📍 Location updated for ${employee.name}: ${coordinates.latitude}, ${coordinates.longitude}`);

      return {
        success: true,
        isFieldWork: await this.isEmployeeInFieldWork(employeeId),
        distanceFromOffice: await this.calculateDistanceFromOffice(employeeId, coordinates)
      };

    } catch (error) {
      console.error('❌ Error updating employee location:', error);
      throw error;
    }
  }

  private isValidGPSCoordinates(coords: GPSCoordinates): boolean {
    return (
      coords.latitude >= -90 && coords.latitude <= 90 &&
      coords.longitude >= -180 && coords.longitude <= 180 &&
      !isNaN(coords.latitude) && !isNaN(coords.longitude)
    );
  }

  private async getLastKnownLocation(employeeId: string): Promise<GPSCoordinates | null> {
    try {
      // Check field work visits first
      const [lastFieldWork] = await db.select()
        .from(fieldWorkVisits)
        .where(eq(fieldWorkVisits.employeeId, employeeId))
        .orderBy(desc(fieldWorkVisits.startTime))
        .limit(1);

      if (lastFieldWork && lastFieldWork.startLocation) {
        const coords = lastFieldWork.startLocation.split(',');
        return {
          latitude: parseFloat(coords[0]),
          longitude: parseFloat(coords[1]),
          timestamp: lastFieldWork.startTime
        };
      }

      // Check attendance records
      const today = new Date().toISOString().split('T')[0];
      const [lastAttendance] = await db.select()
        .from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.employeeId, employeeId),
          eq(attendanceRecords.date, today)
        ))
        .orderBy(desc(attendanceRecords.createdAt))
        .limit(1);

      if (lastAttendance && lastAttendance.punchInLocation) {
        const coords = lastAttendance.punchInLocation.split(',');
        return {
          latitude: parseFloat(coords[0]),
          longitude: parseFloat(coords[1]),
          timestamp: lastAttendance.punchIn || lastAttendance.createdAt
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting last known location:', error);
      return null;
    }
  }

  private isSuspiciousMovement(lastLocation: GPSCoordinates, currentLocation: GPSCoordinates): boolean {
    const distance = this.calculateDistance(
      lastLocation.latitude, lastLocation.longitude,
      currentLocation.latitude, currentLocation.longitude
    );

    const timeDiff = (currentLocation.timestamp.getTime() - lastLocation.timestamp.getTime()) / (1000 * 60 * 60); // hours
    const speed = distance / timeDiff; // km/h

    return speed > this.MAX_SPEED_THRESHOLD;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private async handleFieldWorkLocation(employeeId: string, coordinates: GPSCoordinates, address?: string) {
    // Check if employee has active field work
    const [activeFieldWork] = await db.select()
      .from(fieldWorkVisits)
      .where(and(
        eq(fieldWorkVisits.employeeId, employeeId),
        eq(fieldWorkVisits.status, 'in_progress')
      ))
      .orderBy(desc(fieldWorkVisits.startTime))
      .limit(1);

    if (activeFieldWork) {
      // Update current location for active field work
      const locationString = `${coordinates.latitude},${coordinates.longitude}`;
      
      // Calculate distance traveled if we have a start location
      let distance = 0;
      if (activeFieldWork.startLocation) {
        const startCoords = activeFieldWork.startLocation.split(',');
        distance = this.calculateDistance(
          parseFloat(startCoords[0]), parseFloat(startCoords[1]),
          coordinates.latitude, coordinates.longitude
        );
      }

      await db.update(fieldWorkVisits)
        .set({
          endLocation: locationString,
          endAddress: address,
          distance: distance.toFixed(2)
        })
        .where(eq(fieldWorkVisits.id, activeFieldWork.id));
    }
  }

  private async updateAttendanceLocation(employeeId: string, coordinates: GPSCoordinates, address?: string) {
    const today = new Date().toISOString().split('T')[0];
    const locationString = `${coordinates.latitude},${coordinates.longitude}`;

    // Find today's attendance record
    const [todayAttendance] = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.employeeId, employeeId),
        eq(attendanceRecords.date, today)
      ))
      .orderBy(desc(attendanceRecords.createdAt))
      .limit(1);

    if (todayAttendance) {
      // Update location based on punch status
      if (todayAttendance.punchIn && !todayAttendance.punchOut) {
        // Currently at work, update punch-out location for when they leave
        await db.update(attendanceRecords)
          .set({
            punchOutLocation: locationString,
            punchOutAddress: address,
            isFieldWork: await this.isEmployeeInFieldWork(employeeId)
          })
          .where(eq(attendanceRecords.id, todayAttendance.id));
      } else if (!todayAttendance.punchIn) {
        // Not punched in yet, update punch-in location
        await db.update(attendanceRecords)
          .set({
            punchInLocation: locationString,
            punchInAddress: address,
            isFieldWork: await this.isEmployeeInFieldWork(employeeId)
          })
          .where(eq(attendanceRecords.id, todayAttendance.id));
      }
    }
  }

  private async isEmployeeInFieldWork(employeeId: string): Promise<boolean> {
    const [activeFieldWork] = await db.select()
      .from(fieldWorkVisits)
      .where(and(
        eq(fieldWorkVisits.employeeId, employeeId),
        eq(fieldWorkVisits.status, 'in_progress')
      ))
      .limit(1);

    return !!activeFieldWork;
  }

  private async calculateDistanceFromOffice(employeeId: string, coordinates: GPSCoordinates): Promise<number> {
    // Get employee's office location
    const [employee] = await db.select()
      .from(employees)
      .where(eq(employees.id, employeeId));

    if (!employee) return 0;

    // For now, use a default office location (should be fetched from location table)
    const officeLatitude = 28.6139; // Delhi coordinates as example
    const officeLongitude = 77.2090;

    return this.calculateDistance(
      coordinates.latitude, coordinates.longitude,
      officeLatitude, officeLongitude
    );
  }

  async startFieldWork(employeeId: string, clientName: string, purpose: string, coordinates?: GPSCoordinates, address?: string) {
    try {
      const locationString = coordinates ? `${coordinates.latitude},${coordinates.longitude}` : null;

      const [fieldWork] = await db.insert(fieldWorkVisits).values({
        employeeId,
        clientName,
        purpose,
        startTime: new Date(),
        startLocation: locationString,
        startAddress: address,
        status: 'in_progress'
      }).returning();

      console.log(`🚀 Field work started for employee ${employeeId}: ${clientName}`);
      return fieldWork;

    } catch (error) {
      console.error('❌ Error starting field work:', error);
      throw error;
    }
  }

  async endFieldWork(visitId: string, coordinates?: GPSCoordinates, address?: string, notes?: string) {
    try {
      const locationString = coordinates ? `${coordinates.latitude},${coordinates.longitude}` : null;
      
      // Get the field work visit to calculate total distance
      const [visit] = await db.select()
        .from(fieldWorkVisits)
        .where(eq(fieldWorkVisits.id, visitId));

      if (!visit) {
        throw new Error('Field work visit not found');
      }

      let totalDistance = 0;
      if (visit.startLocation && coordinates) {
        const startCoords = visit.startLocation.split(',');
        totalDistance = this.calculateDistance(
          parseFloat(startCoords[0]), parseFloat(startCoords[1]),
          coordinates.latitude, coordinates.longitude
        );
      }

      const [updatedVisit] = await db.update(fieldWorkVisits)
        .set({
          endTime: new Date(),
          endLocation: locationString,
          endAddress: address,
          distance: totalDistance.toFixed(2),
          status: 'completed',
          notes
        })
        .where(eq(fieldWorkVisits.id, visitId))
        .returning();

      console.log(`✅ Field work completed for visit ${visitId}, total distance: ${totalDistance.toFixed(2)} km`);
      return updatedVisit;

    } catch (error) {
      console.error('❌ Error ending field work:', error);
      throw error;
    }
  }

  async getEmployeeLocationHistory(employeeId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get field work history
    const fieldWorkHistory = await db.select()
      .from(fieldWorkVisits)
      .where(eq(fieldWorkVisits.employeeId, employeeId))
      .orderBy(desc(fieldWorkVisits.startTime));

    // Get attendance location history
    const attendanceHistory = await db.select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.employeeId, employeeId))
      .orderBy(desc(attendanceRecords.date));

    return {
      fieldWork: fieldWorkHistory,
      attendance: attendanceHistory.filter(record => 
        record.punchInLocation || record.punchOutLocation
      )
    };
  }

  async generateLocationReport(employeeId: string, fromDate: string, toDate: string) {
    const visits = await db.select()
      .from(fieldWorkVisits)
      .where(and(
        eq(fieldWorkVisits.employeeId, employeeId),
        // Add date filtering here
      ))
      .orderBy(desc(fieldWorkVisits.startTime));

    const totalDistance = visits
      .filter((visit: any) => visit.distance)
      .reduce((sum: number, visit: any) => sum + parseFloat(visit.distance!), 0);

    const totalHours = visits
      .filter((visit: any) => visit.startTime && visit.endTime)
      .reduce((sum: number, visit: any) => {
        const start = new Date(visit.startTime);
        const end = new Date(visit.endTime!);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);

    return {
      employeeId,
      period: { fromDate, toDate },
      totalFieldWorkVisits: fieldWorkVisits.length,
      totalDistanceTraveled: totalDistance.toFixed(2),
      totalFieldWorkHours: totalHours.toFixed(2),
      visits
    };
  }
}

export const gpsTrackingService = new GPSTrackingService();