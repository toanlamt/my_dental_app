import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('Password Utility', () => {
  it('should hash a password and verify it correctly', async () => {
    const password = 'SuperSecretPassword123!';
    const hash = await hashPassword(password);
    
    expect(hash).toContain('pbkdf2$100000$');
    
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should fail verification for incorrect password', async () => {
    const password = 'SuperSecretPassword123!';
    const hash = await hashPassword(password);
    
    const isValid = await verifyPassword('WrongPassword', hash);
    expect(isValid).toBe(false);
  });

  it('should fail verification for malformed hash', async () => {
    const isValid = await verifyPassword('password', 'malformed$hash$string');
    expect(isValid).toBe(false);
  });
});
