import { randomBytes } from 'node:crypto';

const PBKDF2_ITERATIONS = 100_000;

async function pbkdf2(password, salt, iterations) {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, keyMaterial, 256);
  return new Uint8Array(bits);
}

function toHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

const jwtSecret = randomBytes(32).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);

const password = 'ChangeMe123!';
for (const email of ['admin@clinic.local', 'doctor@clinic.local', 'staff@clinic.local']) {
  const hash = await hashPassword(password);
  console.log(email + '=' + hash);
}
