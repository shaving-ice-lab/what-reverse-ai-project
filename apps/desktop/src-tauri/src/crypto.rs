//! 加密存储模块
//! 
//! 使用 AES-256-GCM 加密敏感数据（如 API Keys）
//! 密钥派生使用 PBKDF2-SHA256

use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use pbkdf2::pbkdf2_hmac_array;
use rand::RngCore;
use sha2::Sha256;

use crate::error::{AppError, AppResult};

/// 加密盐的长度
const SALT_LENGTH: usize = 16;

/// PBKDF2 迭代次数
const PBKDF2_ITERATIONS: u32 = 100_000;

/// Nonce 长度（AES-GCM 标准为 12 字节）
const NONCE_LENGTH: usize = 12;

/// 加密管理器
pub struct CryptoManager {
    /// 派生的加密密钥
    key: [u8; 32],
}

impl CryptoManager {
    /// 使用密码创建加密管理器
    /// 
    /// # Arguments
    /// * `password` - 用户密码或设备标识
    /// * `salt` - 盐值（如果为 None，则生成新盐）
    /// 
    /// # Returns
    /// (CryptoManager, salt_base64)
    pub fn new_with_password(password: &str, salt: Option<&str>) -> AppResult<(Self, String)> {
        let salt_bytes = match salt {
            Some(s) => {
                BASE64.decode(s)
                    .map_err(|e| AppError::Crypto(format!("Invalid salt: {}", e)))?
            }
            None => {
                let mut salt = vec![0u8; SALT_LENGTH];
                OsRng.fill_bytes(&mut salt);
                salt
            }
        };

        let key = pbkdf2_hmac_array::<Sha256, 32>(
            password.as_bytes(),
            &salt_bytes,
            PBKDF2_ITERATIONS,
        );

        let salt_base64 = BASE64.encode(&salt_bytes);
        
        Ok((Self { key }, salt_base64))
    }

    /// 使用设备唯一标识创建加密管理器
    /// 
    /// 这种方式不需要用户输入密码，但安全性较低
    pub fn new_with_device_id() -> AppResult<Self> {
        let device_id = get_device_id()?;
        let (manager, _) = Self::new_with_password(&device_id, Some("YWdlbnRmbG93X3NhbHQ="))?;
        Ok(manager)
    }

    /// 加密数据
    /// 
    /// # Arguments
    /// * `plaintext` - 明文数据
    /// 
    /// # Returns
    /// (encrypted_base64, nonce_base64)
    pub fn encrypt(&self, plaintext: &str) -> AppResult<(String, String)> {
        let cipher = Aes256Gcm::new_from_slice(&self.key)
            .map_err(|e| AppError::Crypto(format!("Failed to create cipher: {}", e)))?;

        // 生成随机 nonce
        let mut nonce_bytes = [0u8; NONCE_LENGTH];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        // 加密
        let ciphertext = cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| AppError::Crypto(format!("Encryption failed: {}", e)))?;

        let encrypted_base64 = BASE64.encode(&ciphertext);
        let nonce_base64 = BASE64.encode(&nonce_bytes);

        Ok((encrypted_base64, nonce_base64))
    }

    /// 解密数据
    /// 
    /// # Arguments
    /// * `encrypted_base64` - Base64 编码的密文
    /// * `nonce_base64` - Base64 编码的 nonce
    /// 
    /// # Returns
    /// 解密后的明文
    pub fn decrypt(&self, encrypted_base64: &str, nonce_base64: &str) -> AppResult<String> {
        let cipher = Aes256Gcm::new_from_slice(&self.key)
            .map_err(|e| AppError::Crypto(format!("Failed to create cipher: {}", e)))?;

        let ciphertext = BASE64.decode(encrypted_base64)
            .map_err(|e| AppError::Crypto(format!("Invalid ciphertext: {}", e)))?;
        
        let nonce_bytes = BASE64.decode(nonce_base64)
            .map_err(|e| AppError::Crypto(format!("Invalid nonce: {}", e)))?;
        
        if nonce_bytes.len() != NONCE_LENGTH {
            return Err(AppError::Crypto("Invalid nonce length".to_string()));
        }
        
        let nonce = Nonce::from_slice(&nonce_bytes);

        let plaintext = cipher
            .decrypt(nonce, ciphertext.as_ref())
            .map_err(|e| AppError::Crypto(format!("Decryption failed: {}", e)))?;

        String::from_utf8(plaintext)
            .map_err(|e| AppError::Crypto(format!("Invalid UTF-8: {}", e)))
    }
}

/// 获取设备唯一标识
/// 
/// 组合多个系统信息生成伪唯一标识
fn get_device_id() -> AppResult<String> {
    use std::env;
    
    let mut parts = Vec::new();
    
    // 用户名
    if let Ok(user) = env::var("USERNAME").or_else(|_| env::var("USER")) {
        parts.push(user);
    }
    
    // 计算机名
    if let Ok(computer) = env::var("COMPUTERNAME").or_else(|_| env::var("HOSTNAME")) {
        parts.push(computer);
    }
    
    // 操作系统
    parts.push(env::consts::OS.to_string());
    parts.push(env::consts::ARCH.to_string());
    
    // 如果没有足够信息，使用固定值
    if parts.is_empty() {
        parts.push("agentflow-default".to_string());
    }
    
    Ok(parts.join("-"))
}

/// 生成 API Key 的提示（后4位）
pub fn generate_key_hint(api_key: &str) -> String {
    if api_key.len() >= 4 {
        format!("****{}", &api_key[api_key.len() - 4..])
    } else {
        "****".to_string()
    }
}

/// 生成随机 ID
pub fn generate_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let (crypto, _salt) = CryptoManager::new_with_password("test-password", None).unwrap();
        
        let plaintext = "sk-1234567890abcdef";
        let (encrypted, nonce) = crypto.encrypt(plaintext).unwrap();
        
        // 确保加密后的数据不同于原文
        assert_ne!(encrypted, plaintext);
        
        // 解密
        let decrypted = crypto.decrypt(&encrypted, &nonce).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_encrypt_with_same_salt() {
        let salt = "dGVzdC1zYWx0LXZhbHVl"; // base64 encoded
        
        let (crypto1, _) = CryptoManager::new_with_password("password", Some(salt)).unwrap();
        let (crypto2, _) = CryptoManager::new_with_password("password", Some(salt)).unwrap();
        
        let plaintext = "secret-api-key";
        let (encrypted, nonce) = crypto1.encrypt(plaintext).unwrap();
        
        // 使用相同密码和盐创建的 manager 应该能解密
        let decrypted = crypto2.decrypt(&encrypted, &nonce).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_key_hint() {
        assert_eq!(generate_key_hint("sk-1234567890"), "****7890");
        assert_eq!(generate_key_hint("abc"), "****");
        assert_eq!(generate_key_hint(""), "****");
    }

    #[test]
    fn test_device_crypto() {
        let crypto = CryptoManager::new_with_device_id().unwrap();
        
        let plaintext = "test-api-key";
        let (encrypted, nonce) = crypto.encrypt(plaintext).unwrap();
        let decrypted = crypto.decrypt(&encrypted, &nonce).unwrap();
        
        assert_eq!(decrypted, plaintext);
    }
}
