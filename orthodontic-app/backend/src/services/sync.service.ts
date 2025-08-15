import { prisma } from '../config/database.js';
import { connectMySQL } from '../config/database.js';
import { logger, dbLogger } from '../utils/logger.js';
import { PatientService } from './patient.service.js';
import { BadRequestError, NotFoundError } from '../middleware/error.js';

export interface BookingSystemData {
  id: number;
  booking_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface SyncResult {
  success: boolean;
  totalBookings: number;
  newPatients: number;
  newAppointments: number;
  updatedAppointments: number;
  errors: string[];
}

export interface SyncStats {
  lastSyncAt?: Date;
  totalSynced: number;
  pendingSync: number;
  failedSync: number;
}

export class SyncService {
  /**
   * Sync all bookings from legacy MySQL system
   */
  static async syncAllBookings(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      totalBookings: 0,
      newPatients: 0,
      newAppointments: 0,
      updatedAppointments: 0,
      errors: [],
    };

    try {
      const mysql = await connectMySQL();
      
      // Get all confirmed bookings from MySQL
      const [rows] = await mysql.execute(`
        SELECT * FROM bookings 
        WHERE status = 'confirmed' 
        AND appointment_date >= CURDATE()
        ORDER BY appointment_date ASC, appointment_time ASC
      `);

      const bookings = rows as BookingSystemData[];
      result.totalBookings = bookings.length;

      logger.info('Starting booking sync', {
        totalBookings: bookings.length,
        userId,
      });

      // Process each booking
      for (const booking of bookings) {
        try {
          await this.syncSingleBooking(booking, userId);
          
          // Check if new patient was created
          const patient = await this.findOrCreatePatient(booking, userId);
          if (patient.wasCreated) {
            result.newPatients++;
          }

          // Check if new appointment was created
          const appointment = await this.findOrCreateAppointment(booking, patient.patient.id, userId);
          if (appointment.wasCreated) {
            result.newAppointments++;
          } else if (appointment.wasUpdated) {
            result.updatedAppointments++;
          }

        } catch (error) {
          const errorMessage = `Failed to sync booking ${booking.booking_number}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMessage);
          logger.error('Booking sync error', {
            bookingNumber: booking.booking_number,
            error: errorMessage,
          });
        }
      }

      result.success = result.errors.length === 0;

      // Update sync statistics
      await this.updateSyncStats({
        totalSynced: result.totalBookings - result.errors.length,
        failedSync: result.errors.length,
      });

      logger.info('Booking sync completed', {
        ...result,
        userId,
      });

      return result;
    } catch (error) {
      logger.error('Booking sync failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      
      result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Sync single booking
   */
  static async syncSingleBooking(booking: BookingSystemData, userId: string): Promise<void> {
    try {
      // Find or create patient
      const patientResult = await this.findOrCreatePatient(booking, userId);
      
      // Find or create appointment
      await this.findOrCreateAppointment(booking, patientResult.patient.id, userId);

      dbLogger.info('Single booking synced', {
        bookingNumber: booking.booking_number,
        patientId: patientResult.patient.id,
        wasNewPatient: patientResult.wasCreated,
      });
    } catch (error) {
      dbLogger.error('Single booking sync failed', {
        bookingNumber: booking.booking_number,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Find existing patient or create new one
   */
  private static async findOrCreatePatient(
    booking: BookingSystemData,
    userId: string
  ): Promise<{ patient: any; wasCreated: boolean }> {
    try {
      // Try to find existing patient by email or phone
      let existingPatient = null;
      
      if (booking.email) {
        existingPatient = await prisma.patient.findFirst({
          where: { email: booking.email.toLowerCase() }
        });
      }
      
      if (!existingPatient && booking.phone) {
        existingPatient = await prisma.patient.findFirst({
          where: { phone: booking.phone }
        });
      }

      if (existingPatient) {
        return { patient: existingPatient, wasCreated: false };
      }

      // Create new patient
      const newPatient = await PatientService.createPatient({
        firstName: booking.first_name || 'Unknown',
        lastName: booking.last_name || 'Patient',
        email: booking.email,
        phone: booking.phone,
        referralSource: 'Legacy Booking System',
        createdBy: userId,
      });

      return { patient: newPatient, wasCreated: true };
    } catch (error) {
      logger.error('Find or create patient failed', {
        bookingNumber: booking.booking_number,
        email: booking.email,
        phone: booking.phone,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Find existing appointment or create new one
   */
  private static async findOrCreateAppointment(
    booking: BookingSystemData,
    patientId: string,
    userId: string
  ): Promise<{ appointment: any; wasCreated: boolean; wasUpdated: boolean }> {
    try {
      // Check if appointment already exists
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          OR: [
            { legacyBookingId: booking.id.toString() },
            { bookingNumber: booking.booking_number },
          ]
        }
      });

      if (existingAppointment) {
        // Check if appointment needs updating
        const needsUpdate = 
          existingAppointment.appointmentDate.toISOString().split('T')[0] !== booking.appointment_date ||
          existingAppointment.appointmentTime !== booking.appointment_time ||
          existingAppointment.status !== this.mapBookingStatusToAppointmentStatus(booking.status);

        if (needsUpdate) {
          const updatedAppointment = await prisma.appointment.update({
            where: { id: existingAppointment.id },
            data: {
              appointmentDate: new Date(booking.appointment_date),
              appointmentTime: booking.appointment_time,
              status: this.mapBookingStatusToAppointmentStatus(booking.status),
              notes: booking.notes,
            }
          });

          return { appointment: updatedAppointment, wasCreated: false, wasUpdated: true };
        }

        return { appointment: existingAppointment, wasCreated: false, wasUpdated: false };
      }

      // Create new appointment
      const newAppointment = await prisma.appointment.create({
        data: {
          patientId,
          appointmentDate: new Date(booking.appointment_date),
          appointmentTime: booking.appointment_time,
          appointmentType: this.mapServiceTypeToAppointmentType(booking.service_type),
          status: this.mapBookingStatusToAppointmentStatus(booking.status),
          notes: booking.notes,
          legacyBookingId: booking.id.toString(),
          bookingNumber: booking.booking_number,
          createdBy: userId,
        }
      });

      return { appointment: newAppointment, wasCreated: true, wasUpdated: false };
    } catch (error) {
      logger.error('Find or create appointment failed', {
        bookingNumber: booking.booking_number,
        patientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get booking from legacy system by ID
   */
  static async getBookingFromLegacySystem(bookingId: string): Promise<BookingSystemData | null> {
    try {
      const mysql = await connectMySQL();
      
      const [rows] = await mysql.execute(
        'SELECT * FROM bookings WHERE id = ? OR booking_number = ?',
        [bookingId, bookingId]
      );

      const bookings = rows as BookingSystemData[];
      return bookings.length > 0 ? bookings[0] : null;
    } catch (error) {
      logger.error('Get booking from legacy system failed', {
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get recent bookings from legacy system
   */
  static async getRecentBookingsFromLegacySystem(limit: number = 50): Promise<BookingSystemData[]> {
    try {
      const mysql = await connectMySQL();
      
      const [rows] = await mysql.execute(
        `SELECT * FROM bookings 
         WHERE status = 'confirmed' 
         AND appointment_date >= CURDATE() 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [limit]
      );

      return rows as BookingSystemData[];
    } catch (error) {
      logger.error('Get recent bookings from legacy system failed', {
        limit,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Check for conflicts between systems
   */
  static async checkSyncConflicts(): Promise<{
    duplicatePatients: any[];
    duplicateAppointments: any[];
    missingAppointments: any[];
  }> {
    try {
      // Find duplicate patients (same email/phone in both systems)
      const duplicatePatients = await prisma.patient.findMany({
        where: {
          OR: [
            { email: { not: null } },
            { phone: { not: null } },
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        }
      });

      // Find appointments that exist in legacy but not in new system
      const mysql = await connectMySQL();
      const [legacyBookings] = await mysql.execute(
        `SELECT booking_number FROM bookings 
         WHERE status = 'confirmed' 
         AND appointment_date >= CURDATE()`
      );

      const legacyBookingNumbers = (legacyBookings as any[]).map(b => b.booking_number);
      
      const existingAppointments = await prisma.appointment.findMany({
        where: {
          bookingNumber: { in: legacyBookingNumbers }
        },
        select: { bookingNumber: true }
      });

      const existingBookingNumbers = existingAppointments.map(a => a.bookingNumber).filter(Boolean);
      const missingBookingNumbers = legacyBookingNumbers.filter(bn => !existingBookingNumbers.includes(bn));

      return {
        duplicatePatients: [], // Implement duplicate detection logic
        duplicateAppointments: [], // Implement duplicate detection logic
        missingAppointments: missingBookingNumbers.map(bn => ({ bookingNumber: bn })),
      };
    } catch (error) {
      logger.error('Check sync conflicts failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get sync statistics
   */
  static async getSyncStats(): Promise<SyncStats> {
    try {
      // Get last sync time from settings
      const lastSyncSetting = await prisma.setting.findFirst({
        where: { key: 'last_booking_sync' }
      });

      // Count total synced appointments
      const totalSynced = await prisma.appointment.count({
        where: {
          OR: [
            { legacyBookingId: { not: null } },
            { bookingNumber: { not: null } },
          ]
        }
      });

      // Get pending sync count from legacy system
      const mysql = await connectMySQL();
      const [pendingRows] = await mysql.execute(
        `SELECT COUNT(*) as count FROM bookings 
         WHERE status = 'confirmed' 
         AND appointment_date >= CURDATE()`
      );
      
      const totalLegacyBookings = (pendingRows as any[])[0].count;
      const pendingSync = Math.max(0, totalLegacyBookings - totalSynced);

      return {
        lastSyncAt: lastSyncSetting?.value ? new Date(lastSyncSetting.value as string) : undefined,
        totalSynced,
        pendingSync,
        failedSync: 0, // Could be tracked in a separate table
      };
    } catch (error) {
      logger.error('Get sync stats failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update sync statistics
   */
  private static async updateSyncStats(stats: Partial<SyncStats>): Promise<void> {
    try {
      // Update last sync time
      await prisma.setting.upsert({
        where: { key: 'last_booking_sync' },
        update: { value: new Date().toISOString() },
        create: {
          key: 'last_booking_sync',
          value: new Date().toISOString(),
          category: 'sync',
          isPublic: false,
        }
      });

      // Update other stats if needed
      if (stats.totalSynced !== undefined) {
        await prisma.setting.upsert({
          where: { key: 'total_synced_bookings' },
          update: { value: stats.totalSynced },
          create: {
            key: 'total_synced_bookings',
            value: stats.totalSynced,
            category: 'sync',
            isPublic: false,
          }
        });
      }
    } catch (error) {
      logger.error('Update sync stats failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Map service types from booking system to appointment types
   */
  private static mapServiceTypeToAppointmentType(serviceType: string): any {
    const mapping: Record<string, any> = {
      'consultation': 'CONSULTATION',
      'cleaning': 'TREATMENT',
      'filling': 'TREATMENT',
      'orthodontic': 'TREATMENT',
      'emergency': 'EMERGENCY',
      'other': 'CONSULTATION',
    };

    return mapping[serviceType?.toLowerCase()] || 'CONSULTATION';
  }

  /**
   * Map booking status to appointment status
   */
  private static mapBookingStatusToAppointmentStatus(status: string): any {
    const mapping: Record<string, any> = {
      'confirmed': 'CONFIRMED',
      'cancelled': 'CANCELLED',
      'completed': 'COMPLETED',
    };

    return mapping[status?.toLowerCase()] || 'SCHEDULED';
  }

  /**
   * Validate booking data
   */
  private static validateBookingData(booking: BookingSystemData): boolean {
    if (!booking.booking_number || !booking.first_name || !booking.last_name) {
      return false;
    }

    if (!booking.appointment_date || !booking.appointment_time) {
      return false;
    }

    // Validate date format
    const appointmentDate = new Date(booking.appointment_date);
    if (isNaN(appointmentDate.getTime())) {
      return false;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(booking.appointment_time)) {
      return false;
    }

    return true;
  }

  /**
   * Manual sync for specific booking
   */
  static async syncSpecificBooking(bookingId: string, userId: string): Promise<{
    success: boolean;
    patient?: any;
    appointment?: any;
    error?: string;
  }> {
    try {
      const booking = await this.getBookingFromLegacySystem(bookingId);
      
      if (!booking) {
        throw new NotFoundError('Booking not found in legacy system');
      }

      if (!this.validateBookingData(booking)) {
        throw new BadRequestError('Invalid booking data');
      }

      await this.syncSingleBooking(booking, userId);

      const patient = await this.findOrCreatePatient(booking, userId);
      const appointment = await this.findOrCreateAppointment(booking, patient.patient.id, userId);

      return {
        success: true,
        patient: patient.patient,
        appointment: appointment.appointment,
      };
    } catch (error) {
      logger.error('Sync specific booking failed', {
        bookingId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test connection to legacy booking system
   */
  static async testLegacyConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const mysql = await connectMySQL();
      const [rows] = await mysql.execute('SELECT COUNT(*) as count FROM bookings LIMIT 1');
      
      return {
        success: true,
        message: 'Successfully connected to legacy booking system',
      };
    } catch (error) {
      logger.error('Legacy connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

export default SyncService;