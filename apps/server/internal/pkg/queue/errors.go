package queue

import (
	"errors"
	"time"
)

// ErrTaskNoop 表示任务无需继续处理（幂等命中）。
var ErrTaskNoop = errors.New("task noop")

// RetryLaterError 表示需要在指定时间重试任务。
type RetryLaterError struct {
	NextRun time.Time
	Cause   error
}

func (e *RetryLaterError) Error() string {
	if e == nil {
		return "retry later"
	}
	if e.Cause != nil {
		return e.Cause.Error()
	}
	return "retry later"
}

func (e *RetryLaterError) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Cause
}
