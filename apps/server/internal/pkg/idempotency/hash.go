package idempotency

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"reflect"
	"sort"
	"strconv"
	"strings"
	"time"
)

// HashValue 计算稳定的请求哈希
func HashValue(value interface{}) string {
	normalized := stableString(value)
	sum := sha256.Sum256([]byte(normalized))
	return hex.EncodeToString(sum[:])
}

func stableString(value interface{}) string {
	if value == nil {
		return "null"
	}
	switch v := value.(type) {
	case string:
		return strconv.Quote(v)
	case bool:
		return strconv.FormatBool(v)
	case int:
		return strconv.FormatInt(int64(v), 10)
	case int8:
		return strconv.FormatInt(int64(v), 10)
	case int16:
		return strconv.FormatInt(int64(v), 10)
	case int32:
		return strconv.FormatInt(int64(v), 10)
	case int64:
		return strconv.FormatInt(v, 10)
	case uint:
		return strconv.FormatUint(uint64(v), 10)
	case uint8:
		return strconv.FormatUint(uint64(v), 10)
	case uint16:
		return strconv.FormatUint(uint64(v), 10)
	case uint32:
		return strconv.FormatUint(uint64(v), 10)
	case uint64:
		return strconv.FormatUint(v, 10)
	case float32:
		return strconv.FormatFloat(float64(v), 'f', -1, 32)
	case float64:
		return strconv.FormatFloat(v, 'f', -1, 64)
	case time.Time:
		return v.UTC().Format(time.RFC3339Nano)
	case fmt.Stringer:
		return v.String()
	}

	rv := reflect.ValueOf(value)
	if rv.Kind() == reflect.Ptr {
		if rv.IsNil() {
			return "null"
		}
		return stableString(rv.Elem().Interface())
	}
	switch rv.Kind() {
	case reflect.Map:
		if rv.Type().Key().Kind() != reflect.String {
			return fmt.Sprintf("%v", value)
		}
		keys := rv.MapKeys()
		strKeys := make([]string, 0, len(keys))
		for _, key := range keys {
			strKeys = append(strKeys, key.String())
		}
		sort.Strings(strKeys)
		var builder strings.Builder
		builder.WriteString("{")
		for i, key := range strKeys {
			if i > 0 {
				builder.WriteString(",")
			}
			builder.WriteString(strconv.Quote(key))
			builder.WriteString(":")
			builder.WriteString(stableString(rv.MapIndex(reflect.ValueOf(key)).Interface()))
		}
		builder.WriteString("}")
		return builder.String()
	case reflect.Slice, reflect.Array:
		var builder strings.Builder
		builder.WriteString("[")
		length := rv.Len()
		for i := 0; i < length; i++ {
			if i > 0 {
				builder.WriteString(",")
			}
			builder.WriteString(stableString(rv.Index(i).Interface()))
		}
		builder.WriteString("]")
		return builder.String()
	default:
		return fmt.Sprintf("%v", value)
	}
}
