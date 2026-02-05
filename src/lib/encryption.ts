/**
 * Token Encryption Utility
 * 
 * Provides AES-256-GCM encryption for OAuth tokens stored in the database.
 * Uses Web Crypto API for Edge runtime compatibility.
 * 
 * IMPORTANT: Set TOKEN_ENCRYPTION_KEY in environment variables (32-byte hex string)
 * Generate with: openssl rand -hex 32
 */

// Check if encryption is configured
function getEncryptionKey(): string | null {
  return process.env.TOKEN_ENCRYPTION_KEY || null
}

/**
 * Check if encryption is enabled
 * Encryption is optional - if no key is set, tokens are stored in plain text
 */
export function isEncryptionEnabled(): boolean {
  return !!getEncryptionKey()
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Encrypt a token using AES-256-GCM
 * Returns format: iv:ciphertext:tag (all hex encoded)
 * 
 * If encryption is not configured, returns the token as-is
 */
export async function encryptToken(plainToken: string): Promise<string> {
  const keyHex = getEncryptionKey()
  
  // If no encryption key, return plain token (graceful degradation)
  if (!keyHex) {
    return plainToken
  }

  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(plainToken)
    
    // Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    // Import key - use ArrayBuffer explicitly for compatibility
    const keyBytes = hexToBytes(keyHex)
    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes.buffer as ArrayBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    )
    
    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      data
    )
    
    // The encrypted data includes the auth tag at the end (16 bytes)
    const encryptedBytes = new Uint8Array(encrypted)
    
    // Format: iv:ciphertext (hex encoded)
    return `enc:${bytesToHex(iv)}:${bytesToHex(encryptedBytes)}`
  } catch (error) {
    console.error('[Encryption] Failed to encrypt token:', error)
    // In case of encryption failure, return plain token to avoid blocking
    // This should be monitored in production
    return plainToken
  }
}

/**
 * Decrypt a token using AES-256-GCM
 * Expects format: enc:iv:ciphertext (all hex encoded)
 * 
 * If token doesn't have 'enc:' prefix, assumes it's plain text and returns as-is
 * This allows for gradual migration of existing tokens
 */
export async function decryptToken(encryptedToken: string): Promise<string> {
  // If not encrypted (no 'enc:' prefix), return as-is
  // This handles legacy plain-text tokens during migration
  if (!encryptedToken.startsWith('enc:')) {
    return encryptedToken
  }
  
  const keyHex = getEncryptionKey()
  
  // If no encryption key but token is encrypted, we can't decrypt
  if (!keyHex) {
    console.error('[Encryption] Token is encrypted but TOKEN_ENCRYPTION_KEY is not set')
    throw new Error('Cannot decrypt token: encryption key not configured')
  }

  try {
    // Parse the encrypted format: enc:iv:ciphertext
    const parts = encryptedToken.split(':')
    if (parts.length !== 3 || parts[0] !== 'enc') {
      throw new Error('Invalid encrypted token format')
    }
    
    const iv = hexToBytes(parts[1])
    const ciphertext = hexToBytes(parts[2])
    
    // Import key - use ArrayBuffer explicitly for compatibility
    const keyBytes = hexToBytes(keyHex)
    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes.buffer as ArrayBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      ciphertext.buffer as ArrayBuffer
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (error) {
    console.error('[Encryption] Failed to decrypt token:', error)
    throw new Error('Failed to decrypt token')
  }
}

/**
 * Encrypt multiple tokens at once (for bulk operations)
 */
export async function encryptTokens(tokens: { 
  access_token?: string | null
  refresh_token?: string | null 
}): Promise<{
  access_token?: string | null
  refresh_token?: string | null
}> {
  const result: { access_token?: string | null; refresh_token?: string | null } = {}
  
  if (tokens.access_token) {
    result.access_token = await encryptToken(tokens.access_token)
  }
  
  if (tokens.refresh_token) {
    result.refresh_token = await encryptToken(tokens.refresh_token)
  }
  
  return result
}

/**
 * Decrypt multiple tokens at once
 */
export async function decryptTokens(tokens: {
  access_token?: string | null
  refresh_token?: string | null
}): Promise<{
  access_token?: string | null
  refresh_token?: string | null
}> {
  const result: { access_token?: string | null; refresh_token?: string | null } = {}
  
  if (tokens.access_token) {
    result.access_token = await decryptToken(tokens.access_token)
  }
  
  if (tokens.refresh_token) {
    result.refresh_token = await decryptToken(tokens.refresh_token)
  }
  
  return result
}
