/**
 * 插件签名验证
 *
 * 用于验证插件的完整性和来源可信度
 */

import type { PluginManifest } from './types'

// ===== 签名类型 =====

/** 签名算法 */
export type SignatureAlgorithm = 'RSA-SHA256' | 'RSA-SHA512' | 'ECDSA-SHA256'

/** 签名信息 */
export interface PluginSignature {
  /** 签名算法 */
  algorithm: SignatureAlgorithm
  /** 签名值 (Base64) */
  signature: string
  /** 签名时间 */
  timestamp: Date
  /** 证书链 */
  certificateChain: string[]
  /** 签名者 ID */
  signerId: string
  /** 签名者名称 */
  signerName?: string
}

/** 签名验证结果 */
export interface SignatureVerificationResult {
  valid: boolean
  trusted: boolean
  expired: boolean
  revoked: boolean
  errors: SignatureError[]
  warnings: SignatureWarning[]
  signerInfo?: SignerInfo
}

export interface SignatureError {
  code: string
  message: string
}

export interface SignatureWarning {
  code: string
  message: string
}

export interface SignerInfo {
  id: string
  name: string
  organization?: string
  email?: string
  verified: boolean
  trustLevel: 'unknown' | 'community' | 'verified' | 'official'
}

/** 证书信息 */
export interface CertificateInfo {
  serialNumber: string
  issuer: string
  subject: string
  validFrom: Date
  validTo: Date
  fingerprint: string
  publicKey: string
}

// ===== 签名验证器 =====

/** 验证器配置 */
export interface SignatureVerifierConfig {
  /** 信任的根证书 */
  trustedRoots: string[]
  /** 证书吊销列表 URL */
  crlUrls?: string[]
  /** 是否检查吊销状态 */
  checkRevocation?: boolean
  /** 允许的算法 */
  allowedAlgorithms?: SignatureAlgorithm[]
  /** 最大证书链长度 */
  maxChainLength?: number
}

/**
 * 插件签名验证器
 */
export class SignatureVerifier {
  private config: SignatureVerifierConfig
  private revokedCerts: Set<string> = new Set()

  constructor(config: SignatureVerifierConfig) {
    this.config = {
      checkRevocation: true,
      allowedAlgorithms: ['RSA-SHA256', 'RSA-SHA512', 'ECDSA-SHA256'],
      maxChainLength: 3,
      ...config,
    }
  }

  /**
   * 验证插件签名
   */
  async verify(
    _manifest: PluginManifest,
    packageData: ArrayBuffer,
    signature: PluginSignature
  ): Promise<SignatureVerificationResult> {
    const errors: SignatureError[] = []
    const warnings: SignatureWarning[] = []

    // 检查算法
    if (!this.config.allowedAlgorithms?.includes(signature.algorithm)) {
      errors.push({
        code: 'INVALID_ALGORITHM',
        message: `不支持的签名算法: ${signature.algorithm}`,
      })
      return this.createResult(false, false, errors, warnings)
    }

    // 检查证书链
    if (signature.certificateChain.length === 0) {
      errors.push({
        code: 'NO_CERTIFICATE',
        message: '缺少证书链',
      })
      return this.createResult(false, false, errors, warnings)
    }

    if (signature.certificateChain.length > (this.config.maxChainLength || 3)) {
      warnings.push({
        code: 'LONG_CHAIN',
        message: '证书链过长',
      })
    }

    // 解析证书
    let signerCert: CertificateInfo
    try {
      signerCert = this.parseCertificate(signature.certificateChain[0])
    } catch {
      errors.push({
        code: 'INVALID_CERTIFICATE',
        message: '无法解析签名者证书',
      })
      return this.createResult(false, false, errors, warnings)
    }

    // 检查证书有效期
    const now = new Date()
    if (now < signerCert.validFrom) {
      errors.push({
        code: 'CERT_NOT_YET_VALID',
        message: '证书尚未生效',
      })
    }
    if (now > signerCert.validTo) {
      errors.push({
        code: 'CERT_EXPIRED',
        message: '证书已过期',
      })
      return this.createResult(false, false, errors, warnings, undefined, true)
    }

    // 检查吊销状态
    if (this.config.checkRevocation) {
      const isRevoked = await this.checkRevocation(signerCert.fingerprint)
      if (isRevoked) {
        errors.push({
          code: 'CERT_REVOKED',
          message: '证书已被吊销',
        })
        return this.createResult(false, false, errors, warnings, undefined, false, true)
      }
    }

    // 验证证书链
    const chainValid = await this.verifyCertificateChain(signature.certificateChain)
    if (!chainValid) {
      errors.push({
        code: 'INVALID_CHAIN',
        message: '证书链验证失败',
      })
      return this.createResult(false, false, errors, warnings)
    }

    // 验证签名
    const signatureValid = await this.verifySignature(
      packageData,
      signature.signature,
      signerCert.publicKey,
      signature.algorithm
    )

    if (!signatureValid) {
      errors.push({
        code: 'INVALID_SIGNATURE',
        message: '签名验证失败',
      })
      return this.createResult(false, false, errors, warnings)
    }

    // 检查是否为可信签名者
    const trusted = this.isTrustedSigner(signerCert)

    // 获取签名者信息
    const signerInfo = this.getSignerInfo(signerCert, signature, trusted)

    return this.createResult(true, trusted, errors, warnings, signerInfo)
  }

