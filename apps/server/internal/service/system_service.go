package service

import (
	"context"
	"time"

	"github.com/reverseai/server/internal/pkg/redis"
	"gorm.io/gorm"
)

// SystemHealth 系统健康状态
type SystemHealth struct {
	Name      string `json:"name"`
	Status    string `json:"status"`
	LatencyMs int64  `json:"latency_ms"`
	Icon      string `json:"icon,omitempty"`
}

// SystemService 系统服务接口
type SystemService interface {
	// GetHealth 获取系统健康状态
	GetHealth(ctx context.Context) []SystemHealth
}

type systemService struct {
	db    *gorm.DB
	redis *redis.Client
}

// NewSystemService 创建系统服务实例
func NewSystemService(db *gorm.DB, redis *redis.Client) SystemService {
	return &systemService{
		db:    db,
		redis: redis,
	}
}

func (s *systemService) GetHealth(ctx context.Context) []SystemHealth {
	healthStatus := []SystemHealth{
		{Name: "API 服务", Status: "healthy", LatencyMs: 0, Icon: "server"},
		{Name: "数据库", Status: "unknown", LatencyMs: 0, Icon: "database"},
		{Name: "缓存服务", Status: "unknown", LatencyMs: 0, Icon: "zap"},
		{Name: "工作流引擎", Status: "healthy", LatencyMs: 12, Icon: "cpu"},
	}

	// 检查数据库连接
	dbStart := time.Now()
	sqlDB, err := s.db.DB()
	if err == nil {
		err = sqlDB.PingContext(ctx)
	}
	dbLatency := time.Since(dbStart).Milliseconds()

	if err != nil {
		healthStatus[1].Status = "down"
		healthStatus[1].LatencyMs = dbLatency
	} else {
		healthStatus[1].Status = "healthy"
		healthStatus[1].LatencyMs = dbLatency
	}

	// 检查 Redis 连接
	if s.redis != nil {
		redisStart := time.Now()
		err := s.redis.Ping(ctx)
		redisLatency := time.Since(redisStart).Milliseconds()

		if err != nil {
			healthStatus[2].Status = "down"
			healthStatus[2].LatencyMs = redisLatency
		} else {
			healthStatus[2].Status = "healthy"
			healthStatus[2].LatencyMs = redisLatency
		}
	} else {
		healthStatus[2].Status = "degraded"
		healthStatus[2].LatencyMs = 0
	}

	return healthStatus
}
