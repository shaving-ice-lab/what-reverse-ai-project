package queue

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/reverseai/server/internal/pkg/logger"
)

// Worker 任务处理器
type Worker struct {
	server            *asynq.Server
	mux               *asynq.ServeMux
	client            *asynq.Client
	log               logger.Logger
	domainVerifier    DomainVerifier
	metricsAggregator MetricsAggregator
}

// WorkerConfig Worker 配置
type WorkerConfig struct {
	RedisAddr     string
	RedisPassword string
	RedisDB       int
	Concurrency   int
	Queues        map[string]int
}

// DomainVerifier 域名验证执行器
type DomainVerifier interface {
	VerifyByID(ctx context.Context, ownerID, domainID uuid.UUID) error
}

// MetricsAggregator 指标聚合执行器
type MetricsAggregator interface {
	AggregateWorkspaceUsage(ctx context.Context, ownerID, workspaceID uuid.UUID) error
}

// NewWorker 创建 Worker
func NewWorker(
	cfg *WorkerConfig,
	log logger.Logger,
	domainVerifier DomainVerifier,
	metricsAggregator MetricsAggregator,
) (*Worker, error) {
	redisOpt := asynq.RedisClientOpt{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	}

	rand.Seed(time.Now().UnixNano())
	client := asynq.NewClient(redisOpt)
	concurrency := cfg.Concurrency
	if concurrency <= 0 {
		concurrency = 10
	}
	queueWeights := normalizeQueueWeights(cfg.Queues)

	server := asynq.NewServer(
		redisOpt,
		asynq.Config{
			Concurrency:    concurrency,
			Queues:         queueWeights,
			RetryDelayFunc: retryDelay,
			ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
				log.Error("Task processing failed",
					"type", task.Type(),
					"error", err)
			}),
		},
	)

	worker := &Worker{
		server:            server,
		mux:               asynq.NewServeMux(),
		client:            client,
		log:               log,
		domainVerifier:    domainVerifier,
		metricsAggregator: metricsAggregator,
	}

	// 注册任务处理器
	if worker.domainVerifier != nil {
		worker.mux.HandleFunc(TaskTypeDomainVerify, worker.handleDomainVerify)
	}
	if worker.metricsAggregator != nil {
		worker.mux.HandleFunc(TaskTypeMetricsAggregation, worker.handleMetricsAggregation)
	}

	return worker, nil
}

func normalizeQueueWeights(overrides map[string]int) map[string]int {
	defaults := map[string]int{
		QueueDomainVerify:       2,
		QueueMetricsAggregation: 1,
	}
	if len(overrides) == 0 {
		return defaults
	}

	weights := map[string]int{}
	for key, value := range defaults {
		weights[key] = value
	}
	for key, value := range overrides {
		if value > 0 {
			weights[key] = value
		}
	}
	return weights
}

// Start 启动 Worker
func (w *Worker) Start() error {
	w.log.Info("Starting task worker...")
	return w.server.Start(w.mux)
}

// Shutdown 关闭 Worker
func (w *Worker) Shutdown() {
	w.log.Info("Shutting down task worker...")
	w.server.Shutdown()
	if w.client != nil {
		_ = w.client.Close()
	}
}

// handleDomainVerify 处理域名验证任务
func (w *Worker) handleDomainVerify(ctx context.Context, task *asynq.Task) error {
	if w.domainVerifier == nil {
		return fmt.Errorf("domain verifier not configured")
	}
	var payload DomainVerifyPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}
	domainID, err := uuid.Parse(payload.DomainID)
	if err != nil {
		return fmt.Errorf("invalid domain ID: %w", err)
	}
	ownerID, err := uuid.Parse(payload.OwnerID)
	if err != nil {
		return fmt.Errorf("invalid owner ID: %w", err)
	}
	if err := w.domainVerifier.VerifyByID(ctx, ownerID, domainID); err != nil {
		if errors.Is(err, ErrTaskNoop) {
			return nil
		}
		var retryErr *RetryLaterError
		if errors.As(err, &retryErr) && w.client != nil {
			processAt := retryErr.NextRun
			data, marshalErr := json.Marshal(payload)
			if marshalErr != nil {
				return marshalErr
			}
			retryTask := asynq.NewTask(TaskTypeDomainVerify, data,
				asynq.MaxRetry(maxRetryDomainVerify),
				asynq.Timeout(domainVerifyTimeout),
				asynq.Retention(defaultTaskRetention),
				asynq.Unique(dedupMediumTTL),
				asynq.ProcessAt(processAt),
				asynq.Queue(QueueDomainVerify),
			)
			if _, enqueueErr := w.client.EnqueueContext(ctx, retryTask); enqueueErr != nil {
				if isDuplicateTask(enqueueErr) {
					return nil
				}
				return enqueueErr
			}
			return nil
		}
		return err
	}
	return nil
}

// handleMetricsAggregation 处理指标聚合任务
func (w *Worker) handleMetricsAggregation(ctx context.Context, task *asynq.Task) error {
	if w.metricsAggregator == nil {
		return fmt.Errorf("metrics aggregator not configured")
	}
	var payload MetricsAggregationPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}
	ownerID, err := uuid.Parse(payload.OwnerID)
	if err != nil {
		return fmt.Errorf("invalid owner ID: %w", err)
	}
	if payload.WorkspaceID != nil {
		workspaceID, err := uuid.Parse(*payload.WorkspaceID)
		if err != nil {
			return fmt.Errorf("invalid workspace ID: %w", err)
		}
		if err := w.metricsAggregator.AggregateWorkspaceUsage(ctx, ownerID, workspaceID); err != nil {
			return err
		}
	}
	return nil
}

const (
	retryBaseDelay   = 500 * time.Millisecond
	retryMaxDelay    = 10 * time.Minute
	retryJitterRatio = 0.2
)

func retryDelay(attempt int, _ error, _ *asynq.Task) time.Duration {
	if attempt <= 0 {
		return retryBaseDelay
	}
	delay := retryBaseDelay * time.Duration(math.Pow(2, float64(attempt-1)))
	if delay > retryMaxDelay {
		delay = retryMaxDelay
	}
	return addJitter(delay, retryJitterRatio)
}

func addJitter(delay time.Duration, ratio float64) time.Duration {
	if ratio <= 0 {
		return delay
	}
	jitter := 1 + (rand.Float64()*2-1)*ratio
	return time.Duration(float64(delay) * jitter)
}