  /**
   * 验证签名值
   */
  private async verifySignature(
    data: ArrayBuffer,
    signature: string,
    publicKey: string,
    algorithm: SignatureAlgorithm
  ): Promise<boolean> {
    try {
      // 使用 Web Crypto API
      const cryptoKey = await this.importPublicKey(publicKey, algorithm)
      const signatureBytes = this.base64ToArrayBuffer(signature)

      const algorithmParams = this.getAlgorithmParams(algorithm)

      return await crypto.subtle.verify(algorithmParams, cryptoKey, signatureBytes, data)
    } catch {
      return false
    }
  }

  /**
   * 导入公钥
   */
  private async importPublicKey(
    publicKeyPem: string,
    algorithm: SignatureAlgorithm
  ): Promise<CryptoKey> {
    const pemContents = publicKeyPem
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s/g, '')

    const binaryDer = this.base64ToArrayBuffer(pemContents)

    const keyAlgorithm = algorithm.startsWith('ECDSA')
      ? { name: 'ECDSA', namedCurve: 'P-256' }
      : { name: 'RSASSA-PKCS1-v1_5', hash: algorithm.split('-')[1] }

    return await crypto.subtle.importKey('spki', binaryDer, keyAlgorithm, true, ['verify'])
  }

  /**
   * 获取算法参数
   */
  private getAlgorithmParams(algorithm: SignatureAlgorithm): AlgorithmIdentifier {
    switch (algorithm) {
      case 'RSA-SHA256':
        return { name: 'RSASSA-PKCS1-v1_5' }
      case 'RSA-SHA512':
        return { name: 'RSASSA-PKCS1-v1_5' }
      case 'ECDSA-SHA256':
        return { name: 'ECDSA', hash: 'SHA-256' } as AlgorithmIdentifier
      default:
        throw new Error(`不支持的算法: ${algorithm}`)
    }
  }

  /**
   * 验证证书链
   */
  private async verifyCertificateChain(chain: string[]): Promise<boolean> {
    if (chain.length === 0) return false

    // 检查根证书是否在信任列表中
    const rootCert = chain[chain.length - 1]
    const rootInfo = this.parseCertificate(rootCert)

    const isTrustedRoot = this.config.trustedRoots.some((trusted) => {
      const trustedInfo = this.parseCertificate(trusted)
      return trustedInfo.fingerprint === rootInfo.fingerprint
    })

    if (!isTrustedRoot && chain.length > 1) {
      // 如果不是自签名证书，需要验证完整链
      return false
    }

    // 验证链中每个证书
    for (let i = 0; i < chain.length - 1; i++) {
      const cert = this.parseCertificate(chain[i])
      const issuerCert = this.parseCertificate(chain[i + 1])

      // 检查颁发者匹配
      if (cert.issuer !== issuerCert.subject) {
        return false
      }
    }

    return true
  }

  /**
   * 检查证书吊销状态
   */
  private async checkRevocation(fingerprint: string): Promise<boolean> {
    // 检查本地缓存
    if (this.revokedCerts.has(fingerprint)) {
      return true
    }

    // 从 CRL 检查
    if (this.config.crlUrls) {
      for (const crlUrl of this.config.crlUrls) {
        try {
          const response = await fetch(crlUrl)
          if (response.ok) {
            const crlData = (await response.json()) as { revokedCerts?: string[] }
            if (crlData.revokedCerts?.includes(fingerprint)) {
              this.revokedCerts.add(fingerprint)
              return true
            }
          }
        } catch {
          // 忽略单个 CRL 检查失败
        }
      }
    }

    return false
  }

  /**
   * 解析证书
   */
  private parseCertificate(certPem: string): CertificateInfo {
    // 简化实现：实际应使用 ASN.1 解析
    const pemContent = certPem
      .replace(/-----BEGIN CERTIFICATE-----/, '')
      .replace(/-----END CERTIFICATE-----/, '')
      .replace(/\s/g, '')

    // 计算指纹
    const fingerprint = this.computeFingerprint(pemContent)

    // 从 PEM 中提取信息（简化）
    return {
      serialNumber: this.extractField(certPem, 'serialNumber') || fingerprint.substring(0, 16),
      issuer: this.extractField(certPem, 'issuer') || 'Unknown Issuer',
      subject: this.extractField(certPem, 'subject') || 'Unknown Subject',
      validFrom: new Date(this.extractField(certPem, 'notBefore') || Date.now()),
      validTo: new Date(
        this.extractField(certPem, 'notAfter') || Date.now() + 365 * 24 * 60 * 60 * 1000
      ),
      fingerprint,
      publicKey: certPem,
    }
  }

  /**
   * 提取证书字段（简化实现）
   */
  private extractField(cert: string, field: string): string | null {
    // 实际实现需要 ASN.1 解析
    const regex = new RegExp(`${field}=([^,\\n]+)`)
    const match = cert.match(regex)
    return match ? match[1] : null
  }

  /**
   * 计算指纹
   */
  private computeFingerprint(data: string): string {
    // 简化实现：使用简单哈希
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16).padStart(16, '0')
  }

  /**
   * 检查是否为可信签名者
   */
  private isTrustedSigner(cert: CertificateInfo): boolean {
    // 检查证书是否由可信根签发
    return this.config.trustedRoots.some((root) => {
      const rootInfo = this.parseCertificate(root)
      return cert.issuer.includes(rootInfo.subject) || cert.fingerprint === rootInfo.fingerprint
    })
  }

  /**
   * 获取签名者信息
   */
  private getSignerInfo(
    cert: CertificateInfo,
    signature: PluginSignature,
    trusted: boolean
  ): SignerInfo {
    return {
      id: signature.signerId,
      name: signature.signerName || cert.subject,
      organization: this.extractOrganization(cert.subject),
      verified: trusted,
      trustLevel: this.determineTrustLevel(trusted, signature.signerId),
    }
  }

  /**
   * 提取组织名称
   */
  private extractOrganization(subject: string): string | undefined {
    const match = subject.match(/O=([^,]+)/)
    return match ? match[1] : undefined
  }

  /**
   * 确定信任级别
   */
  private determineTrustLevel(trusted: boolean, signerId: string): SignerInfo['trustLevel'] {
    if (!trusted) return 'unknown'
    if (signerId.startsWith('reverseai-')) return 'official'
    if (signerId.startsWith('verified-')) return 'verified'
    return 'community'
  }

  /**
   * Base64 转 ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * 创建验证结果
   */
  private createResult(
    valid: boolean,
    trusted: boolean,
    errors: SignatureError[],
    warnings: SignatureWarning[],
    signerInfo?: SignerInfo,
    expired: boolean = false,
    revoked: boolean = false
  ): SignatureVerificationResult {
    return { valid, trusted, expired, revoked, errors, warnings, signerInfo }
  }

  /**
   * 添加吊销证书
   */
  addRevokedCert(fingerprint: string): void {
    this.revokedCerts.add(fingerprint)
  }

  /**
   * 清除吊销缓存
   */
  clearRevokedCache(): void {
    this.revokedCerts.clear()
  }
}

