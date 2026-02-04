package logger

import (
	"context"
	"os"

	"github.com/agentflow/server/internal/pkg/observability"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// Logger 日志接口
type Logger interface {
	Debug(msg string, keysAndValues ...interface{})
	Info(msg string, keysAndValues ...interface{})
	Warn(msg string, keysAndValues ...interface{})
	Error(msg string, keysAndValues ...interface{})
	Fatal(msg string, keysAndValues ...interface{})
	Sync() error

	// WithContext 从 context 注入追踪上下文
	WithContext(ctx context.Context) Logger
	// WithTraceContext 直接注入 TraceContext
	WithTraceContext(tc *observability.TraceContext) Logger
	// WithFields 注入额外字段
	WithFields(keysAndValues ...interface{}) Logger
}

type logger struct {
	*zap.SugaredLogger
	baseFields []interface{} // 预注入的基础字段
}

// New 创建新的日志实例
func New(isProduction bool) (Logger, error) {
	var config zap.Config

	if isProduction {
		config = zap.NewProductionConfig()
		config.EncoderConfig.TimeKey = "timestamp"
		config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
		// 生产环境使用 JSON 格式，便于 ELK/Loki 等系统搜索
		config.Encoding = "json"
	} else {
		config = zap.NewDevelopmentConfig()
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	// 输出到 stdout
	config.OutputPaths = []string{"stdout"}
	config.ErrorOutputPaths = []string{"stderr"}

	zapLogger, err := config.Build()
	if err != nil {
		return nil, err
	}

	return &logger{
		SugaredLogger: zapLogger.Sugar(),
		baseFields:    nil,
	}, nil
}

// NewWithFile 创建带文件输出的日志实例
func NewWithFile(isProduction bool, filename string) (Logger, error) {
	var config zap.Config

	if isProduction {
		config = zap.NewProductionConfig()
		config.EncoderConfig.TimeKey = "timestamp"
		config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
		config.Encoding = "json"
	} else {
		config = zap.NewDevelopmentConfig()
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	// 同时输出到 stdout 和文件
	config.OutputPaths = []string{"stdout", filename}
	config.ErrorOutputPaths = []string{"stderr", filename}

	zapLogger, err := config.Build()
	if err != nil {
		return nil, err
	}

	return &logger{
		SugaredLogger: zapLogger.Sugar(),
		baseFields:    nil,
	}, nil
}

// mergeFields 合并基础字段和传入字段
func (l *logger) mergeFields(keysAndValues ...interface{}) []interface{} {
	if len(l.baseFields) == 0 {
		return keysAndValues
	}
	result := make([]interface{}, 0, len(l.baseFields)+len(keysAndValues))
	result = append(result, l.baseFields...)
	result = append(result, keysAndValues...)
	return result
}

// Debug 输出 debug 级别日志
func (l *logger) Debug(msg string, keysAndValues ...interface{}) {
	l.SugaredLogger.Debugw(msg, l.mergeFields(keysAndValues...)...)
}

// Info 输出 info 级别日志
func (l *logger) Info(msg string, keysAndValues ...interface{}) {
	l.SugaredLogger.Infow(msg, l.mergeFields(keysAndValues...)...)
}

// Warn 输出 warn 级别日志
func (l *logger) Warn(msg string, keysAndValues ...interface{}) {
	l.SugaredLogger.Warnw(msg, l.mergeFields(keysAndValues...)...)
}

// Error 输出 error 级别日志
func (l *logger) Error(msg string, keysAndValues ...interface{}) {
	l.SugaredLogger.Errorw(msg, l.mergeFields(keysAndValues...)...)
}

// Fatal 输出 fatal 级别日志并退出程序
func (l *logger) Fatal(msg string, keysAndValues ...interface{}) {
	l.SugaredLogger.Fatalw(msg, l.mergeFields(keysAndValues...)...)
	os.Exit(1)
}

// Sync 刷新日志缓冲
func (l *logger) Sync() error {
	return l.SugaredLogger.Sync()
}

// WithContext 从 context.Context 提取追踪上下文并返回新的 Logger
func (l *logger) WithContext(ctx context.Context) Logger {
	tc := observability.TraceContextFromContext(ctx)
	return l.WithTraceContext(tc)
}

// WithTraceContext 注入 TraceContext 返回新的 Logger
func (l *logger) WithTraceContext(tc *observability.TraceContext) Logger {
	if tc == nil {
		return l
	}

	newFields := make([]interface{}, 0, len(l.baseFields)+18)
	newFields = append(newFields, l.baseFields...)
	newFields = append(newFields, tc.ToKeyValues()...)

	return &logger{
		SugaredLogger: l.SugaredLogger,
		baseFields:    newFields,
	}
}

// WithFields 注入额外字段返回新的 Logger
func (l *logger) WithFields(keysAndValues ...interface{}) Logger {
	if len(keysAndValues) == 0 {
		return l
	}

	newFields := make([]interface{}, 0, len(l.baseFields)+len(keysAndValues))
	newFields = append(newFields, l.baseFields...)
	newFields = append(newFields, keysAndValues...)

	return &logger{
		SugaredLogger: l.SugaredLogger,
		baseFields:    newFields,
	}
}
