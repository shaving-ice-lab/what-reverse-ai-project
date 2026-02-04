package webhook

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
)

const (
	SignatureVersion = "v1"
	SignatureHeader  = "X-Agentflow-Signature"
	TimestampHeader  = "X-Agentflow-Timestamp"
	EventHeader      = "X-Agentflow-Event"
	DeliveryHeader   = "X-Agentflow-Delivery"
)

// BuildSignature 生成签名 (v1=hex(hmac_sha256(secret, timestamp.payload)))
func BuildSignature(secret, timestamp string, payload []byte) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(timestamp))
	mac.Write([]byte("."))
	mac.Write(payload)
	return fmt.Sprintf("%s=%s", SignatureVersion, hex.EncodeToString(mac.Sum(nil)))
}

// VerifySignature 校验签名
func VerifySignature(secret, timestamp string, payload []byte, signature string) bool {
	if secret == "" || timestamp == "" || signature == "" {
		return false
	}
	normalized := strings.TrimSpace(signature)
	if strings.HasPrefix(normalized, SignatureVersion+"=") {
		normalized = strings.TrimPrefix(normalized, SignatureVersion+"=")
	}
	expected := BuildSignature(secret, timestamp, payload)
	expected = strings.TrimPrefix(expected, SignatureVersion+"=")
	return hmac.Equal([]byte(normalized), []byte(expected))
}
