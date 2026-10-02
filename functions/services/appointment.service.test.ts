import { describe, it, expect, vi } from 'vitest';
import { createAppointment, AppointmentConflictError, listAppointments } from './appointment.service';
import type { Env } from '../lib/db';

function createMockDb(mockFirst: any = null, mockAll: any = []): Env['DB'] {
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(mockFirst),
    all: vi.fn().mockResolvedValue({ results: mockAll }),
    run: vi.fn().mockResolvedValue({ success: true })
  };
  return {
    prepare: vi.fn().mockReturnValue(stmt)
  } as unknown as Env['DB'];
}

describe('Appointment Service', () => {
  describe('createAppointment', () => {
    it('should create an appointment when there is no conflict', async () => {
      // Mock hasConflict returning null (no conflict)
      // and getAppointmentById returning the created mock appointment
      const mockDb = createMockDb(null); 
      
      // Override the second call to 'first' (which is getAppointmentById inside createAppointment)
      const stmt = mockDb.prepare('dummy');
      (stmt.first as any).mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: '123',
        patient_id: 'p1',
        doctor_id: 'd1',
        start_at: '2026-10-02T10:00:00Z',
        end_at: '2026-10-02T11:00:00Z',
        status: 'scheduled'
      });

      const appointment = await createAppointment(mockDb, {
        patientId: 'p1',
        doctorId: 'd1',
        startTime: '2026-10-02T10:00:00Z',
        endTime: '2026-10-02T11:00:00Z',
        createdBy: 'admin'
      });

      expect(appointment.id).toBe('123');
      expect(appointment.start_time).toBe('2026-10-02T10:00:00Z'); // legacy field applied
    });

    it('should throw AppointmentConflictError when doctor has a time conflict', async () => {
      // Mock hasConflict returning a row (conflict exists)
      const mockDb = createMockDb({ id: 'existing-id' });

      await expect(createAppointment(mockDb, {
        patientId: 'p1',
        doctorId: 'd1',
        startTime: '2026-10-02T10:00:00Z',
        endTime: '2026-10-02T11:00:00Z',
        createdBy: 'admin'
      })).rejects.toThrow(AppointmentConflictError);
    });
  });

  describe('listAppointments', () => {
    it('should build correct queries and apply legacy fields', async () => {
      const mockDb = createMockDb(null, [
        { id: '1', start_at: '2026-10-01', end_at: '2026-10-01' }
      ]);

      const results = await listAppointments(mockDb, { doctorId: 'd1', status: 'confirmed' });
      expect(results.length).toBe(1);
      expect(results[0].start_time).toBe('2026-10-01');
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('doctor_id = ?'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('status = ?'));
    });
  });
});
