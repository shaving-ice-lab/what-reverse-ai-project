package payment

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"time"

	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/google/uuid"
)

// MockProvider 模拟支付渠道（用于开发和测试）
type MockProvider struct {
	log        logger.Logger
	transfers  map[string]*TransferResponse
	balance    float64
}

// NewMockProvider 创建模拟支付渠道
func NewMockProvider(log logger.Logger) *MockProvider {
	return &MockProvider{
		log:       log,
		transfers: make(map[string]*TransferResponse),
		balance:   100000.00, // 模拟初始余额 10 万
	}
}

// Channel 返回渠道类型
func (p *MockProvider) Channel() PaymentChannel {
	return ChannelMock
}

// Transfer 发起转账
func (p *MockProvider) Transfer(ctx context.Context, req *TransferRequest) (*TransferResponse, error) {
	// 模拟处理延迟
	time.Sleep(time.Millisecond * 100)
	
	// 检查余额
	if p.balance < req.Amount {
		return &TransferResponse{
			TransferID:   generateMockTransferID(),
			WithdrawalID: req.WithdrawalID,
			Status:       TransferStatusFailed,
			Amount:       req.Amount,
			ErrorCode:    "INSUFFICIENT_FUNDS",
			ErrorMessage: "账户余额不足",
			CreatedAt:    time.Now(),
		}, ErrInsufficientFunds
	}
	
	// 模拟 5% 的失败率
	if rand.Float64() < 0.05 {
		return &TransferResponse{
			TransferID:   generateMockTransferID(),
			WithdrawalID: req.WithdrawalID,
			Status:       TransferStatusFailed,
			Amount:       req.Amount,
			ErrorCode:    "SYSTEM_ERROR",
			ErrorMessage: "系统繁忙，请稍后重试",
			CreatedAt:    time.Now(),
		}, ErrTransferFailed
	}
	
	// 创建转账记录
	transferID := generateMockTransferID()
	now := time.Now()
	completedAt := now.Add(time.Second * 3) // 模拟 3 秒后完成
	
	resp := &TransferResponse{
		TransferID:   transferID,
		WithdrawalID: req.WithdrawalID,
		Status:       TransferStatusSuccess, // 模拟直接成功
		Amount:       req.Amount,
		Fee:          0, // 模拟无手续费
		ActualAmount: req.Amount,
		CreatedAt:    now,
		CompletedAt:  &completedAt,
	}
	
	// 扣减余额
	p.balance -= req.Amount
	
	// 保存转账记录
	p.transfers[transferID] = resp
	
	p.log.Info("[MOCK] Transfer completed",
		"transfer_id", transferID,
		"amount", req.Amount,
		"payee", req.PayeeName,
		"remaining_balance", p.balance,
	)
	
	return resp, nil
}

// QueryTransfer 查询转账状态
func (p *MockProvider) QueryTransfer(ctx context.Context, req *QueryTransferRequest) (*TransferResponse, error) {
	if req.TransferID != "" {
		if resp, ok := p.transfers[req.TransferID]; ok {
			return resp, nil
		}
	}
	
	// 尝试通过 WithdrawalID 查找
	for _, resp := range p.transfers {
		if resp.WithdrawalID == req.WithdrawalID {
			return resp, nil
		}
	}
	
	return nil, ErrTransferNotFound
}

// GetBalance 获取账户余额
func (p *MockProvider) GetBalance(ctx context.Context) (*BalanceResponse, error) {
	return &BalanceResponse{
		Channel:   ChannelMock,
		Available: p.balance,
		Frozen:    0,
		Total:     p.balance,
		Currency:  "CNY",
		UpdatedAt: time.Now(),
	}, nil
}

// ValidateAccount 验证收款账号
func (p *MockProvider) ValidateAccount(ctx context.Context, account, name string) (bool, error) {
	// 模拟账号验证，只要账号不为空就通过
	if account == "" || name == "" {
		return false, ErrInvalidAccount
	}
	
	// 模拟 2% 的账号无效率
	if rand.Float64() < 0.02 {
		return false, nil
	}
	
	return true, nil
}

// HandleCallback 处理回调通知
func (p *MockProvider) HandleCallback(ctx context.Context, data []byte) (*TransferCallback, error) {
	var callback TransferCallback
	if err := json.Unmarshal(data, &callback); err != nil {
		return nil, fmt.Errorf("invalid callback data: %w", err)
	}
	
	callback.Channel = ChannelMock
	return &callback, nil
}

// generateMockTransferID 生成模拟转账 ID
func generateMockTransferID() string {
	return fmt.Sprintf("MOCK_%s_%d", uuid.New().String()[:8], time.Now().UnixNano()%10000)
}

// SetBalance 设置余额（测试用）
func (p *MockProvider) SetBalance(balance float64) {
	p.balance = balance
}

// Reset 重置状态（测试用）
func (p *MockProvider) Reset() {
	p.transfers = make(map[string]*TransferResponse)
	p.balance = 100000.00
}
