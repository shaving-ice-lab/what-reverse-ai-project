package vmruntime

// VMTableInfo represents basic information about a table.
type VMTableInfo struct {
	Name        string `json:"name"`
	RowCount    int64  `json:"row_count_est"`
	ColumnCount int    `json:"column_count"`
}

// VMColumnInfo represents a column in a table.
type VMColumnInfo struct {
	Name            string  `json:"name"`
	Type            string  `json:"type"`
	Nullable        bool    `json:"nullable"`
	DefaultValue    *string `json:"default_value"`
	IsPrimaryKey    bool    `json:"is_primary_key"`
	IsUnique        bool    `json:"is_unique"`
	OrdinalPosition int     `json:"ordinal_position"`
	Extra           string  `json:"extra,omitempty"`
}

// VMTableSchema represents the full schema of a table.
type VMTableSchema struct {
	Name        string         `json:"name"`
	Columns     []VMColumnInfo `json:"columns"`
	PrimaryKey  []string       `json:"primary_key"`
	ForeignKeys []VMForeignKey `json:"foreign_keys"`
	Indexes     []VMIndex      `json:"indexes"`
	DDL         string         `json:"ddl"`
}

// VMForeignKey represents a foreign key constraint.
type VMForeignKey struct {
	Name            string `json:"name"`
	From            string `json:"column"`
	ReferencedTable string `json:"referenced_table"`
	ReferencedCol   string `json:"referenced_column"`
	OnUpdate        string `json:"on_update"`
	OnDelete        string `json:"on_delete"`
}

// VMIndex represents an index on a table.
type VMIndex struct {
	Name      string   `json:"name"`
	IsUnique  bool     `json:"is_unique"`
	IsPrimary bool     `json:"is_primary"`
	Type      string   `json:"type"`
	Columns   []string `json:"columns"`
}

// VMSchemaGraph represents the schema graph with tables and their relationships.
type VMSchemaGraph struct {
	Nodes []VMSchemaGraphNode `json:"nodes"`
	Edges []VMSchemaGraphEdge `json:"edges"`
}

// VMSchemaGraphNode represents a table node in the schema graph.
type VMSchemaGraphNode struct {
	ID      string         `json:"id"`
	Name    string         `json:"name"`
	Columns []VMColumnInfo `json:"columns"`
}

// VMSchemaGraphEdge represents a foreign key edge in the schema graph.
type VMSchemaGraphEdge struct {
	ID             string `json:"id"`
	Source         string `json:"source"`
	Target         string `json:"target"`
	SourceColumn   string `json:"source_column"`
	TargetColumn   string `json:"target_column"`
	ConstraintName string `json:"constraint_name"`
}

// VMDatabaseStats represents aggregate statistics for a workspace database.
type VMDatabaseStats struct {
	TableCount  int    `json:"table_count"`
	TotalRows   int64  `json:"total_rows"`
	FileSizeKB  int64  `json:"file_size_kb"`
	IndexCount  int    `json:"index_count"`
	JournalMode string `json:"journal_mode"`
}

// VMQueryParams specifies query parameters for row queries.
type VMQueryParams struct {
	Page             int             `json:"page"`
	PageSize         int             `json:"page_size"`
	OrderBy          string          `json:"order_by"`
	OrderDir         string          `json:"order_dir"`
	Filters          []VMQueryFilter `json:"filters,omitempty"`
	FilterCombinator string          `json:"filter_combinator,omitempty"`
}

// VMQueryFilter represents a single filter condition.
type VMQueryFilter struct {
	Column   string `json:"column"`
	Operator string `json:"operator"`
	Value    string `json:"value"`
}

// VMQueryResult represents the result of a query.
type VMQueryResult struct {
	Columns      []string                 `json:"columns"`
	Rows         []map[string]interface{} `json:"rows"`
	TotalCount   int64                    `json:"total_count"`
	AffectedRows int64                    `json:"affected_rows"`
	DurationMs   int64                    `json:"duration_ms"`
}

// VMExecResult represents the result of an insert/update/delete operation.
type VMExecResult struct {
	LastInsertID int64 `json:"last_insert_id,omitempty"`
	AffectedRows int64 `json:"affected_rows"`
}

// VMCreateTableRequest represents a request to create a new table.
type VMCreateTableRequest struct {
	Name       string              `json:"name"`
	Columns    []VMCreateColumnDef `json:"columns"`
	PrimaryKey []string            `json:"primary_key"`
	Indexes    []VMCreateIndexDef  `json:"indexes"`
}

// VMCreateColumnDef represents a column definition for table creation.
type VMCreateColumnDef struct {
	Name         string  `json:"name"`
	Type         string  `json:"type"`
	Nullable     bool    `json:"nullable"`
	DefaultValue *string `json:"default_value"`
	Unique       bool    `json:"unique"`
}

// VMCreateIndexDef represents an index definition for table creation.
type VMCreateIndexDef struct {
	Name    string   `json:"name"`
	Columns []string `json:"columns"`
	Unique  bool     `json:"unique"`
}

// VMAlterTableRequest represents a request to alter an existing table.
type VMAlterTableRequest struct {
	AddColumns   []VMCreateColumnDef `json:"add_columns,omitempty"`
	AlterColumns []VMAlterColumnDef  `json:"alter_columns,omitempty"`
	DropColumns  []string            `json:"drop_columns,omitempty"`
	Rename       string              `json:"rename,omitempty"`
}

// VMAlterColumnDef represents a column alteration definition.
type VMAlterColumnDef struct {
	Name         string  `json:"name"`
	NewName      string  `json:"new_name,omitempty"`
	Type         string  `json:"type,omitempty"`
	Nullable     *bool   `json:"nullable,omitempty"`
	DefaultValue *string `json:"default_value,omitempty"`
}

// VMQueryHistoryItem represents a query history entry.
type VMQueryHistoryItem struct {
	SQL        string `json:"sql"`
	DurationMs int64  `json:"duration_ms"`
	Status     string `json:"status"`
	CreatedAt  string `json:"created_at"`
	Error      string `json:"error,omitempty"`
}
