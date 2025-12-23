/**
 * crypto.js - API key encryption/decryption utilities
 * Uses AES-256-CBC algorithm for secure storage
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Get secret key from environment variable
 * @returns {Buffer} 32-byte secret key
 */
function getSecretKey() {
  const secretKey = process.env.SECRET_KEY || 'default_secret_key_32_characters!';
  // Ensure the key is exactly 32 bytes
  return crypto.createHash('sha256').update(secretKey).digest();
}

/**
 * Encrypt text using AES-256-CBC
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted string in format: iv:encryptedText (base64)
 */
export function encrypt(text) {
  if (!text) return null;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getSecretKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Return iv:encrypted format
  return `${iv.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt text using AES-256-CBC
 * @param {string} encryptedText - Encrypted string in format: iv:encryptedText
 * @returns {string} Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return null;
  
  const [ivBase64, encrypted] = encryptedText.split(':');
  if (!ivBase64 || !encrypted) {
    throw new Error('Invalid encrypted text format');
  }
  
  const iv = Buffer.from(ivBase64, 'base64');
  const key = getSecretKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate a random secret key
 * @returns {string} Random 32-character hex string
 */
export function generateSecretKey() {
  return crypto.randomBytes(16).toString('hex');
}

