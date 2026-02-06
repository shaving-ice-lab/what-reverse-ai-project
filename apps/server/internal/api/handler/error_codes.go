package handler

// ErrorCodeDefinition 统一错误码定义
type ErrorCodeDefinition struct {
	Code        string `json:"code"`
	HTTPStatus  int    `json:"http_status"`
	Module      string `json:"module"`
	Description string `json:"description"`
}

// ErrorCodeTable 错误码清单（与文档保持一致）
var ErrorCodeTable = []ErrorCodeDefinition{
	{Code: "WORKSPACE_DISABLED", HTTPStatus: 503, Module: "workspace", Description: "工作空间功能未开放"},
	{Code: "WORKSPACE_ID_REQUIRED", HTTPStatus: 400, Module: "workspace", Description: "工作空间 ID 不能为空"},
	{Code: "WORKSPACE_INVALID_ID", HTTPStatus: 400, Module: "workspace", Description: "工作空间 ID 无效"},
	{Code: "WORKSPACE_NOT_FOUND", HTTPStatus: 404, Module: "workspace", Description: "工作空间不存在"},

	{Code: "WORKSPACE_RUNTIME_DISABLED", HTTPStatus: 503, Module: "runtime", Description: "工作空间 Runtime 暂未开放"},
	{Code: "RUNTIME_FAILED", HTTPStatus: 500, Module: "runtime", Description: "运行时执行失败"},

	{Code: "DOMAIN_DISABLED", HTTPStatus: 503, Module: "domain", Description: "域名功能未开放"},
	{Code: "DOMAIN_INVALID_ID", HTTPStatus: 400, Module: "domain", Description: "域名 ID 无效"},
	{Code: "DOMAIN_NOT_FOUND", HTTPStatus: 404, Module: "domain", Description: "域名不存在"},
	{Code: "DOMAIN_EXISTS", HTTPStatus: 409, Module: "domain", Description: "域名已绑定"},
	{Code: "DOMAIN_NOT_VERIFIED", HTTPStatus: 400, Module: "domain", Description: "域名未验证"},
	{Code: "DOMAIN_NOT_ACTIVE", HTTPStatus: 409, Module: "domain", Description: "域名未生效"},
	{Code: "DOMAIN_ACTIVE", HTTPStatus: 409, Module: "domain", Description: "域名已生效"},
	{Code: "DOMAIN_BLOCKED", HTTPStatus: 403, Module: "domain", Description: "域名已被封禁"},
	{Code: "DOMAIN_NOT_BLOCKED", HTTPStatus: 409, Module: "domain", Description: "域名未被封禁"},

	{Code: "DB_NOT_FOUND", HTTPStatus: 404, Module: "db", Description: "工作空间数据库不存在"},
	{Code: "DB_NOT_READY", HTTPStatus: 409, Module: "db", Description: "工作空间数据库尚未就绪"},
}
