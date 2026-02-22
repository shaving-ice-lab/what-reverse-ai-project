package handler

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/api/middleware"
	"github.com/reverseai/server/internal/service"
)

// WorkspaceStorageHandler 文件存储 Handler
type WorkspaceStorageHandler struct {
	storageService   service.WorkspaceStorageService
	workspaceService service.WorkspaceService
}

func NewWorkspaceStorageHandler(storageService service.WorkspaceStorageService, workspaceService service.WorkspaceService) *WorkspaceStorageHandler {
	return &WorkspaceStorageHandler{storageService: storageService, workspaceService: workspaceService}
}

// requireMemberAccess 验证用户是工作空间成员或 owner
func (h *WorkspaceStorageHandler) requireMemberAccess(c echo.Context, workspaceID uuid.UUID) error {
	if h.workspaceService == nil {
		return nil
	}
	uid, err := uuid.Parse(middleware.GetUserID(c))
	if err != nil {
		_ = errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
		return fmt.Errorf("invalid_user")
	}
	access, err := h.workspaceService.GetWorkspaceAccess(c.Request().Context(), workspaceID, uid)
	if err != nil {
		_ = errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		return err
	}
	if !access.IsOwner && access.Role == nil {
		_ = errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无写入权限，仅 workspace 成员可执行此操作")
		return fmt.Errorf("write_forbidden")
	}
	return nil
}

// Upload 上传文件（multipart/form-data）
func (h *WorkspaceStorageHandler) Upload(c echo.Context) error {
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid workspace ID")
	}
	if err := h.requireMemberAccess(c, workspaceID); err != nil {
		return nil
	}

	file, err := c.FormFile("file")
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "NO_FILE", "File is required")
	}

	// 10MB limit
	if file.Size > 10*1024*1024 {
		return errorResponse(c, http.StatusBadRequest, "FILE_TOO_LARGE", "File size exceeds 10MB limit")
	}

	src, err := file.Open()
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "FILE_OPEN_FAILED", "Failed to open uploaded file")
	}
	defer src.Close()

	prefix := c.FormValue("prefix")

	// Parse optional owner_id
	var ownerID *uuid.UUID
	if ownerStr := c.FormValue("owner_id"); ownerStr != "" {
		if id, err := uuid.Parse(ownerStr); err == nil {
			ownerID = &id
		}
	}

	obj, err := h.storageService.Upload(c.Request().Context(), workspaceID, ownerID, src, file.Filename, file.Size, prefix)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "UPLOAD_FAILED", err.Error())
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"code":    "OK",
		"message": "uploaded",
		"data":    obj,
	})
}

// List 列出文件
func (h *WorkspaceStorageHandler) List(c echo.Context) error {
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid workspace ID")
	}

	prefix := c.QueryParam("prefix")
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 50
	}

	objects, total, err := h.storageService.ListObjects(c.Request().Context(), workspaceID, prefix, page, pageSize)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", err.Error())
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"code":    "OK",
		"message": "ok",
		"data": map[string]interface{}{
			"items": objects,
			"total": total,
			"page":  page,
		},
	})
}

// GetObject 获取文件元数据
func (h *WorkspaceStorageHandler) GetObject(c echo.Context) error {
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid workspace ID")
	}

	objectID, err := uuid.Parse(c.Param("objectId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_OBJECT_ID", "Invalid object ID")
	}

	obj, err := h.storageService.GetObject(c.Request().Context(), workspaceID, objectID)
	if err != nil {
		return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Storage object not found")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"code":    "OK",
		"message": "ok",
		"data":    obj,
	})
}

// DeleteObject 删除文件
func (h *WorkspaceStorageHandler) DeleteObject(c echo.Context) error {
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid workspace ID")
	}
	if err := h.requireMemberAccess(c, workspaceID); err != nil {
		return nil
	}

	objectID, err := uuid.Parse(c.Param("objectId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_OBJECT_ID", "Invalid object ID")
	}

	if err := h.storageService.DeleteObject(c.Request().Context(), workspaceID, objectID); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", err.Error())
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"code":    "OK",
		"message": "deleted",
	})
}

