import { db } from "./db";
import { esslDevices, rawPunchData, attendanceRecords, employees } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import net from "net";

export interface EsslPunchRecord {
  userId: string;
  timestamp: Date;
  punchType: 'in' | 'out';
  deviceId: string;
}

export class EsslIntegrationService {
  private connections = new Map<string, net.Socket>();
  private syncInterval: NodeJS.Timeout | null = null;

  async startSync() {
    console.log("🔄 Starting eSSL device synchronization...");
    
    // Get all active eSSL devices
    const devices = await db.select().from(esslDevices);
    
    for (const device of devices) {
      await this.connectToDevice(device);
    }

    // Start periodic sync every 5 minutes
    this.syncInterval = setInterval(async () => {
      await this.syncAllDevices();
    }, 5 * 60 * 1000);

    console.log(`✅ eSSL sync started for ${devices.length} devices`);
  }

  async stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Close all connections
    for (const [deviceId, socket] of Array.from(this.connections)) {
      socket.destroy();
      console.log(`🔌 Disconnected from device ${deviceId}`);
    }
    this.connections.clear();
  }

  private async connectToDevice(device: any) {
    try {
      const socket = new net.Socket();
      
      socket.connect(device.port, device.ipAddress, () => {
        console.log(`🔗 Connected to eSSL device ${device.deviceId} at ${device.ipAddress}:${device.port}`);
        this.connections.set(device.deviceId, socket);
      });

      socket.on('data', async (data) => {
        await this.processDeviceData(device.deviceId, data);
      });

      socket.on('error', (error) => {
        console.error(`❌ eSSL device ${device.deviceId} connection error:`, error);
        this.connections.delete(device.deviceId);
      });

      socket.on('close', () => {
        console.log(`🔌 eSSL device ${device.deviceId} connection closed`);
        this.connections.delete(device.deviceId);
      });

    } catch (error) {
      console.error(`❌ Failed to connect to eSSL device ${device.deviceId}:`, error);
    }
  }

  private async processDeviceData(deviceId: string, data: Buffer) {
    try {
      // Parse eSSL data format (simplified - actual format depends on eSSL protocol)
      const dataString = data.toString();
      const records = this.parseEsslData(dataString);

      for (const record of records) {
        await this.storePunchRecord(deviceId, record);
        await this.processAttendance(record);
      }
    } catch (error) {
      console.error(`❌ Error processing data from device ${deviceId}:`, error);
    }
  }

  private parseEsslData(data: string): EsslPunchRecord[] {
    // Simplified parser - actual implementation would depend on eSSL protocol
    // Format example: "USER_ID,TIMESTAMP,PUNCH_TYPE"
    const records: EsslPunchRecord[] = [];
    
    try {
      const lines = data.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 3) {
          records.push({
            userId: parts[0].trim(),
            timestamp: new Date(parts[1].trim()),
            punchType: parts[2].trim().toLowerCase() === '1' ? 'in' : 'out',
            deviceId: parts[3]?.trim() || 'unknown'
          });
        }
      }
    } catch (error) {
      console.error('❌ Error parsing eSSL data:', error);
    }

    return records;
  }

  private async storePunchRecord(deviceId: string, record: EsslPunchRecord) {
    try {
      // Note: rawPunchData table should be defined in schema.ts
      // This is a placeholder for now
      console.log(`📝 Storing punch record:`, { deviceId, record });
    } catch (error) {
      console.error('❌ Error storing punch record:', error);
    }
  }

  private async processAttendance(record: EsslPunchRecord) {
    try {
      // Find employee by eSSL employee ID
      const [employee] = await db.select()
        .from(employees)
        .where(eq(employees.esslEmployeeId, record.userId));

      if (!employee) {
        console.warn(`⚠️ Employee not found for eSSL ID: ${record.userId}`);
        return;
      }

      const today = record.timestamp.toISOString().split('T')[0];

      if (record.punchType === 'in') {
        // Check if already punched in today
        const [existing] = await db.select()
          .from(attendanceRecords)
          .where(and(
            eq(attendanceRecords.employeeId, employee.id),
            eq(attendanceRecords.date, today)
          ));

        if (existing && existing.punchIn && !existing.punchOut) {
          console.log(`ℹ️ Employee ${employee.name} already punched in today`);
          return;
        }

        // Create or update attendance record
        if (existing) {
          await db.update(attendanceRecords)
            .set({
              punchIn: record.timestamp,
              status: 'present'
            })
            .where(eq(attendanceRecords.id, existing.id));
        } else {
          await db.insert(attendanceRecords).values({
            employeeId: employee.id,
            date: today,
            punchIn: record.timestamp,
            status: 'present'
          });
        }

        console.log(`✅ Punch-in recorded for ${employee.name} at ${record.timestamp}`);

      } else if (record.punchType === 'out') {
        // Find today's punch-in record
        const [existing] = await db.select()
          .from(attendanceRecords)
          .where(and(
            eq(attendanceRecords.employeeId, employee.id),
            eq(attendanceRecords.date, today)
          ));

        if (!existing || !existing.punchIn) {
          console.warn(`⚠️ No punch-in record found for ${employee.name} today`);
          return;
        }

        // Calculate working hours
        const punchInTime = new Date(existing.punchIn);
        const workingMs = record.timestamp.getTime() - punchInTime.getTime();
        const workingHours = Number((workingMs / (1000 * 60 * 60)).toFixed(2));
        const overtimeHours = Math.max(0, workingHours - 8);

        // Update attendance record
        await db.update(attendanceRecords)
          .set({
            punchOut: record.timestamp,
            workingHours: workingHours.toFixed(2),
            overtimeHours: overtimeHours.toFixed(2)
          })
          .where(eq(attendanceRecords.id, existing.id));

        console.log(`✅ Punch-out recorded for ${employee.name} at ${record.timestamp}, worked ${workingHours} hours`);
      }

    } catch (error) {
      console.error('❌ Error processing attendance:', error);
    }
  }

  async syncAllDevices() {
    console.log("🔄 Syncing all eSSL devices...");
    const devices = await db.select().from(esslDevices);

    for (const device of devices) {
      const socket = this.connections.get(device.deviceId);
      if (socket) {
        // Send sync command (format depends on eSSL protocol)
        socket.write("SYNC\n");
      } else {
        // Reconnect if disconnected
        await this.connectToDevice(device);
      }
    }
  }

  async manualSync(deviceId: string) {
    const socket = this.connections.get(deviceId);
    if (socket) {
      socket.write("SYNC\n");
      return true;
    }
    return false;
  }

  getDeviceStatus() {
    const devices = Array.from(this.connections.keys());
    return {
      connectedDevices: devices.length,
      devices: devices
    };
  }
}

export const esslService = new EsslIntegrationService();