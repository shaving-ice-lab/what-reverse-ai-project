package logger

import (
	"os"

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
}

type logger struct {
	*zap.SugaredLogger
}

// New 创建新的日志实例
func New(isProduction bool) (Logger, error) {
	var config zap.Config

	if isProduction {
		config = zap.NewProductionConfig()
		config.EncoderConfig.TimeKey = "timestamp"
		config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
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

	return &logger{zapLogger.Sugar()}, nil
}

// NewWithFile 创建带文件输出的日志实例
func NewWithFile(isProduction bool, filename string) (Logger, error) {
	var config zap.Config

	if isProduction {
		config = zap.NewProductionConfig()
		config.EncoderConfig.TimeKey = "timestamp"
		config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
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

	return &logger{zapLogger.Sugar()}, nil
}

// Debug 输出 debug 级别日志
func (l *logger) Debug(msg string, keysAndValues ...interface{}) {
	l.SugaredLogger.Debugw(msg, keysAndValues...)
}

// Info 输出 info 级别日志
func (l *logger) Info(msg string, keysAndValues ...interface{}) {
	l.SugaredLogger.Infow(msg, keysAndValues...)
}

// Warn 输出 warn 级别日志
func (l *logger) Warn(msg string, keysAndValues ...interface{}) {
	l.SugaredLogger.Warnw(msg, keysAndValues...)
}

// Error 输出 error 级别日志
func (l *logger) Error(msg string, keysAndValues ...interface{}) {
	l.SugaredLogger.Errorw(msg, keysAndValues...)
}

// Fatal 输出 fatal 级别日志并退出程序
func (l *logger) Fatal(msg string, keysAndValues ...interface{}) {
	l.SugaredLogger.Fatalw(msg, keysAndValues...)
	os.Exit(1)
}

// Sync 刷新日志缓冲
func (l *logger) Sync() error {
	return l.SugaredLogger.Sync()
}
