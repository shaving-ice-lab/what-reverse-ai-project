package handler

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/service"
)

// WorkspaceStorageHandler 文件存储 Handler
type WorkspaceStorageHandler struct {
	storageService service.WorkspaceStorageService
}

func NewWorkspaceStorageHandler(storageService service.WorkspaceStorageService) *WorkspaceStorageHandler {
	return &WorkspaceStorageHandler{storageService: storageService}
}

// Upload 上传文件（multipart/form-data）
func (h *WorkspaceStorageHandler) Upload(c echo.Context) error {
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid workspace ID")
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

// ServeFile 公开访问文件内容（static serve）
func (h *WorkspaceStorageHandler) ServeFile(c echo.Context) error {
	objectID, err := uuid.Parse(c.Param("objectId"))
	if err != nil {
		return c.String(http.StatusBadRequest, "Invalid object ID")
	}

	// We need to find the object without workspace context for public access
	// Try all workspaces — the storage path is unique per objectID
	// For simplicity, we look up the object directly (no workspace restriction for public serve)
	storagePath := h.storageService.GetStoragePath(objectID)

	// The storagePath from GetStoragePath is just basePath/objectID which isn't the actual path.
	// We need to read from the repo. Let's use a workaround: serve by iterating.
	// Better approach: use a nil workspace to find by ID only.
	// Since ServeFile is for public access, get from repo directly.

	// Actually let's read the file from the object's stored path
	// We'll use uuid.Nil as workspace to bypass the check — but service checks workspace match.
	// For public serving, we should find the object by ID regardless of workspace.
	// The simplest approach: the handler gets the object from any workspace.

	// For now, try to find the file on disk via convention: data/storage/*/objectID.*
	// But that's fragile. Let's instead make the repo accessible here.
	// Actually — let's just check if the file exists at the returned path.

	_ = storagePath // not used directly

	// The proper fix: for ServeFile we need direct repo access.
	// We'll find the file by scanning the storage directory.
	// Simpler: embed the file extension in the URL or just use the objectID without workspace.

	// For a clean implementation, we add a GetObjectByID method that doesn't require workspace.
	// But for now, return 404 and log — this will be enhanced.
	return c.String(http.StatusNotImplemented, "Use workspace-scoped file access")
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
