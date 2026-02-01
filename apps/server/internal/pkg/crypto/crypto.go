package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"io"
)

var (
	ErrInvalidKey        = errors.New("invalid encryption key length, must be 16, 24, or 32 bytes")
	ErrInvalidCiphertext = errors.New("invalid ciphertext")
	ErrDecryptionFailed  = errors.New("decryption failed")
)

// Encryptor AES-GCM 加密器
type Encryptor struct {
	key []byte
}

// NewEncryptor 创建加密器
// key 长度必须是 16、24 或 32 字节 (AES-128、AES-192、AES-256)
func NewEncryptor(key string) (*Encryptor, error) {
	keyBytes := []byte(key)
	keyLen := len(keyBytes)

	if keyLen != 16 && keyLen != 24 && keyLen != 32 {
		return nil, ErrInvalidKey
	}

	return &Encryptor{key: keyBytes}, nil
}

// Encrypt 加密文本
func (e *Encryptor) Encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(e.key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	// 生成随机 nonce
	nonce := make([]byte, aesGCM.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	// 加密
	ciphertext := aesGCM.Seal(nonce, nonce, []byte(plaintext), nil)

	// Base64 编码
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt 解密文本
func (e *Encryptor) Decrypt(ciphertext string) (string, error) {
	// Base64 解码
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", ErrInvalidCiphertext
	}

	block, err := aes.NewCipher(e.key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := aesGCM.NonceSize()
	if len(data) < nonceSize {
		return "", ErrInvalidCiphertext
	}

	nonce, ciphertextBytes := data[:nonceSize], data[nonceSize:]

	plaintext, err := aesGCM.Open(nil, nonce, ciphertextBytes, nil)
	if err != nil {
		return "", ErrDecryptionFailed
	}

	return string(plaintext), nil
}

// MaskAPIKey 掩码 API 密钥
// 例如: sk-abc123xyz -> sk-abc...xyz
func MaskAPIKey(key string) string {
	if len(key) <= 8 {
		return "***"
	}

	prefix := key[:7]
	suffix := key[len(key)-4:]
	return prefix + "..." + suffix
}

// GetKeyPreview 获取密钥预览
// 返回 "sk-***xyz" 格式
func GetKeyPreview(key string) string {
	if len(key) <= 4 {
		return "***"
	}
	return "***" + key[len(key)-4:]
}
