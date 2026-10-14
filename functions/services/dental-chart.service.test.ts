import { describe, it, expect, vi } from 'vitest';
import { getDentalChart, getDentalChartEntry, updateDentalChartEntry } from './dental-chart.service';
import type { Env } from '../lib/db';
import type { DentalChartEntry } from '../lib/types';

describe('Dental Chart Service', () => {
  const PERMANENT_TEETH_COUNT = 32;

  function createMockDb(handlers?: {
    firstHandler?: (sql: string, params: unknown[]) => Promise<unknown>;
    allHandler?: (sql: string, params: unknown[]) => Promise<{ results: unknown[] }>;
    runHandler?: (sql: string, params: unknown[]) => Promise<{ success: boolean }>;
  }): Env['DB'] {
    return {
      prepare: vi.fn().mockImplementation((sql: string) => {
        let boundParams: unknown[] = [];
        const stmt = {
          bind: vi.fn().mockImplementation((...args: unknown[]) => {
            boundParams = args;
            return stmt;
          }),
          first: vi.fn().mockImplementation(async () => {
            return handlers?.firstHandler ? handlers.firstHandler(sql, boundParams) : null;
          }),
          all: vi.fn().mockImplementation(async () => {
            return handlers?.allHandler ? handlers.allHandler(sql, boundParams) : { results: [] };
          }),
          run: vi.fn().mockImplementation(async () => {
            return handlers?.runHandler ? handlers.runHandler(sql, boundParams) : { success: true };
          }),
        };
        return stmt;
      }),
    } as unknown as Env['DB'];
  }

  describe('getDentalChart', () => {
    it('returns all 32 permanent teeth with healthy default when patient has no records', async () => {
      const mockDb = createMockDb({
        allHandler: async () => ({ results: [] }),
      });

      const teeth = await getDentalChart(mockDb, 'patient-1');

      expect(teeth).toHaveLength(PERMANENT_TEETH_COUNT);
      expect(teeth[0]).toEqual({
        id: '',
        patient_id: 'patient-1',
        tooth_number: 11,
        status: 'healthy',
        notes: null,
        created_at: '',
        updated_at: '',
        updated_by: null,
      });

      // Verify tooth numbers match the FDI permanent teeth sequence
      const expectedTeeth = [
        11, 12, 13, 14, 15, 16, 17, 18,
        21, 22, 23, 24, 25, 26, 27, 28,
        31, 32, 33, 34, 35, 36, 37, 38,
        41, 42, 43, 44, 45, 46, 47, 48,
      ];
      expect(teeth.map((t) => t.tooth_number)).toEqual(expectedTeeth);
      expect(teeth.every((t) => t.status === 'healthy')).toBe(true);
    });

    it('merges existing recorded teeth into the chart at their correct positions', async () => {
      const existingEntry: DentalChartEntry = {
        id: 'entry-16',
        patient_id: 'patient-1',
        tooth_number: 16,
        status: 'caries',
        notes: 'Deep occlusal cavity',
        created_at: '2026-10-01T08:00:00Z',
        updated_at: '2026-10-01T08:00:00Z',
        updated_by: 'doc-1',
      };

      const mockDb = createMockDb({
        allHandler: async () => ({ results: [existingEntry] }),
      });

      const teeth = await getDentalChart(mockDb, 'patient-1');

      expect(teeth).toHaveLength(PERMANENT_TEETH_COUNT);
      const tooth16 = teeth.find((t) => t.tooth_number === 16);
      expect(tooth16).toEqual(existingEntry);

      // Remaining teeth should still be healthy defaults
      const tooth11 = teeth.find((t) => t.tooth_number === 11);
      expect(tooth11?.status).toBe('healthy');
      expect(tooth11?.notes).toBeNull();
    });
  });

  describe('getDentalChartEntry', () => {
    it('returns the dental entry for a specific tooth when present', async () => {
      const existingEntry: DentalChartEntry = {
        id: 'entry-21',
        patient_id: 'patient-1',
        tooth_number: 21,
        status: 'crown',
        notes: 'Porcelain crown fitted',
        created_at: '2026-10-02T09:00:00Z',
        updated_at: '2026-10-02T09:00:00Z',
        updated_by: 'doc-2',
      };

      const mockDb = createMockDb({
        firstHandler: async (_sql, params) => {
          if (params[0] === 'patient-1' && params[1] === 21) {
            return existingEntry;
          }
          return null;
        },
      });

      const entry = await getDentalChartEntry(mockDb, 'patient-1', 21);
      expect(entry).toEqual(existingEntry);

      const notFound = await getDentalChartEntry(mockDb, 'patient-1', 99);
      expect(notFound).toBeNull();
    });
  });

  describe('updateDentalChartEntry', () => {
    it('inserts a new entry when no record exists for the tooth', async () => {
      let storedEntry: DentalChartEntry | null = null;
      let insertExecuted = false;

      const mockDb = createMockDb({
        firstHandler: async () => storedEntry,
        runHandler: async (sql, params) => {
          if (sql.includes('INSERT INTO patient_dental_chart')) {
            insertExecuted = true;
            storedEntry = {
              id: params[0] as string,
              patient_id: params[1] as string,
              tooth_number: params[2] as number,
              status: params[3] as DentalChartEntry['status'],
              notes: params[4] as string | null,
              updated_by: params[5] as string,
              created_at: '2026-10-14T10:00:00Z',
              updated_at: '2026-10-14T10:00:00Z',
            };
          }
          return { success: true };
        },
      });

      const updated = await updateDentalChartEntry(
        mockDb,
        'patient-1',
        36,
        { tooth_number: 36, status: 'root_canal', notes: 'RCT started' },
        'doctor-user-1',
      );

      expect(insertExecuted).toBe(true);
      expect(updated).not.toBeNull();
      expect(updated.tooth_number).toBe(36);
      expect(updated.status).toBe('root_canal');
      expect(updated.notes).toBe('RCT started');
      expect(updated.updated_by).toBe('doctor-user-1');
    });

    it('updates existing record when an entry already exists for the tooth', async () => {
      let storedEntry: DentalChartEntry | null = {
        id: 'existing-entry-46',
        patient_id: 'patient-1',
        tooth_number: 46,
        status: 'caries',
        notes: 'Needs restoration',
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
        updated_by: 'doc-old',
      };
      let updateExecuted = false;

      const mockDb = createMockDb({
        firstHandler: async () => storedEntry,
        runHandler: async (sql, params) => {
          if (sql.includes('UPDATE patient_dental_chart')) {
            updateExecuted = true;
            storedEntry = {
              ...storedEntry!,
              status: params[0] as DentalChartEntry['status'],
              notes: params[1] as string | null,
              updated_by: params[2] as string,
              updated_at: '2026-10-14T12:00:00Z',
            };
          }
          return { success: true };
        },
      });

      const result = await updateDentalChartEntry(
        mockDb,
        'patient-1',
        46,
        { tooth_number: 46, status: 'filled', notes: 'Composite filling placed' },
        'doc-new',
      );

      expect(updateExecuted).toBe(true);
      expect(result.id).toBe('existing-entry-46');
      expect(result.status).toBe('filled');
      expect(result.notes).toBe('Composite filling placed');
      expect(result.updated_by).toBe('doc-new');
    });
  });
});
