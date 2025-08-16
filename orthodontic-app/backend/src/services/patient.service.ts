import { ConflictError, NotFoundError } from '../utils/error.handler.js';
import { prisma, connectMySQL } from '../config/database.js';
import { logger, dbLogger } from '../utils/logger.js';
import { Prisma } from '@prisma/client';

export interface CreatePatientData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  medicalHistory?: any;
  allergies?: string;
  medications?: string;
  emergencyContact?: any;
  insuranceInfo?: any;
  orthodonticHistory?: any;
  referralSource?: string;
  createdBy: string;
}

export interface UpdatePatientData extends Partial<Omit<CreatePatientData, 'createdBy'>> {}

export interface PatientSearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: 'firstName' | 'lastName' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
}

export interface PatientWithStats {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  stats: {
    totalPhotos: number;
    totalTreatmentPlans: number;
    totalAppointments: number;
    totalPayments: number;
    lastAppointment?: Date;
    nextAppointment?: Date;
  };
}

export class PatientService {
  /**
   * Create a new patient
   */
  static async createPatient(data: CreatePatientData) {
    try {
      // Check for existing patient with same email or phone
      if (data.email || data.phone) {
        const existingPatient = await prisma.patient.findFirst({
          where: {
            OR: [
              data.email ? { email: data.email.toLowerCase() } : {},
              data.phone ? { phone: data.phone } : {},
            ].filter(condition => Object.keys(condition).length > 0),
            isActive: true,
          }
        });

        if (existingPatient) {
          if (existingPatient.email === data.email?.toLowerCase()) {
            throw new ConflictError('Patient with this email already exists');
          }
          if (existingPatient.phone === data.phone) {
            throw new ConflictError('Patient with this phone number already exists');
          }
        }
      }

      // Create patient
      const patient = await prisma.patient.create({
        data: {
          ...data,
          email: data.email?.toLowerCase(),
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      });

      logger.info('Patient created', {
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        createdBy: data.createdBy,
      });

      return patient;
    } catch (error) {
      logger.error('Create patient failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { ...data, createdBy: '[REDACTED]' },
      });
      throw error;
    }
  }

