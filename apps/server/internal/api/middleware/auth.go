package middleware

import (
	"net/http"
	"strings"

	"github.com/agentflow/server/internal/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

// JWTClaims JWT 声明
type JWTClaims struct {
	UserID string `json:"user_id"`
	jwt.RegisteredClaims
}

// Auth JWT 认证中间件
func Auth(cfg *config.JWTConfig) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// 获取 Authorization header
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "missing authorization header")
			}

			// 解析 Bearer token
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid authorization header format")
			}

			tokenString := parts[1]

			// 验证 token
			token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
				return []byte(cfg.Secret), nil
			})

			if err != nil || !token.Valid {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid or expired token")
			}

			// 获取 claims
			claims, ok := token.Claims.(*JWTClaims)
			if !ok {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token claims")
			}

			// 将用户 ID 存入上下文
			c.Set("user_id", claims.UserID)

			return next(c)
		}
	}
}

// GetUserID 从上下文获取用户 ID
func GetUserID(c echo.Context) string {
	userID, _ := c.Get("user_id").(string)
	return userID
}
