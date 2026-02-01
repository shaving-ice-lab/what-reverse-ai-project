package payment

import (
	"time"

	"github.com/google/uuid"
)

// =====================
// 支付渠道类型
// =====================

// PaymentChannel 支付渠道类型
type PaymentChannel string

const (
	ChannelAlipay PaymentChannel = "alipay" // 支付宝
	ChannelWechat PaymentChannel = "wechat" // 微信支付
	ChannelBank   PaymentChannel = "bank"   // 银行转账
	ChannelMock   PaymentChannel = "mock"   // 模拟（测试用）
)

// =====================
// 转账请求
// =====================

// TransferRequest 转账请求
type TransferRequest struct {
	// 业务信息
	WithdrawalID uuid.UUID `json:"withdrawal_id"` // 关联的提现申请 ID
	UserID       uuid.UUID `json:"user_id"`       // 用户 ID
	
	// 转账金额
	Amount   float64 `json:"amount"`   // 转账金额（元）
	Currency string  `json:"currency"` // 货币类型
	
	// 收款方信息
	PayeeName    string `json:"payee_name"`    // 收款人姓名
	PayeeAccount string `json:"payee_account"` // 收款账号
	
	// 支付渠道
	Channel PaymentChannel `json:"channel"`
	
	// 附加信息
	Description string            `json:"description"` // 转账描述
	Metadata    map[string]string `json:"metadata"`    // 额外元数据
}

// =====================
// 转账响应
// =====================

// TransferStatus 转账状态
type TransferStatus string

const (
	TransferStatusPending    TransferStatus = "pending"    // 处理中
	TransferStatusProcessing TransferStatus = "processing" // 银行处理中
	TransferStatusSuccess    TransferStatus = "success"    // 转账成功
	TransferStatusFailed     TransferStatus = "failed"     // 转账失败
)

// TransferResponse 转账响应
type TransferResponse struct {
	// 交易信息
	TransferID    string         `json:"transfer_id"`     // 第三方转账 ID
	WithdrawalID  uuid.UUID      `json:"withdrawal_id"`   // 关联的提现申请 ID
	Status        TransferStatus `json:"status"`          // 转账状态
	
	// 金额信息
	Amount        float64 `json:"amount"`         // 实际转账金额
	Fee           float64 `json:"fee"`            // 手续费
	ActualAmount  float64 `json:"actual_amount"`  // 到账金额
	
	// 时间信息
	CreatedAt     time.Time  `json:"created_at"`      // 创建时间
	CompletedAt   *time.Time `json:"completed_at"`    // 完成时间
	
	// 错误信息
	ErrorCode     string `json:"error_code,omitempty"`    // 错误码
	ErrorMessage  string `json:"error_message,omitempty"` // 错误消息
	
	// 渠道原始响应
	RawResponse   string `json:"raw_response,omitempty"` // 原始响应（用于调试）
}

// =====================
// 查询请求
// =====================

// QueryTransferRequest 查询转账请求
type QueryTransferRequest struct {
	TransferID   string    `json:"transfer_id"`   // 第三方转账 ID
	WithdrawalID uuid.UUID `json:"withdrawal_id"` // 提现申请 ID
}

// =====================
// 回调通知
// =====================

// TransferCallback 转账回调通知
type TransferCallback struct {
	Channel      PaymentChannel `json:"channel"`       // 支付渠道
	TransferID   string         `json:"transfer_id"`   // 第三方转账 ID
	WithdrawalID uuid.UUID      `json:"withdrawal_id"` // 提现申请 ID
	Status       TransferStatus `json:"status"`        // 转账状态
	Amount       float64        `json:"amount"`        // 金额
	CompletedAt  *time.Time     `json:"completed_at"`  // 完成时间
	ErrorCode    string         `json:"error_code"`    // 错误码
	ErrorMessage string         `json:"error_message"` // 错误消息
	RawData      string         `json:"raw_data"`      // 原始数据
}

// =====================
// 账户余额
// =====================

// BalanceResponse 账户余额响应
type BalanceResponse struct {
	Channel   PaymentChannel `json:"channel"`   // 支付渠道
	Available float64        `json:"available"` // 可用余额
	Frozen    float64        `json:"frozen"`    // 冻结金额
	Total     float64        `json:"total"`     // 总余额
	Currency  string         `json:"currency"`  // 货币类型
	UpdatedAt time.Time      `json:"updated_at"`
}

// =====================
// 配置
// =====================

// AlipayConfig 支付宝配置
type AlipayConfig struct {
	AppID        string `json:"app_id"`
	PrivateKey   string `json:"private_key"`
	PublicKey    string `json:"public_key"`
	NotifyURL    string `json:"notify_url"`
	IsSandbox    bool   `json:"is_sandbox"`
}

// WechatConfig 微信支付配置
type WechatConfig struct {
	AppID        string `json:"app_id"`
	MchID        string `json:"mch_id"`
	APIKey       string `json:"api_key"`
	CertPath     string `json:"cert_path"`
	KeyPath      string `json:"key_path"`
	NotifyURL    string `json:"notify_url"`
	IsSandbox    bool   `json:"is_sandbox"`
}

// BankConfig 银行转账配置
type BankConfig struct {
	BankCode     string `json:"bank_code"`
	AccountNo    string `json:"account_no"`
	AccountName  string `json:"account_name"`
}

// PaymentConfig 支付配置
type PaymentConfig struct {
	Alipay *AlipayConfig `json:"alipay,omitempty"`
	Wechat *WechatConfig `json:"wechat,omitempty"`
	Bank   *BankConfig   `json:"bank,omitempty"`
}
