package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/reverseai/server/internal/config"
	"github.com/reverseai/server/internal/pkg/database"
	"github.com/reverseai/server/internal/pkg/logger"
	"github.com/reverseai/server/internal/pkg/queue"
)

func main() {
	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	// 初始化日志
	log, err := logger.New(cfg.Server.Mode == "production")
	if err != nil {
		fmt.Printf("Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	defer log.Sync()

	log.Info("Starting reverseai Worker...")

	// 初始化数据库
	_, err = database.New(&cfg.Database)
	if err != nil {
		log.Fatal("Failed to connect to database", "error", err)
	}
	log.Info("Database connected")

	workerCfg := &queue.WorkerConfig{
		RedisAddr:     fmt.Sprintf("%s:%d", cfg.Redis.Host, cfg.Redis.Port),
		RedisPassword: cfg.Redis.Password,
		RedisDB:       cfg.Redis.DB,
		Concurrency:   cfg.Queue.WorkerConcurrency,
		Queues:        cfg.Queue.Queues,
	}

	worker, err := queue.NewWorker(workerCfg, log, nil, nil)
	if err != nil {
		log.Fatal("Failed to create worker", "error", err)
	}

	errCh := make(chan error, 1)
	go func() {
		errCh <- worker.Start()
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errCh:
		if err != nil {
			log.Fatal("Worker stopped unexpectedly", "error", err)
		}
	case <-quit:
		log.Info("Shutting down worker...")
	}

	worker.Shutdown()
	log.Info("Worker exited")
}
