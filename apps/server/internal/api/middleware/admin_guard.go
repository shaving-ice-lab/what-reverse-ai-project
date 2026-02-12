package middleware

import (
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/domain/entity"
	"github.com/reverseai/server/internal/repository"
)

const authUserContextKey = "auth_user"

// GetAuthUser 从上下文获取用户信息
func GetAuthUser(c echo.Context) *entity.User {
	user, _ := c.Get(authUserContextKey).(*entity.User)
	return user
}

// RequireActiveUser 校验用户状态为 active
func RequireActiveUser(userRepo repository.UserRepository) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			user, err := ensureAuthUser(c, userRepo)
			if err != nil {
				return err
			}
			if !isUserActive(user) {
				return echo.NewHTTPError(http.StatusForbidden, "user suspended")
			}
			return next(c)
		}
	}
}

// RequireAdmin 校验管理员权限
func RequireAdmin(userRepo repository.UserRepository, adminEmails []string) echo.MiddlewareFunc {
	emailSet := map[string]struct{}{}
	for _, email := range adminEmails {
		normalized := strings.ToLower(strings.TrimSpace(email))
		if normalized != "" {
			emailSet[normalized] = struct{}{}
		}
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			user, err := ensureAuthUser(c, userRepo)
			if err != nil {
				return err
			}
			if !isUserActive(user) {
				return echo.NewHTTPError(http.StatusForbidden, "user suspended")
			}

			if !isAdminUser(user, emailSet) {
				return echo.NewHTTPError(http.StatusForbidden, "admin required")
			}
			return next(c)
		}
	}
}

func ensureAuthUser(c echo.Context, userRepo repository.UserRepository) (*entity.User, error) {
	if cached := GetAuthUser(c); cached != nil {
		return cached, nil
	}

	userID := GetUserID(c)
	if strings.TrimSpace(userID) == "" {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "missing user")
	}
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "invalid user id")
	}

	user, err := userRepo.GetByID(c.Request().Context(), uid)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "user not found")
	}
	c.Set(authUserContextKey, user)
	return user, nil
}

func isUserActive(user *entity.User) bool {
	if user == nil {
		return false
	}
	status := strings.ToLower(strings.TrimSpace(user.Status))
	return status == "" || status == "active"
}

func isAdminUser(user *entity.User, emailSet map[string]struct{}) bool {
	if user == nil {
		return false
	}
	if len(emailSet) == 0 {
		return false
	}
	normalizedEmail := strings.ToLower(strings.TrimSpace(user.Email))
	_, ok := emailSet[normalizedEmail]
	return ok
}
