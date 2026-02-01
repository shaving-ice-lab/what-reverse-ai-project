/**
 * 端到端加密服务
 * @description 用于数据同步时的加密/解密
 */

/**
 * 加密后的数据
 */
export interface EncryptedData {
  /** 加密后的内容 (Base64) */
  ciphertext: string;
  /** 初始化向量 (Base64) */
  iv: string;
  /** 盐值 (Base64) */
  salt: string;
  /** 算法版本 */
  version: number;
}

/**
 * 加密配置
 */
export interface EncryptionConfig {
  /** PBKDF2 迭代次数 */
  iterations: number;
  /** 密钥长度 (bits) */
  keyLength: number;
  /** 算法 */
  algorithm: 'AES-GCM';
}

/**
 * 默认加密配置
 */
const DEFAULT_CONFIG: EncryptionConfig = {
  iterations: 100000,
  keyLength: 256,
  algorithm: 'AES-GCM',
};

/**
 * 端到端加密类
 */
export class E2EEncryption {
  private config: EncryptionConfig;
  private masterKey: CryptoKey | null = null;
  private salt: Uint8Array | null = null;

  constructor(config: Partial<EncryptionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 初始化加密密钥
   */
  async initialize(password: string, existingSalt?: Uint8Array): Promise<Uint8Array> {
    // 生成或使用现有的盐值
    this.salt = existingSalt || crypto.getRandomValues(new Uint8Array(16));

    // 从密码派生密钥
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // 派生主密钥
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
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.masterKey !== null;
  }

  /**
   * 加密数据
   */
  async encrypt(data: unknown): Promise<EncryptedData> {
    if (!this.masterKey || !this.salt) {
      throw new Error('加密密钥未初始化');
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
   * 解密数据
   */
  async decrypt<T = unknown>(encrypted: EncryptedData): Promise<T> {
    if (!this.masterKey) {
      throw new Error('加密密钥未初始化');
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
   * 验证密码
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
   * 更改密码
   */
  async changePassword(
    oldPassword: string,
    newPassword: string,
    encryptedData: EncryptedData[]
  ): Promise<{ newSalt: Uint8Array; reencryptedData: EncryptedData[] }> {
    // 先用旧密码解密所有数据
    const decryptedData: unknown[] = [];
    for (const encrypted of encryptedData) {
      const decrypted = await this.decrypt(encrypted);
      decryptedData.push(decrypted);
    }

    // 用新密码重新初始化
    const newSalt = await this.initialize(newPassword);

    // 重新加密所有数据
    const reencryptedData: EncryptedData[] = [];
    for (const data of decryptedData) {
      const encrypted = await this.encrypt(data);
      reencryptedData.push(encrypted);
    }

    return { newSalt, reencryptedData };
  }

  /**
   * 生成加密密钥备份
   */
  async exportKey(): Promise<string> {
    if (!this.masterKey) {
      throw new Error('加密密钥未初始化');
    }

    // 注意：这里不能直接导出派生密钥
    // 实际实现中应该导出用于恢复的信息
    throw new Error('密钥导出功能需要额外的安全措施');
  }

  /**
   * 清除密钥
   */
  clear(): void {
    this.masterKey = null;
    this.salt = null;
  }

  /**
   * ArrayBuffer 转 Base64
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
   * Base64 转 ArrayBuffer
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
 * 创建加密实例
 */
export function createEncryption(config?: Partial<EncryptionConfig>): E2EEncryption {
  return new E2EEncryption(config);
}

/**
 * 默认加密实例
 */
let defaultEncryption: E2EEncryption | null = null;

/**
 * 获取默认加密实例
 */
export function getDefaultEncryption(): E2EEncryption {
  if (!defaultEncryption) {
    defaultEncryption = new E2EEncryption();
  }
  return defaultEncryption;
}

/**
 * 简单哈希函数（用于非敏感数据）
 */
export async function simpleHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
