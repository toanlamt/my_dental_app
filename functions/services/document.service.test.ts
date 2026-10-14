import { describe, it, expect } from 'vitest';
import { generateObjectKey } from './document.service';

describe('Document Service', () => {
  describe('generateObjectKey', () => {
    it('generates safe R2 object keys using standard UUIDs', () => {
      const patientId = 'p-12345';
      const key1 = generateObjectKey(patientId);
      const key2 = generateObjectKey(patientId);

      expect(key1).not.toBe(key2);
      expect(key1).toMatch(/^patients\/p-12345\/documents\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(key2).toMatch(/^patients\/p-12345\/documents\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });
});
