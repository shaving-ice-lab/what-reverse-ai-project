.PHONY: build run test lint clean migrate-up migrate-down swagger

# 变量
BINARY_NAME=agentflow-server
GO=go
GOFLAGS=-ldflags="-s -w"

# 构建
build:
	$(GO) build $(GOFLAGS) -o bin/$(BINARY_NAME) cmd/server/main.go

# 运行
run:
	$(GO) run cmd/server/main.go

# 开发模式 (热重载)
dev:
	air

# 测试
test:
	$(GO) test -v ./...

# 测试覆盖率
test-coverage:
	$(GO) test -coverprofile=coverage.out ./...
	$(GO) tool cover -html=coverage.out -o coverage.html

# 代码检查
lint:
	golangci-lint run

# 格式化
fmt:
	$(GO) fmt ./...

# 清理
clean:
	rm -rf bin/
	rm -f coverage.out coverage.html

# 数据库迁移 - 升级
migrate-up:
	migrate -path migrations -database "postgresql://postgres:postgres@localhost:5432/agentflow?sslmode=disable" up

# 数据库迁移 - 回滚
migrate-down:
	migrate -path migrations -database "postgresql://postgres:postgres@localhost:5432/agentflow?sslmode=disable" down 1

# 数据库迁移 - 创建
migrate-create:
	migrate create -ext sql -dir migrations -seq $(name)

# 生成 Swagger 文档
swagger:
	swag init -g cmd/server/main.go -o docs/swagger

# 安装开发依赖
deps:
	$(GO) install github.com/swaggo/swag/cmd/swag@latest
	$(GO) install github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	$(GO) install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	$(GO) install github.com/cosmtrek/air@latest

# Docker 构建
docker-build:
	docker build -t agentflow-server -f ../docker/Dockerfile.server .

# 帮助
help:
	@echo "Available commands:"
	@echo "  make build         - Build the application"
	@echo "  make run           - Run the application"
	@echo "  make dev           - Run with hot reload (air)"
	@echo "  make test          - Run tests"
	@echo "  make lint          - Run linter"
	@echo "  make migrate-up    - Run database migrations"
	@echo "  make migrate-down  - Rollback last migration"
	@echo "  make swagger       - Generate Swagger docs"
	@echo "  make deps          - Install dev dependencies"