// ===== 签名生成 =====

/** 签名生成配置 */
export interface SignatureGeneratorConfig {
  algorithm: SignatureAlgorithm
  privateKey: string
  certificateChain: string[]
  signerId: string
  signerName?: string
}

/**
 * 签名生成器
 */
export class SignatureGenerator {
  private config: SignatureGeneratorConfig

  constructor(config: SignatureGeneratorConfig) {
    this.config = config
  }

  /**
   * 对插件包签名
   */
  async sign(packageData: ArrayBuffer): Promise<PluginSignature> {
    const signature = await this.generateSignature(packageData)

    return {
      algorithm: this.config.algorithm,
      signature,
      timestamp: new Date(),
      certificateChain: this.config.certificateChain,
      signerId: this.config.signerId,
      signerName: this.config.signerName,
    }
  }

  /**
   * 生成签名
   */
  private async generateSignature(data: ArrayBuffer): Promise<string> {
    const privateKey = await this.importPrivateKey()
    const algorithmParams = this.getAlgorithmParams()

    const signature = await crypto.subtle.sign(algorithmParams, privateKey, data)

    return this.arrayBufferToBase64(signature)
  }

  /**
   * 导入私钥
   */
  private async importPrivateKey(): Promise<CryptoKey> {
    const pemContents = this.config.privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '')