  /**
   * Get patient by ID with stats
   */
  static async getPatientById(id: string): Promise<PatientWithStats> {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          _count: {
            select: {
              photos: true,
              treatmentPlans: true,
              appointments: true,
              payments: true,
            }
          }
        }
      });

      if (!patient) {
        throw new NotFoundError('Patient not found');
      }

      // Get appointment stats
      const [lastAppointment, nextAppointment] = await Promise.all([
        prisma.appointment.findFirst({
          where: {
            patientId: id,
            status: 'COMPLETED',
          },
          orderBy: { appointmentDate: 'desc' },
          select: { appointmentDate: true },
        }),
        prisma.appointment.findFirst({
          where: {
            patientId: id,
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
            appointmentDate: { gte: new Date() },
          },
          orderBy: { appointmentDate: 'asc' },
          select: { appointmentDate: true },
        }),
      ]);
      
      // ΔΙΟΡΘΩΣΗ: Μετατροπή των null σε undefined για συμβατότητα τύπων
      const patientData = {
          ...patient,
          email: patient.email ?? undefined,
          phone: patient.phone ?? undefined,
          dateOfBirth: patient.dateOfBirth ?? undefined,
          gender: patient.gender ?? undefined,
          address: patient.address ?? undefined,
          city: patient.city ?? undefined,
          postalCode: patient.postalCode ?? undefined,
          country: patient.country ?? undefined,
      };

      return {
        ...patientData,
        stats: {
          totalPhotos: patient._count.photos,
          totalTreatmentPlans: patient._count.treatmentPlans,
          totalAppointments: patient._count.appointments,
          totalPayments: patient._count.payments,
          lastAppointment: lastAppointment?.appointmentDate,
          nextAppointment: nextAppointment?.appointmentDate,
        },
      } as unknown as PatientWithStats;
    } catch (error) {
      logger.error('Get patient by ID failed', {
        patientId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update patient
   */
  static async updatePatient(id: string, data: UpdatePatientData) {
    try {
      // Check if patient exists
      const existingPatient = await prisma.patient.findUnique({
        where: { id },
        select: { id: true, email: true, phone: true },
      });

      if (!existingPatient) {
        throw new NotFoundError('Patient not found');
      }

      // Check for conflicts with email or phone
      if (data.email || data.phone) {
        const conflictingPatient = await prisma.patient.findFirst({
          where: {
            OR: [
              data.email ? { email: data.email.toLowerCase() } : {},
              data.phone ? { phone: data.phone } : {},
            ].filter(condition => Object.keys(condition).length > 0),
            NOT: { id },
            isActive: true,
          }
        });

        if (conflictingPatient) {
          if (conflictingPatient.email === data.email?.toLowerCase()) {
            throw new ConflictError('Another patient with this email already exists');
          }
          if (conflictingPatient.phone === data.phone) {
            throw new ConflictError('Another patient with this phone number already exists');
          }
        }
      }

      // Update patient
      const updatedPatient = await prisma.patient.update({
        where: { id },
        data: {
          ...data,
          email: data.email?.toLowerCase(),
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      });

      logger.info('Patient updated', {
        patientId: updatedPatient.id,
        patientName: `${updatedPatient.firstName} ${updatedPatient.lastName}`,
        updatedFields: Object.keys(data),
      });

      return updatedPatient;
    } catch (error) {
      logger.error('Update patient failed', {
        patientId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Search patients
   */
  static async searchPatients(params: PatientSearchParams) {
    try {
      const {
        query = '',
        page = 1,
        limit = 20,
        sortBy = 'lastName',
        sortOrder = 'asc',
        isActive = true,
      } = params;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.PatientWhereInput = {
        isActive,
      };

      if (query) {
        where.OR = [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ];
      }

      // Execute search
      const [patients, total] = await Promise.all([
        prisma.patient.findMany({
          where,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            city: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                treatmentPlans: true,
                appointments: true,
                photos: true,
              }
            }
          },
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.patient.count({ where }),
      ]);

      return {
        patients,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        }
      };
    } catch (error) {
      logger.error('Search patients failed', {
        params,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Deactivate patient (soft delete)
   */
  static async deactivatePatient(id: string): Promise<void> {
    try {
      const patient = await prisma.patient.update({
        where: { id },
        data: { isActive: false },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      });

      logger.info('Patient deactivated', {
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
      });
    } catch (error) {
      logger.error('Deactivate patient failed', {
        patientId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Reactivate patient
   */
  static async reactivatePatient(id: string): Promise<void> {
    try {
      const patient = await prisma.patient.update({
        where: { id },
        data: { isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      });

      logger.info('Patient reactivated', {
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
      });
    } catch (error) {
      logger.error('Reactivate patient failed', {
        patientId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Import patient from legacy booking system
   */
  static async importFromBookingSystem(bookingId: string, createdBy: string) {
    try {
      const mysql = await connectMySQL();

      // Get booking data from MySQL
      const [rows] = await mysql.execute(
        'SELECT * FROM bookings WHERE id = ? OR booking_number = ?',
        [bookingId, bookingId]
      );

      const bookingData = (rows as any[])[0];
      if (!bookingData) {
        throw new NotFoundError('Booking not found in legacy system');
      }

      // Check if patient already imported
      const existingPatient = await prisma.patient.findFirst({
        where: {
          OR: [
            { email: bookingData.email?.toLowerCase() },
            { phone: bookingData.phone },
          ].filter(condition => Object.keys(condition).length > 0),
        }
      });

      if (existingPatient) {
        // Create appointment link if patient exists
        await this.linkAppointmentToPatient(existingPatient.id, bookingData);
        return existingPatient;
      }

      // Create new patient from booking data
      const patientData: CreatePatientData = {
        firstName: bookingData.first_name || 'Unknown',
        lastName: bookingData.last_name || 'Patient',
        email: bookingData.email,
        phone: bookingData.phone,
        createdBy,
        referralSource: 'Legacy Booking System',
      };

      const patient = await this.createPatient(patientData);

      // Create appointment record
      await this.linkAppointmentToPatient(patient.id, bookingData);

      logger.info('Patient imported from booking system', {
        patientId: patient.id,
        bookingId: bookingData.id,
        bookingNumber: bookingData.booking_number,
      });

      return patient;
    } catch (error) {
      logger.error('Import patient from booking system failed', {
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Link appointment to patient
   */
  private static async linkAppointmentToPatient(patientId: string, bookingData: any) {
    try {
      // Check if appointment already exists
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          OR: [
            { legacyBookingId: bookingData.id?.toString() },
            { bookingNumber: bookingData.booking_number },
          ].filter(condition => Object.keys(condition).length > 0),
        }
      });

      if (existingAppointment) {
        return existingAppointment;
      }

      // Create appointment
      const appointmentData = {
        patientId,
        appointmentDate: new Date(bookingData.appointment_date),
        appointmentTime: bookingData.appointment_time,
        appointmentType: this.mapServiceTypeToAppointmentType(bookingData.service_type),
        status: this.mapBookingStatusToAppointmentStatus(bookingData.status),
        legacyBookingId: bookingData.id?.toString(),
        bookingNumber: bookingData.booking_number,
        notes: bookingData.notes,
        createdBy: patientId, // Use patient ID as creator for imported appointments
      };

      return await prisma.appointment.create({
        data: appointmentData,
      });
    } catch (error) {
      logger.error('Link appointment to patient failed', {
        patientId,
        bookingData: bookingData.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
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

    return mapping[serviceType] || 'CONSULTATION';
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

    return mapping[status] || 'SCHEDULED';
  }

  /**
   * Get patient statistics
   */
  static async getPatientStats() {
    try {
      const [
        totalPatients,
        activePatients,
        newPatientsThisMonth,
        patientsWithTreatmentPlans,
        patientsWithAppointments,
      ] = await Promise.all([
        prisma.patient.count(),
        prisma.patient.count({ where: { isActive: true } }),
        prisma.patient.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            }
          }
        }),
        prisma.patient.count({
          where: {
            treatmentPlans: { some: {} }
          }
        }),
        prisma.patient.count({
          where: {
            appointments: { some: {} }
          }
        }),
      ]);

      return {
        totalPatients,
        activePatients,
        inactivePatients: totalPatients - activePatients,
        newPatientsThisMonth,
        patientsWithTreatmentPlans,
        patientsWithAppointments,
      };
    } catch (error) {
      logger.error('Get patient stats failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get recent patients
   */
  static async getRecentPatients(limit: number = 10) {
    try {
      return await prisma.patient.findMany({
        where: { isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error('Get recent patients failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export default PatientService;