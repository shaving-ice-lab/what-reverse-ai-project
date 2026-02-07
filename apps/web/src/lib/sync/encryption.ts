/**
 * endpointtoendpointEncryptService
 * @description Used forDataSynctime'sEncrypt/Decrypt
 */

/**
 * Encryptafter'sData
 */
export interface EncryptedData {
 /** Encryptafter'sContent (Base64) */
 ciphertext: string;
 /** InitialVector (Base64) */
 iv: string;
 /** value (Base64) */
 salt: string;
 /** AlgorithmVersion */
 version: number;
}

/**
 * EncryptConfig
 */
export interface EncryptionConfig {
 /** PBKDF2 Iterationtimescount */
 iterations: number;
 /** KeyLength (bits) */
 keyLength: number;
 /** Algorithm */
 algorithm: 'AES-GCM';
}

/**
 * DefaultEncryptConfig
 */
const DEFAULT_CONFIG: EncryptionConfig = {
 iterations: 100000,
 keyLength: 256,
 algorithm: 'AES-GCM',
};

/**
 * endpointtoendpointEncrypt
 */
export class E2EEncryption {
 private config: EncryptionConfig;
 private masterKey: CryptoKey | null = null;
 private salt: Uint8Array | null = null;

 constructor(config: Partial<EncryptionConfig> = {}) {
 this.config = { ...DEFAULT_CONFIG, ...config };
 }

 /**
 * InitialEncryptKey
 */
 async initialize(password: string, existingSalt?: Uint8Array): Promise<Uint8Array> {
 // GenerateorUsageExisting'svalue
 this.salt = existingSalt || crypto.getRandomValues(new Uint8Array(16));

 // fromPasswordDeriveKey
 const passwordKey = await crypto.subtle.importKey(
 'raw',
 new TextEncoder().encode(password),
 'PBKDF2',
 false,
 ['deriveKey']
 );

 // DerivemainKey
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
 );

 return this.salt;
 }

 /**
 * CheckisnoalreadyInitial
 */
 isInitialized(): boolean {
 return this.masterKey !== null;
 }

 /**
 * EncryptData
 */
 async encrypt(data: unknown): Promise<EncryptedData> {
 if (!this.masterKey || !this.salt) {
 throw new Error('EncryptKeynot yetInitial');
 }

 const iv = crypto.getRandomValues(new Uint8Array(12));
 const plaintext = new TextEncoder().encode(JSON.stringify(data));

 const ciphertext = await crypto.subtle.encrypt(
 { name: this.config.algorithm, iv },
 this.masterKey,
 plaintext
 );

 return {
 ciphertext: this.arrayBufferToBase64(ciphertext),
 iv: this.arrayBufferToBase64(iv),
 salt: this.arrayBufferToBase64(this.salt),
 version: 1,
 };
 }

 /**
 * DecryptData
 */
 async decrypt<T = unknown>(encrypted: EncryptedData): Promise<T> {
 if (!this.masterKey) {
 throw new Error('EncryptKeynot yetInitial');
 }

 const iv = this.base64ToArrayBuffer(encrypted.iv);
 const ciphertext = this.base64ToArrayBuffer(encrypted.ciphertext);

 const plaintext = await crypto.subtle.decrypt(
 { name: this.config.algorithm, iv: new Uint8Array(iv) },
 this.masterKey,
 ciphertext
 );

 const text = new TextDecoder().decode(plaintext);
 return JSON.parse(text) as T;
 }

 /**
 * VerifyPassword
 */
 async verifyPassword(password: string, salt: Uint8Array, testData: EncryptedData): Promise<boolean> {
 try {
 const tempEncryption = new E2EEncryption(this.config);
 await tempEncryption.initialize(password, salt);
 await tempEncryption.decrypt(testData);
 return true;
 } catch {
 return false;
 }
 }

 /**
 * ChangePassword
 */
 async changePassword(
 oldPassword: string,
 newPassword: string,
 encryptedData: EncryptedData[]
 ): Promise<{ newSalt: Uint8Array; reencryptedData: EncryptedData[] }> {
 // firstuseoldPasswordDecryptAllData
 const decryptedData: unknown[] = [];
 for (const encrypted of encryptedData) {
 const decrypted = await this.decrypt(encrypted);
 decryptedData.push(decrypted);
 }

 // useNew Passwordre-newInitial
 const newSalt = await this.initialize(newPassword);

 // re-newEncryptAllData
 const reencryptedData: EncryptedData[] = [];
 for (const data of decryptedData) {
 const encrypted = await this.encrypt(data);
 reencryptedData.push(encrypted);
 }

 return { newSalt, reencryptedData };
 }

 /**
 * GenerateEncryptKeyBackup
 */
 async exportKey(): Promise<string> {
 if (!this.masterKey) {
 throw new Error('EncryptKeynot yetInitial');
 }

 // Note: thisinnotcanDirectExportDeriveKey
 // ActualImplementShouldExportUsed forRestore'sInfo
 throw new Error('KeyExportFeaturesneedneedoutside'sSecurityMeasure');
 }

 /**
 * ClearKey
 */
 clear(): void {
 this.masterKey = null;
 this.salt = null;
 }

 /**
 * ArrayBuffer Base64
 */
 private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
 const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
 let binary = '';
 for (let i = 0; i < bytes.byteLength; i++) {
 binary += String.fromCharCode(bytes[i]);
 }
 return btoa(binary);
 }

 /**
 * Base64 ArrayBuffer
 */
 private base64ToArrayBuffer(base64: string): ArrayBuffer {
 const binary = atob(base64);
 const bytes = new Uint8Array(binary.length);
 for (let i = 0; i < binary.length; i++) {
 bytes[i] = binary.charCodeAt(i);
 }
 return bytes.buffer;
 }
}

/**
 * CreateEncryptInstance
 */
export function createEncryption(config?: Partial<EncryptionConfig>): E2EEncryption {
 return new E2EEncryption(config);
}

/**
 * DefaultEncryptInstance
 */
let defaultEncryption: E2EEncryption | null = null;

/**
 * FetchDefaultEncryptInstance
 */
export function getDefaultEncryption(): E2EEncryption {
 if (!defaultEncryption) {
 defaultEncryption = new E2EEncryption();
 }
 return defaultEncryption;
}

/**
 * SimpleHashcount(Used forSensitiveData)
 */
export async function simpleHash(text: string): Promise<string> {
 const encoder = new TextEncoder();
 const data = encoder.encode(text);
 const hashBuffer = await crypto.subtle.digest('SHA-256', data);
 const hashArray = Array.from(new Uint8Array(hashBuffer));
 return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
