package payment

import (
	"context"
	"errors"
	"sync"

	"github.com/agentflow/server/internal/pkg/logger"
)

// =====================
// 错误定义
// =====================

var (
	ErrUnsupportedChannel = errors.New("unsupported payment channel")
	ErrTransferFailed     = errors.New("transfer failed")
	ErrInsufficientFunds  = errors.New("insufficient funds")
	ErrInvalidAccount     = errors.New("invalid account")
	ErrTransferNotFound   = errors.New("transfer not found")
	ErrChannelNotConfigured = errors.New("payment channel not configured")
)

// =====================
// 支付服务接口
// =====================

// PaymentProvider 支付渠道提供者接口
type PaymentProvider interface {
	// 获取渠道类型
	Channel() PaymentChannel
	
	// 发起转账
	Transfer(ctx context.Context, req *TransferRequest) (*TransferResponse, error)
	
	// 查询转账状态
	QueryTransfer(ctx context.Context, req *QueryTransferRequest) (*TransferResponse, error)
	
	// 获取账户余额
	GetBalance(ctx context.Context) (*BalanceResponse, error)
	
	// 验证收款账号
	ValidateAccount(ctx context.Context, account, name string) (bool, error)
	
	// 处理回调通知
	HandleCallback(ctx context.Context, data []byte) (*TransferCallback, error)
}

// =====================
// 支付服务管理器
// =====================

// PaymentService 支付服务管理器
type PaymentService struct {
	providers map[PaymentChannel]PaymentProvider
	config    *PaymentConfig
	log       logger.Logger
	mu        sync.RWMutex
}

// NewPaymentService 创建支付服务
func NewPaymentService(config *PaymentConfig, log logger.Logger) *PaymentService {
	service := &PaymentService{
		providers: make(map[PaymentChannel]PaymentProvider),
		config:    config,
		log:       log,
	}
	
	// 注册默认的模拟支付渠道（用于开发测试）
	service.RegisterProvider(NewMockProvider(log))
	
	// 如果配置了支付宝，注册支付宝渠道
	if config != nil && config.Alipay != nil {
		service.RegisterProvider(NewAlipayProvider(config.Alipay, log))
	}
	
	// 如果配置了微信支付，注册微信渠道
	if config != nil && config.Wechat != nil {
		service.RegisterProvider(NewWechatProvider(config.Wechat, log))
	}
	
	return service
}

// RegisterProvider 注册支付渠道提供者
func (s *PaymentService) RegisterProvider(provider PaymentProvider) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.providers[provider.Channel()] = provider
	s.log.Info("Registered payment provider", "channel", provider.Channel())
}

// GetProvider 获取支付渠道提供者
func (s *PaymentService) GetProvider(channel PaymentChannel) (PaymentProvider, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	provider, ok := s.providers[channel]
	if !ok {
		return nil, ErrUnsupportedChannel
	}
	return provider, nil
}

// Transfer 发起转账
func (s *PaymentService) Transfer(ctx context.Context, req *TransferRequest) (*TransferResponse, error) {
	provider, err := s.GetProvider(req.Channel)
	if err != nil {
		return nil, err
	}
	
	s.log.Info("Initiating transfer",
		"channel", req.Channel,
		"withdrawal_id", req.WithdrawalID,
		"amount", req.Amount,
	)
	
	resp, err := provider.Transfer(ctx, req)
	if err != nil {
		s.log.Error("Transfer failed",
			"channel", req.Channel,
			"withdrawal_id", req.WithdrawalID,
			"error", err,
		)
		return nil, err
	}
	
	s.log.Info("Transfer initiated",
		"channel", req.Channel,
		"transfer_id", resp.TransferID,
		"status", resp.Status,
	)
	
	return resp, nil
}

// QueryTransfer 查询转账状态
func (s *PaymentService) QueryTransfer(ctx context.Context, channel PaymentChannel, req *QueryTransferRequest) (*TransferResponse, error) {
	provider, err := s.GetProvider(channel)
	if err != nil {
		return nil, err
	}
	
	return provider.QueryTransfer(ctx, req)
}

// GetBalance 获取账户余额
func (s *PaymentService) GetBalance(ctx context.Context, channel PaymentChannel) (*BalanceResponse, error) {
	provider, err := s.GetProvider(channel)
	if err != nil {
		return nil, err
	}
	
	return provider.GetBalance(ctx)
}

// ValidateAccount 验证收款账号
func (s *PaymentService) ValidateAccount(ctx context.Context, channel PaymentChannel, account, name string) (bool, error) {
	provider, err := s.GetProvider(channel)
	if err != nil {
		return false, err
	}
	
	return provider.ValidateAccount(ctx, account, name)
}

// HandleCallback 处理回调通知
func (s *PaymentService) HandleCallback(ctx context.Context, channel PaymentChannel, data []byte) (*TransferCallback, error) {
	provider, err := s.GetProvider(channel)
	if err != nil {
		return nil, err
	}
	
	callback, err := provider.HandleCallback(ctx, data)
	if err != nil {
		s.log.Error("Failed to handle callback",
			"channel", channel,
			"error", err,
		)
		return nil, err
	}
	
	s.log.Info("Processed payment callback",
		"channel", channel,
		"transfer_id", callback.TransferID,
		"status", callback.Status,
	)
	
	return callback, nil
}

// GetSupportedChannels 获取支持的支付渠道
func (s *PaymentService) GetSupportedChannels() []PaymentChannel {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	channels := make([]PaymentChannel, 0, len(s.providers))
	for channel := range s.providers {
		channels = append(channels, channel)
	}
	return channels
}
