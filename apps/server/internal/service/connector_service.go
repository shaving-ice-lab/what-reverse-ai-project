package service

// DataSourceCatalogItem 数据源连接器清单项
type DataSourceCatalogItem struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	Category      string   `json:"category"`
	ConnectorType string   `json:"connector_type"`
	Description   string   `json:"description"`
	DocsURL       string   `json:"docs_url"`
	AuthMethods   []string `json:"auth_methods"`
	Capabilities  []string `json:"capabilities"`
	DefaultPort   *int     `json:"default_port,omitempty"`
}

// ConnectorService 连接器服务接口
type ConnectorService interface {
	ListDataSourceCatalog() []DataSourceCatalogItem
}

type connectorService struct{}

// NewConnectorService 创建连接器服务
func NewConnectorService() ConnectorService {
	return &connectorService{}
}

func (s *connectorService) ListDataSourceCatalog() []DataSourceCatalogItem {
	postgresPort := 5432
	mysqlPort := 3306
	redisPort := 6379

	return []DataSourceCatalogItem{
		{
			ID:            "postgres",
			Name:          "PostgreSQL",
			Category:      "database",
			ConnectorType: "sql",
			Description:   "面向事务与复杂查询的关系型数据库连接器。",
			DocsURL:       "https://www.postgresql.org/docs/",
			AuthMethods:   []string{"username_password", "connection_string"},
			Capabilities:  []string{"transactions", "jsonb", "schema_migrations"},
			DefaultPort:   &postgresPort,
		},
		{
			ID:            "mysql",
			Name:          "MySQL",
			Category:      "database",
			ConnectorType: "sql",
			Description:   "通用关系型数据库连接器，适配常见业务数据存储。",
			DocsURL:       "https://dev.mysql.com/doc/",
			AuthMethods:   []string{"username_password", "connection_string"},
			Capabilities:  []string{"transactions", "schema_migrations"},
			DefaultPort:   &mysqlPort,
		},
		{
			ID:            "redis",
			Name:          "Redis",
			Category:      "cache",
			ConnectorType: "kv",
			Description:   "高性能键值缓存与队列型数据连接器。",
			DocsURL:       "https://redis.io/docs/latest/",
			AuthMethods:   []string{"password", "connection_string"},
			Capabilities:  []string{"ttl", "pubsub", "streams"},
			DefaultPort:   &redisPort,
		},
		{
			ID:            "s3",
			Name:          "S3",
			Category:      "object_storage",
			ConnectorType: "object",
			Description:   "对象存储连接器，适配文件上传、素材与模型存储。",
			DocsURL:       "https://docs.aws.amazon.com/s3/",
			AuthMethods:   []string{"access_key", "iam_role"},
			Capabilities:  []string{"bucket", "multipart_upload", "presigned_url"},
		},
	}
}