// ServeFile 公开访问文件内容（static serve，通过 objectId 直接访问）
func (h *WorkspaceStorageHandler) ServeFile(c echo.Context) error {
	objectID, err := uuid.Parse(c.Param("objectId"))
	if err != nil {
		return c.String(http.StatusBadRequest, "Invalid object ID")
	}

	obj, err := h.storageService.GetObjectByID(c.Request().Context(), objectID)
	if err != nil {
		return c.String(http.StatusNotFound, "File not found")
	}

	f, err := os.Open(obj.StoragePath)
	if err != nil {
		return c.String(http.StatusNotFound, fmt.Sprintf("File not found on disk: %s", obj.FileName))
	}
	defer f.Close()

	c.Response().Header().Set("Content-Type", obj.MimeType)
	c.Response().Header().Set("Content-Disposition", fmt.Sprintf(`inline; filename="%s"`, obj.FileName))
	c.Response().Header().Set("Cache-Control", "public, max-age=86400")
	c.Response().WriteHeader(http.StatusOK)
	io.Copy(c.Response(), f)
	return nil
}

// RuntimeUpload 运行时上传（通过 slug 解析 workspace）
type RuntimeStorageHandler struct {
	storageService service.WorkspaceStorageService
	runtimeService service.RuntimeService
}

func NewRuntimeStorageHandler(storageService service.WorkspaceStorageService, runtimeService service.RuntimeService) *RuntimeStorageHandler {
	return &RuntimeStorageHandler{storageService: storageService, runtimeService: runtimeService}
}

func (h *RuntimeStorageHandler) Upload(c echo.Context) error {
	slug := c.Param("workspaceSlug")
	entry, err := h.runtimeService.GetEntry(c.Request().Context(), slug, nil)
	if err != nil || entry == nil || entry.Workspace == nil {
		return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Workspace not found")
	}
	workspaceID := entry.Workspace.ID

	file, err := c.FormFile("file")
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "NO_FILE", "File is required")
	}

	if file.Size > 10*1024*1024 {
		return errorResponse(c, http.StatusBadRequest, "FILE_TOO_LARGE", "File size exceeds 10MB limit")
	}

	src, err := file.Open()
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "FILE_OPEN_FAILED", "Failed to open uploaded file")
	}
	defer src.Close()

	prefix := c.FormValue("prefix")

	obj, err := h.storageService.Upload(c.Request().Context(), workspaceID, nil, src, file.Filename, file.Size, prefix)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "UPLOAD_FAILED", err.Error())
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"code":    "OK",
		"message": "uploaded",
		"data":    obj,
	})
}

// ServeFilePublic 通过对象 ID 直接提供文件内容（公开访问）
func (h *RuntimeStorageHandler) ServeFilePublic(c echo.Context) error {
	objectID, err := uuid.Parse(c.Param("objectId"))
	if err != nil {
		return c.String(http.StatusBadRequest, "Invalid object ID")
	}

	slug := c.Param("workspaceSlug")
	entry, err := h.runtimeService.GetEntry(c.Request().Context(), slug, nil)
	if err != nil || entry == nil || entry.Workspace == nil {
		return c.String(http.StatusNotFound, "Workspace not found")
	}

	obj, err := h.storageService.GetObject(c.Request().Context(), entry.Workspace.ID, objectID)
	if err != nil {
		return c.String(http.StatusNotFound, "File not found")
	}

	f, err := os.Open(obj.StoragePath)
	if err != nil {
		return c.String(http.StatusNotFound, fmt.Sprintf("File not found on disk: %s", obj.FileName))
	}
	defer f.Close()

	c.Response().Header().Set("Content-Type", obj.MimeType)
	c.Response().Header().Set("Content-Disposition", fmt.Sprintf(`inline; filename="%s"`, obj.FileName))
	c.Response().Header().Set("Cache-Control", "public, max-age=86400")
	c.Response().WriteHeader(http.StatusOK)
	io.Copy(c.Response(), f)
	return nil
}
