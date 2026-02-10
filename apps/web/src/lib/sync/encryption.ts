/**
 * End-to-End Encryption Service
 * @description Used for encrypting/decrypting data during sync
 */

/**
 * Encrypted data
 */
export interface EncryptedData {
  /** Encrypted content (Base64) */
  ciphertext: string
  /** Initialization vector (Base64) */
  iv: string
  /** Salt value (Base64) */
  salt: string
  /** Algorithm version */
  version: number
}

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  /** PBKDF2 iteration count */
  iterations: number
  /** Key length (bits) */
  keyLength: number
  /** Algorithm */
  algorithm: 'AES-GCM'
}

/**
 * Default encryption configuration
 */
const DEFAULT_CONFIG: EncryptionConfig = {
  iterations: 100000,
  keyLength: 256,
  algorithm: 'AES-GCM',
}

/**
 * End-to-end encryption
 */
export class E2EEncryption {
  private config: EncryptionConfig
  private masterKey: CryptoKey | null = null
  private salt: Uint8Array | null = null

  constructor(config: Partial<EncryptionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Initialize encryption key
   */
  async initialize(password: string, existingSalt?: Uint8Array): Promise<Uint8Array> {
    // Generate or use existing salt
    this.salt = existingSalt || crypto.getRandomValues(new Uint8Array(16))

    // Import password as key material
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    // Derive master key
    this.masterKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.salt,
        iterations: this.config.iterations,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: this.config.algorithm, length: this.config.keyLength },
      false,
      ['encrypt', 'decrypt']
    )

    return this.salt
  }

  /**
   * Check if already initialized
   */
  isInitialized(): boolean {
    return this.masterKey !== null
  }

  /**
   * Encrypt data
   */
  async encrypt(data: unknown): Promise<EncryptedData> {
    if (!this.masterKey || !this.salt) {
      throw new Error('Encryption key not yet initialized')
    }

    const iv = crypto.getRandomValues(new Uint8Array(12))
    const plaintext = new TextEncoder().encode(JSON.stringify(data))

    const ciphertext = await crypto.subtle.encrypt(
      { name: this.config.algorithm, iv },
      this.masterKey,
      plaintext
    )

    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv),
      salt: this.arrayBufferToBase64(this.salt),
      version: 1,
    }
  }

  /**
   * Decrypt data
   */
  async decrypt<T = unknown>(encrypted: EncryptedData): Promise<T> {
    if (!this.masterKey) {
      throw new Error('Encryption key not yet initialized')
    }

    const iv = this.base64ToArrayBuffer(encrypted.iv)
    const ciphertext = this.base64ToArrayBuffer(encrypted.ciphertext)

    const plaintext = await crypto.subtle.decrypt(
      { name: this.config.algorithm, iv: new Uint8Array(iv) },
      this.masterKey,
      ciphertext
    )

    const text = new TextDecoder().decode(plaintext)
    return JSON.parse(text) as T
  }

  /**
   * Verify password
   */
  async verifyPassword(
    password: string,
    salt: Uint8Array,
    testData: EncryptedData
  ): Promise<boolean> {
    try {
      const tempEncryption = new E2EEncryption(this.config)
      await tempEncryption.initialize(password, salt)
      await tempEncryption.decrypt(testData)
      return true
    } catch {
      return false
    }
  }

  /**
   * Change password
   */
  async changePassword(
    oldPassword: string,
    newPassword: string,
    encryptedData: EncryptedData[]
  ): Promise<{ newSalt: Uint8Array; reencryptedData: EncryptedData[] }> {
    // First, decrypt all data with the old password
    const decryptedData: unknown[] = []
    for (const encrypted of encryptedData) {
      const decrypted = await this.decrypt(encrypted)
      decryptedData.push(decrypted)
    }

    // Re-initialize with the new password
    const newSalt = await this.initialize(newPassword)

    // Re-encrypt all data
    const reencryptedData: EncryptedData[] = []
    for (const data of decryptedData) {
      const encrypted = await this.encrypt(data)
      reencryptedData.push(encrypted)
    }

    return { newSalt, reencryptedData }
  }

  /**
   * Generate encryption key backup
   */
  async exportKey(): Promise<string> {
    if (!this.masterKey) {
      throw new Error('Encryption key not yet initialized')
    }

    // Note: Cannot directly export a derived key
    // Actual implementation should export recovery information
    throw new Error('Key export requires appropriate security measures')
  }

  /**
   * Clear keys
   */
  clear(): void {
    this.masterKey = null
    this.salt = null
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
}

/**
 * Create encryption instance
 */
export function createEncryption(config?: Partial<EncryptionConfig>): E2EEncryption {
  return new E2EEncryption(config)
}

/**
 * Default encryption instance
 */
let defaultEncryption: E2EEncryption | null = null

/**
 * Get default encryption instance
 */
export function getDefaultEncryption(): E2EEncryption {
  if (!defaultEncryption) {
    defaultEncryption = new E2EEncryption()
  }
  return defaultEncryption
}

/**
 * Simple hash function (used for non-sensitive data)
 */
export async function simpleHash(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