    const binaryDer = this.base64ToArrayBuffer(pemContents)

    const keyAlgorithm = this.config.algorithm.startsWith('ECDSA')
      ? { name: 'ECDSA', namedCurve: 'P-256' }
      : { name: 'RSASSA-PKCS1-v1_5', hash: this.config.algorithm.split('-')[1] }

    return await crypto.subtle.importKey('pkcs8', binaryDer, keyAlgorithm, true, ['sign'])
  }

  /**
   * 获取算法参数
   */
  private getAlgorithmParams(): AlgorithmIdentifier {
    switch (this.config.algorithm) {
      case 'RSA-SHA256':
      case 'RSA-SHA512':
        return { name: 'RSASSA-PKCS1-v1_5' }
      case 'ECDSA-SHA256':
        return { name: 'ECDSA', hash: 'SHA-256' } as AlgorithmIdentifier
      default:
        throw new Error(`不支持的算法: ${this.config.algorithm}`)
    }
  }

  /**
   * Base64 转 ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * ArrayBuffer 转 Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
}

// ===== 签名文件处理 =====

/** 签名文件格式 */
export interface SignatureFile {
  version: number
  pluginId: string
  pluginVersion: string
  signatures: PluginSignature[]
  checksums: {
    algorithm: 'SHA-256' | 'SHA-512'
    files: Record<string, string>
  }
}

/**
 * 创建签名文件
 */
export function createSignatureFile(
  pluginId: string,
  pluginVersion: string,
  signatures: PluginSignature[],
  fileChecksums: Record<string, string>
): SignatureFile {
  return {
    version: 1,
    pluginId,
    pluginVersion,
    signatures,
    checksums: {
      algorithm: 'SHA-256',
      files: fileChecksums,
    },
  }
}

/**
 * 解析签名文件
 */
export function parseSignatureFile(content: string): SignatureFile {
  const data = JSON.parse(content)

  // 转换日期字符串
  if (data.signatures) {
    for (const sig of data.signatures) {
      if (typeof sig.timestamp === 'string') {
        sig.timestamp = new Date(sig.timestamp)
      }
    }
  }

  return data as SignatureFile
}

/**
 * 序列化签名文件
 */
export function serializeSignatureFile(signatureFile: SignatureFile): string {
  return JSON.stringify(signatureFile, null, 2)
}

// ===== 校验和计算 =====

/**
 * 计算文件校验和
 */
export async function computeChecksum(
  data: ArrayBuffer,
  algorithm: 'SHA-256' | 'SHA-512' = 'SHA-256'
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(algorithm, data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 验证校验和
 */
export async function verifyChecksum(
  data: ArrayBuffer,
  expectedChecksum: string,
  algorithm: 'SHA-256' | 'SHA-512' = 'SHA-256'
): Promise<boolean> {
  const actualChecksum = await computeChecksum(data, algorithm)
  return actualChecksum.toLowerCase() === expectedChecksum.toLowerCase()
}

/**
 * 计算多个文件的校验和
 */
export async function computeFileChecksums(
  files: Record<string, ArrayBuffer>
): Promise<Record<string, string>> {
  const checksums: Record<string, string> = {}

  for (const [path, data] of Object.entries(files)) {
    checksums[path] = await computeChecksum(data)
  }

  return checksums
}
