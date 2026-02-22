package config

import (
	"os"
	"strings"
	"time"

	"github.com/spf13/viper"
)

// Config 应用配置
type Config struct {
	Env               string                  `mapstructure:"env"`
	Deployment        DeploymentConfig        `mapstructure:"deployment"`
	Server            ServerConfig            `mapstructure:"server"`
	Database          DatabaseConfig          `mapstructure:"database"`
	Redis             RedisConfig             `mapstructure:"redis"`
	Execution         ExecutionConfig         `mapstructure:"execution"`
	Queue             QueueConfig             `mapstructure:"queue"`
	JWT               JWTConfig               `mapstructure:"jwt"`
	Captcha           CaptchaConfig           `mapstructure:"captcha"`
	AI                AIConfig                `mapstructure:"ai"`
	Encryption        EncryptionConfig        `mapstructure:"encryption"`
	Features          FeatureFlagsConfig      `mapstructure:"features"`
	DomainRouting     DomainRoutingConfig     `mapstructure:"domain_routing"`
	CertificateIssuer CertificateIssuerConfig `mapstructure:"certificate_issuer"`
	DomainLifecycle   DomainLifecycleConfig   `mapstructure:"domain_lifecycle"`
	ConnectorHealth   ConnectorHealthConfig   `mapstructure:"connector_health"`
	Migration         MigrationConfig         `mapstructure:"migration"`
	Security          SecurityConfig          `mapstructure:"security"`
	Retention         RetentionConfig         `mapstructure:"retention"`
	Archive           ArchiveConfig           `mapstructure:"archive"`
	Cache             CacheConfig             `mapstructure:"cache"`
	VMRuntime         VMRuntimeConfig         `mapstructure:"vm_runtime"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Host    string `mapstructure:"host"`
	Port    int    `mapstructure:"port"`
	Mode    string `mapstructure:"mode"`     // development, production
	BaseURL string `mapstructure:"base_url"` // 公开访问的基础 URL
}

// DeploymentConfig 多地域部署配置
type DeploymentConfig struct {
	Region         string            `mapstructure:"region"`
	PrimaryRegion  string            `mapstructure:"primary_region"`
	Regions        []string          `mapstructure:"regions"`
	RegionBaseURLs map[string]string `mapstructure:"region_base_urls"`
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Host                     string        `mapstructure:"host"`
	Port                     int           `mapstructure:"port"`
	User                     string        `mapstructure:"user"`
	Password                 string        `mapstructure:"password"`
	Name                     string        `mapstructure:"name"`
	Charset                  string        `mapstructure:"charset"`
	MaxOpenConns             int           `mapstructure:"max_open_conns"`
	MaxIdleConns             int           `mapstructure:"max_idle_conns"`
	WorkspaceMaxOpenConns    int           `mapstructure:"workspace_max_open_conns"`
	WorkspaceMaxIdleConns    int           `mapstructure:"workspace_max_idle_conns"`
	WorkspaceConnMaxLifetime time.Duration `mapstructure:"workspace_conn_max_lifetime"`
	WorkspaceConnMaxIdleTime time.Duration `mapstructure:"workspace_conn_max_idle_time"`
}

// RedisConfig Redis 配置
type RedisConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
}

// ExecutionConfig 执行引擎配置
type ExecutionConfig struct {
	MaxConcurrent int           `mapstructure:"max_concurrent"`
	MaxInFlight   int           `mapstructure:"max_in_flight"`
	Timeout       time.Duration `mapstructure:"timeout"`
}

// QueueConfig 队列与 Worker 配置
type QueueConfig struct {
	WorkerConcurrency int            `mapstructure:"worker_concurrency"`
	Queues            map[string]int `mapstructure:"queues"`
}

// JWTConfig JWT 配置
type JWTConfig struct {
	Secret             string        `mapstructure:"secret"`
	AccessTokenExpire  time.Duration `mapstructure:"access_token_expire"`
	RefreshTokenExpire time.Duration `mapstructure:"refresh_token_expire"`
}

// CaptchaConfig 验证码服务配置
type CaptchaConfig struct {
	Provider       string `mapstructure:"provider"` // turnstile
	Secret         string `mapstructure:"secret"`
	VerifyURL      string `mapstructure:"verify_url"`
	TimeoutSeconds int    `mapstructure:"timeout_seconds"`
}

// FeatureFlagsConfig 功能开关配置
type FeatureFlagsConfig struct {
	WorkspaceEnabled        bool `mapstructure:"workspace_enabled"`
	WorkspaceRuntimeEnabled bool `mapstructure:"workspace_runtime_enabled"`
	DomainEnabled           bool `mapstructure:"domain_enabled"`
}

// DomainRoutingConfig 域名路由切流配置
type DomainRoutingConfig struct {
	Provider       string `mapstructure:"provider"` // webhook
	WebhookURL     string `mapstructure:"webhook_url"`
	WebhookToken   string `mapstructure:"webhook_token"`
	TimeoutSeconds int    `mapstructure:"timeout_seconds"`
}

// CertificateIssuerConfig 证书签发配置
type CertificateIssuerConfig struct {
	Provider       string `mapstructure:"provider"` // webhook
	WebhookURL     string `mapstructure:"webhook_url"`
	WebhookToken   string `mapstructure:"webhook_token"`
	TimeoutSeconds int    `mapstructure:"timeout_seconds"`
}

// DomainLifecycleConfig 域名与证书生命周期配置
type DomainLifecycleConfig struct {
	Enabled                 bool          `mapstructure:"enabled"`
	Interval                time.Duration `mapstructure:"interval"`
	DomainExpiryWarningDays int           `mapstructure:"domain_expiry_warning_days"`
	SSLExpiryWarningDays    int           `mapstructure:"ssl_expiry_warning_days"`
	SSLAutoRenewDays        int           `mapstructure:"ssl_auto_renew_days"`
	MaxDomainsPerTick       int           `mapstructure:"max_domains_per_tick"`
}

// ConnectorHealthConfig 连接器健康检查配置
type ConnectorHealthConfig struct {
	Enabled           bool          `mapstructure:"enabled"`
	Interval          time.Duration `mapstructure:"interval"`
	ExpiryWarningDays int           `mapstructure:"expiry_warning_days"`
}

// AIConfig AI 服务配置
type AIConfig struct {
	OpenAIAPIKey    string `mapstructure:"openai_api_key"`
	OpenAIBaseURL   string `mapstructure:"openai_base_url"`
	AnthropicAPIKey string `mapstructure:"anthropic_api_key"`
	DefaultModel    string `mapstructure:"default_model"`
}

// EncryptionConfig 加密配置
type EncryptionConfig struct {
	Key string `mapstructure:"key"` // 32字节的加密密钥
}

// MigrationConfig 迁移相关配置
type MigrationConfig struct {
	WorkspaceBackfillEnabled  bool `mapstructure:"workspace_backfill_enabled"`
	WorkspaceConsistencyCheck bool `mapstructure:"workspace_consistency_check"`
}

// SecurityConfig 安全配置
type SecurityConfig struct {
	DataClassificationEnabled bool              `mapstructure:"data_classification_enabled"`
	PIISanitizationEnabled    bool              `mapstructure:"pii_sanitization_enabled"`
	AuditLoggingEnabled       bool              `mapstructure:"audit_logging_enabled"`
	AuditLogRetentionDays     int               `mapstructure:"audit_log_retention_days"`
	ComplianceCheckEnabled    bool              `mapstructure:"compliance_check_enabled"`
	KeyRotationWarningDays    int               `mapstructure:"key_rotation_warning_days"`
	AdminEmails               []string          `mapstructure:"admin_emails"`
	AdminRoles                map[string]string `mapstructure:"admin_roles"`
	SupplyChain               SupplyChainConfig `mapstructure:"supply_chain"`
}

// SupplyChainConfig 供应链安全配置
type SupplyChainConfig struct {
	License LicenseComplianceConfig `mapstructure:"license"`
	SBOM    SBOMConfig              `mapstructure:"sbom"`
	Signing ArtifactSigningConfig   `mapstructure:"signing"`
}

// LicenseComplianceConfig 依赖许可审查配置
type LicenseComplianceConfig struct {
	Enabled       bool     `mapstructure:"enabled"`
	Allowed       []string `mapstructure:"allowed"`
	Review        []string `mapstructure:"review"`
	Denied        []string `mapstructure:"denied"`
	DefaultAction string   `mapstructure:"default_action"`
}

// SBOMConfig SBOM 生成与存档配置
type SBOMConfig struct {
	Enabled       bool     `mapstructure:"enabled"`
	Formats       []string `mapstructure:"formats"`
	RetentionDays int      `mapstructure:"retention_days"`
}

// ArtifactSigningConfig 构建产物签名配置
type ArtifactSigningConfig struct {
	Required          bool     `mapstructure:"required"`
	VerifyOnUpload    bool     `mapstructure:"verify_on_upload"`
	AllowedAlgorithms []string `mapstructure:"allowed_algorithms"`
	AllowedSigners    []string `mapstructure:"allowed_signers"`
}

// RetentionConfig 数据保留配置
type RetentionConfig struct {
	Enabled                       bool          `mapstructure:"enabled"`
	CleanupInterval               time.Duration `mapstructure:"cleanup_interval"`
	ExecutionLogRetentionDays     int           `mapstructure:"execution_log_retention_days"`
	AnonymousSessionRetentionDays int           `mapstructure:"anonymous_session_retention_days"`
	WorkspaceDeletionGraceDays    int           `mapstructure:"workspace_deletion_grace_days"`
	WorkspaceColdStorageDays      int           `mapstructure:"workspace_cold_storage_days"`
}

// ArchiveConfig 导出与归档配置
type ArchiveConfig struct {
	Enabled                 bool          `mapstructure:"enabled"`
	BasePath                string        `mapstructure:"base_path"`
	ExportRetentionDays     int           `mapstructure:"export_retention_days"`
	WorkerInterval          time.Duration `mapstructure:"worker_interval"`
	MaxJobsPerTick          int           `mapstructure:"max_jobs_per_tick"`
	LogArchiveEnabled       bool          `mapstructure:"log_archive_enabled"`
	LogArchiveRetentionDays int           `mapstructure:"log_archive_retention_days"`
	LogArchiveBatchDays     int           `mapstructure:"log_archive_batch_days"`
	LogArchiveDelayDays     int           `mapstructure:"log_archive_delay_days"`
}

// CacheConfig 缓存配置
type CacheConfig struct {
	Runtime   RuntimeCacheConfig   `mapstructure:"runtime"`
	Execution ExecutionCacheConfig `mapstructure:"execution"`
}

// RuntimeCacheConfig 运行时缓存配置
type RuntimeCacheConfig struct {
	EntryTTL       time.Duration `mapstructure:"entry_ttl"`
	NegativeTTL    time.Duration `mapstructure:"negative_ttl"`
	SchemaTTL      time.Duration `mapstructure:"schema_ttl"`
	SchemaStaleTTL time.Duration `mapstructure:"schema_stale_ttl"`
}

// ExecutionCacheConfig 执行缓存配置
type ExecutionCacheConfig struct {
	ResultTTL time.Duration `mapstructure:"result_ttl"`
}

// VMRuntimeConfig VM 运行时配置
type VMRuntimeConfig struct {
	Enabled       bool          `mapstructure:"enabled"`
	BaseDir       string        `mapstructure:"base_dir"`
	MaxVMs        int           `mapstructure:"max_vms"`
	ExecTimeout   time.Duration `mapstructure:"exec_timeout"`
	LoadTimeout   time.Duration `mapstructure:"load_timeout"`
	MaxCodeSize   int64         `mapstructure:"max_code_size"`
	MaxDBSize     int64         `mapstructure:"max_db_size"`
	EvictInterval time.Duration `mapstructure:"evict_interval"`
}

// Load 加载配置
func Load() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")
	viper.AddConfigPath("../../config")    // 从 cmd/server 运行时
	viper.AddConfigPath("../../../config") // 备用路径
	viper.AddConfigPath("/etc/reverseai")

	// 设置默认值
	setDefaults()

	// 环境变量
	viper.SetEnvPrefix("reverseai")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	// 读取配置文件
	if err := viper.ReadInConfig(); err != nil {
		// 如果配置文件不存在，使用默认值和环境变量
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, err
		}
	}

	envName := strings.ToLower(strings.TrimSpace(viper.GetString("env")))
	if envName != "" {
		viper.SetConfigName("config." + envName)
		if err := viper.MergeInConfig(); err != nil {
			if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
				return nil, err
			}
		}
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	normalizeDeploymentConfig(&cfg)
	normalizeSecurityConfig(&cfg)

	return &cfg, nil
}

func setDefaults() {
	// 环境
	viper.SetDefault("env", "development")

	// 服务器
	viper.SetDefault("server.host", "0.0.0.0")
	viper.SetDefault("server.port", 3010)
	viper.SetDefault("server.mode", "development")
	viper.SetDefault("server.base_url", "http://localhost:3010")

	// 多地域部署
	viper.SetDefault("deployment.region", "local")
	viper.SetDefault("deployment.primary_region", "local")
	viper.SetDefault("deployment.regions", []string{"local"})
	viper.SetDefault("deployment.region_base_urls", map[string]string{})

	// 数据库 (MySQL)
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", 3306)
	viper.SetDefault("database.user", "root")
	viper.SetDefault("database.password", "")
	viper.SetDefault("database.name", "reverseai")
	viper.SetDefault("database.charset", "utf8mb4")
	viper.SetDefault("database.max_open_conns", 100)
	viper.SetDefault("database.max_idle_conns", 10)

	// Redis
	viper.SetDefault("redis.host", "localhost")
	viper.SetDefault("redis.port", 6379)
	viper.SetDefault("redis.password", "")
	viper.SetDefault("redis.db", 0)

	// Execution
	viper.SetDefault("execution.max_concurrent", 10)
	viper.SetDefault("execution.max_in_flight", 100)
	viper.SetDefault("execution.timeout", "5m")

	// Queue / Worker
	viper.SetDefault("queue.worker_concurrency", 10)
	viper.SetDefault("queue.queues.execution", 6)
	viper.SetDefault("queue.queues.db_provision", 3)
	viper.SetDefault("queue.queues.domain_verify", 2)
	viper.SetDefault("queue.queues.metrics_aggregation", 1)
	viper.SetDefault("queue.queues.webhook", 3)
	viper.SetDefault("queue.queues.scheduled", 1)

	// JWT
	viper.SetDefault("jwt.secret", "your-secret-key-change-in-production")
	viper.SetDefault("jwt.access_token_expire", "15m")
	viper.SetDefault("jwt.refresh_token_expire", "168h")

	// Captcha
	viper.SetDefault("captcha.provider", "")
	viper.SetDefault("captcha.secret", "")
	viper.SetDefault("captcha.verify_url", "https://challenges.cloudflare.com/turnstile/v0/siteverify")
	viper.SetDefault("captcha.timeout_seconds", 3)

	// AI
	viper.SetDefault("ai.default_model", "gpt-4")

	// Encryption - 32字节的密钥用于API密钥加密
	viper.SetDefault("encryption.key", "change-this-to-a-32-byte-secret!")

	// Feature Flags
	viper.SetDefault("features.workspace_enabled", true)
	viper.SetDefault("features.workspace_runtime_enabled", true)
	viper.SetDefault("features.domain_enabled", true)

	// Domain Routing
	viper.SetDefault("domain_routing.provider", "")
	viper.SetDefault("domain_routing.webhook_url", "")
	viper.SetDefault("domain_routing.webhook_token", "")
	viper.SetDefault("domain_routing.timeout_seconds", 3)

	// Certificate Issuer
	viper.SetDefault("certificate_issuer.provider", "")
	viper.SetDefault("certificate_issuer.webhook_url", "")
	viper.SetDefault("certificate_issuer.webhook_token", "")
	viper.SetDefault("certificate_issuer.timeout_seconds", 5)

	// Domain Lifecycle
	viper.SetDefault("domain_lifecycle.enabled", true)
	viper.SetDefault("domain_lifecycle.interval", "6h")
	viper.SetDefault("domain_lifecycle.domain_expiry_warning_days", 30)
	viper.SetDefault("domain_lifecycle.ssl_expiry_warning_days", 14)
	viper.SetDefault("domain_lifecycle.ssl_auto_renew_days", 7)
	viper.SetDefault("domain_lifecycle.max_domains_per_tick", 200)

	// Connector Health
	viper.SetDefault("connector_health.enabled", true)
	viper.SetDefault("connector_health.interval", "6h")
	viper.SetDefault("connector_health.expiry_warning_days", 7)

	// Migration
	viper.SetDefault("migration.workspace_backfill_enabled", false)
	viper.SetDefault("migration.workspace_consistency_check", false)

	// Security
	viper.SetDefault("security.data_classification_enabled", true)
	viper.SetDefault("security.pii_sanitization_enabled", true)
	viper.SetDefault("security.audit_logging_enabled", true)
	viper.SetDefault("security.audit_log_retention_days", 90)
	viper.SetDefault("security.compliance_check_enabled", true)
	viper.SetDefault("security.key_rotation_warning_days", 7)
	viper.SetDefault("security.admin_emails", []string{})
	viper.SetDefault("security.admin_roles", map[string]string{})
	viper.SetDefault("security.supply_chain.license.enabled", true)
	viper.SetDefault("security.supply_chain.license.default_action", "review")
	viper.SetDefault("security.supply_chain.license.allowed", []string{"MIT", "Apache-2.0", "BSD-3-Clause", "BSD-2-Clause", "ISC"})
	viper.SetDefault("security.supply_chain.license.review", []string{"LGPL-2.1", "LGPL-3.0", "MPL-2.0"})
	viper.SetDefault("security.supply_chain.license.denied", []string{"GPL-3.0", "GPL-3.0-only", "AGPL-3.0", "AGPL-3.0-only"})
	viper.SetDefault("security.supply_chain.sbom.enabled", true)
	viper.SetDefault("security.supply_chain.sbom.formats", []string{"spdx-json", "cyclonedx-json"})
	viper.SetDefault("security.supply_chain.sbom.retention_days", 180)
	viper.SetDefault("security.supply_chain.signing.required", true)
	viper.SetDefault("security.supply_chain.signing.verify_on_upload", true)
	viper.SetDefault("security.supply_chain.signing.allowed_algorithms", []string{"cosign"})
	viper.SetDefault("security.supply_chain.signing.allowed_signers", []string{})

	// Cache
	viper.SetDefault("cache.runtime.entry_ttl", "30s")
	viper.SetDefault("cache.runtime.negative_ttl", "10s")
	viper.SetDefault("cache.runtime.schema_ttl", "60s")
	viper.SetDefault("cache.runtime.schema_stale_ttl", "30s")
	viper.SetDefault("cache.execution.result_ttl", "2m")

	// Retention
	viper.SetDefault("retention.enabled", true)
	viper.SetDefault("retention.cleanup_interval", "24h")
	viper.SetDefault("retention.execution_log_retention_days", 30)
	viper.SetDefault("retention.anonymous_session_retention_days", 7)
	viper.SetDefault("retention.workspace_deletion_grace_days", 7)
	viper.SetDefault("retention.workspace_cold_storage_days", 30)

	// VM Runtime
	viper.SetDefault("vm_runtime.enabled", true)
	viper.SetDefault("vm_runtime.base_dir", "data/vm")
	viper.SetDefault("vm_runtime.max_vms", 100)
	viper.SetDefault("vm_runtime.exec_timeout", "10s")
	viper.SetDefault("vm_runtime.load_timeout", "5s")
	viper.SetDefault("vm_runtime.max_code_size", 1048576)
	viper.SetDefault("vm_runtime.max_db_size", 104857600)
	viper.SetDefault("vm_runtime.evict_interval", "30m")

	// Archive / Export
	viper.SetDefault("archive.enabled", true)
	viper.SetDefault("archive.base_path", "./data/exports")
	viper.SetDefault("archive.export_retention_days", 7)
	viper.SetDefault("archive.worker_interval", "30s")
	viper.SetDefault("archive.max_jobs_per_tick", 3)
	viper.SetDefault("archive.log_archive_enabled", true)
	viper.SetDefault("archive.log_archive_retention_days", 365)
	viper.SetDefault("archive.log_archive_batch_days", 1)
	viper.SetDefault("archive.log_archive_delay_days", 1)
}

func normalizeDeploymentConfig(cfg *Config) {
	if cfg == nil {
		return
	}

	if envRegions := strings.TrimSpace(os.Getenv("reverseai_DEPLOYMENT_REGIONS")); envRegions != "" {
		cfg.Deployment.Regions = splitCSV(envRegions)
	}

	if cfg.Deployment.Region == "" && len(cfg.Deployment.Regions) > 0 {
		cfg.Deployment.Region = cfg.Deployment.Regions[0]
	}

	if cfg.Deployment.PrimaryRegion == "" {
		cfg.Deployment.PrimaryRegion = cfg.Deployment.Region
	}

	if len(cfg.Deployment.Regions) == 0 && cfg.Deployment.Region != "" {
		cfg.Deployment.Regions = []string{cfg.Deployment.Region}
	}

	if cfg.Deployment.RegionBaseURLs == nil {
		cfg.Deployment.RegionBaseURLs = map[string]string{}
	}
}

func normalizeSecurityConfig(cfg *Config) {
	if cfg == nil {
		return
	}

	if envEmails := strings.TrimSpace(os.Getenv("reverseai_SECURITY_ADMIN_EMAILS")); envEmails != "" {
		cfg.Security.AdminEmails = splitCSV(envEmails)
	}
	if envRoles := strings.TrimSpace(os.Getenv("reverseai_SECURITY_ADMIN_ROLES")); envRoles != "" {
		cfg.Security.AdminRoles = parseAdminRolePairs(envRoles)
	}

	if len(cfg.Security.AdminEmails) == 0 {
		cfg.Security.AdminEmails = []string{}
	}

	normalized := make([]string, 0, len(cfg.Security.AdminEmails))
	for _, email := range cfg.Security.AdminEmails {
		trimmed := strings.ToLower(strings.TrimSpace(email))
		if trimmed != "" {
			normalized = append(normalized, trimmed)
		}
	}
	cfg.Security.AdminEmails = normalized

	if cfg.Security.AdminRoles == nil {
		cfg.Security.AdminRoles = map[string]string{}
	}
	normalizedRoles := make(map[string]string, len(cfg.Security.AdminRoles))
	for email, role := range cfg.Security.AdminRoles {
		normalizedEmail := strings.ToLower(strings.TrimSpace(email))
		normalizedRole := strings.ToLower(strings.TrimSpace(role))
		if normalizedEmail == "" || normalizedRole == "" {
			continue
		}
		normalizedRoles[normalizedEmail] = normalizedRole
	}
	cfg.Security.AdminRoles = normalizedRoles

	if len(cfg.Security.AdminRoles) > 0 {
		emailSet := map[string]struct{}{}
		for _, email := range cfg.Security.AdminEmails {
			emailSet[email] = struct{}{}
		}
		for email := range cfg.Security.AdminRoles {
			if _, exists := emailSet[email]; !exists {
				cfg.Security.AdminEmails = append(cfg.Security.AdminEmails, email)
				emailSet[email] = struct{}{}
			}
		}
	}
}

func splitCSV(value string) []string {
	raw := strings.Split(value, ",")
	out := make([]string, 0, len(raw))
	for _, item := range raw {
		trimmed := strings.TrimSpace(item)
		if trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}

func parseAdminRolePairs(value string) map[string]string {
	out := map[string]string{}
	for _, item := range strings.Split(value, ",") {
		pair := strings.TrimSpace(item)
		if pair == "" {
			continue
		}
		var key string
		var role string
		if parts := strings.SplitN(pair, "=", 2); len(parts) == 2 {
			key = parts[0]
			role = parts[1]
		} else if parts := strings.SplitN(pair, ":", 2); len(parts) == 2 {
			key = parts[0]
			role = parts[1]
		} else {
			continue
		}
		email := strings.ToLower(strings.TrimSpace(key))
		normalizedRole := strings.ToLower(strings.TrimSpace(role))
		if email == "" || normalizedRole == "" {
			continue
		}
		out[email] = normalizedRole
	}
	return out
}
