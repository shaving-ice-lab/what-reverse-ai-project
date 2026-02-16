package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/reverseai/server/internal/config"
	"github.com/reverseai/server/internal/pkg/database"
	"github.com/reverseai/server/internal/vmruntime"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	workspaceID = "8930350b-79b7-4307-ae2b-a426375fa2e7"
)

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load("../../.env")

	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("❌ 无法加载配置: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("🚀 SG Fleet Management System — Database Init & Seed")
	fmt.Println("===================================================")

	// 1. 连接主数据库
	db, err := database.New(&cfg.Database)
	if err != nil {
		fmt.Printf("❌ 无法连接主数据库: %v\n", err)
		os.Exit(1)
	}
	if err := database.Migrate(db); err != nil {
		fmt.Printf("❌ 主数据库迁移失败: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ Main database connected")

	// 2. 确保 Demo 用户和 Workspace 存在
	wsID := uuid.MustParse(workspaceID)
	if err := ensureUserAndWorkspace(db, wsID); err != nil {
		fmt.Printf("❌ 创建用户/工作空间失败: %v\n", err)
		os.Exit(1)
	}

	// 3. 初始化 VMStore (SQLite)
	vmStore := vmruntime.NewVMStore(cfg.VMRuntime.BaseDir)
	defer vmStore.Close()

	wsDB, err := vmStore.GetDB(wsID.String())
	if err != nil {
		fmt.Printf("❌ 无法打开工作空间 SQLite 数据库: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("✅ 工作空间 SQLite 数据库: %s\n", vmStore.DBPath(wsID.String()))

	// 4. 创建表结构
	ctx := context.Background()
	if err := createFleetTables(ctx, wsDB); err != nil {
		fmt.Printf("❌ 创建表失败: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ Fleet management tables created")

	// 5. 填充数据
	if err := seedFleetData(ctx, wsDB); err != nil {
		fmt.Printf("❌ 数据填充失败: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ Fleet management data seeded")

	// 6. 查询 workspace owner_user_id
	ownerID, err := getWorkspaceOwner(db, wsID)
	if err != nil {
		fmt.Printf("❌ 无法获取工作空间所有者: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("✅ Workspace owner: %s\n", ownerID)

	// 7. 创建 UI Schema (AppSchema v2.0) + 版本 + 发布
	if err := seedUISchemaAndPublish(db, wsID, ownerID); err != nil {
		fmt.Printf("❌ UI Schema 创建失败: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ UI Schema created and published")

	// 8. 创建 Mock Agent Chat 会话
	if err := seedAgentChatSessions(db, wsID, ownerID); err != nil {
		fmt.Printf("❌ Agent Chat 会话创建失败: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ Agent Chat sessions created")

	// 9. 设置 slug 别名 + 公开访问
	if err := seedSlugAndAccess(db, wsID); err != nil {
		fmt.Printf("❌ Slug/访问配置失败: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ Slug and access policy configured")

	// 10. 获取 workspace slug
	var wsSlug string
	db.Table("what_reverse_workspaces").Where("id = ?", wsID.String()).Pluck("slug", &wsSlug)

	fmt.Println("===================================================")
	fmt.Println("🎉 SG Fleet Management System initialized!")
	fmt.Println("  📱 Visit Agent page to view chat history")
	fmt.Println("  📊 Visit Database page to view data tables")
	fmt.Println("  🖥️  Visit Builder > Preview to see the app")
	fmt.Printf("  🌐 Runtime: http://localhost:3011/runtime/%s\n", wsSlug)
	fmt.Println("  🌐 Runtime (alias): http://localhost:3011/runtime/fleet")
}

// ensureUserAndWorkspace 确保 Demo 用户和 Workspace 存在（seed 自包含）
func ensureUserAndWorkspace(db *gorm.DB, wsID uuid.UUID) error {
	// 检查 workspace 是否已存在
	var wsCount int64
	db.Table("what_reverse_workspaces").Where("id = ?", wsID.String()).Count(&wsCount)
	if wsCount > 0 {
		fmt.Println("✅ 工作空间已存在，跳过创建")
		return nil
	}

	// Workspace 不存在 — 需要先确保有一个 Demo 用户
	demoUserID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	demoEmail := "demo@reverseai.app"

	var userCount int64
	db.Table("what_reverse_users").Where("id = ?", demoUserID.String()).Count(&userCount)
	if userCount == 0 {
		// 创建 Demo 用户（密码: demo123456）
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("demo123456"), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("密码加密失败: %w", err)
		}
		displayName := "Demo User"
		now := time.Now()
		if err := db.Table("what_reverse_users").Create(map[string]interface{}{
			"id":              demoUserID.String(),
			"email":           demoEmail,
			"username":        "demo",
			"display_name":    displayName,
			"password_hash":   string(hashedPassword),
			"email_verified":  true,
			"role":            "user",
			"status":          "active",
			"plan":            "free",
			"agent_count":     0,
			"follower_count":  0,
			"following_count": 0,
			"created_at":      now,
			"updated_at":      now,
		}).Error; err != nil {
			// 可能 email/username 冲突，尝试查找已有用户
			if strings.Contains(err.Error(), "Duplicate") || strings.Contains(err.Error(), "UNIQUE") {
				fmt.Println("  ⚠️  Demo 用户已存在（email/username 冲突），使用已有用户")
				db.Table("what_reverse_users").Where("email = ?", demoEmail).Pluck("id", &demoUserID)
			} else {
				return fmt.Errorf("创建 Demo 用户: %w", err)
			}
		} else {
			fmt.Printf("✅ 已创建 Demo 用户 (email: %s, 密码: demo123456)\n", demoEmail)
		}
	} else {
		fmt.Println("✅ Demo 用户已存在")
	}

	// 创建 Workspace
	now := time.Now()
	if err := db.Table("what_reverse_workspaces").Create(map[string]interface{}{
		"id":                  wsID.String(),
		"owner_user_id":       demoUserID.String(),
		"name":                "SG Fleet Management",
		"slug":                "fleet-" + wsID.String()[:8],
		"icon":                "🚐",
		"status":              "active",
		"app_status":          "draft",
		"access_mode":         "private",
		"plan":                "free",
		"pricing_type":        "free",
		"data_classification": "public",
		"require_captcha":     false,
		"created_at":          now,
		"updated_at":          now,
	}).Error; err != nil {
		return fmt.Errorf("创建工作空间: %w", err)
	}
	fmt.Printf("✅ 已创建工作空间 (ID: %s)\n", wsID)

	return nil
}

func createFleetTables(ctx context.Context, db *sql.DB) error {
	// SQLite DDL — each CREATE TABLE must be executed separately
	tables := []string{
		`CREATE TABLE IF NOT EXISTS vehicles (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	plate_number TEXT NOT NULL UNIQUE,
	vin TEXT,
	brand TEXT NOT NULL,
	model TEXT NOT NULL,
	vehicle_type TEXT NOT NULL DEFAULT 'Sedan',
	color TEXT,
	engine_no TEXT,
	purchase_date TEXT,
	purchase_price REAL,
	mileage INTEGER DEFAULT 0,
	fuel_type TEXT DEFAULT 'Petrol',
	fuel_tank_capacity REAL,
	seat_count INTEGER DEFAULT 5,
	status TEXT NOT NULL DEFAULT 'Online',
	department TEXT,
	gps_device_id TEXT,
	annual_inspection_date TEXT,
	insurance_expire_date TEXT,
	notes TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	deleted_at TEXT
)`,
		`CREATE TABLE IF NOT EXISTS drivers (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	gender TEXT DEFAULT 'M',
	phone TEXT NOT NULL,
	id_card TEXT,
	license_no TEXT,
	license_type TEXT DEFAULT 'C1',
	license_expire_date TEXT,
	hire_date TEXT,
	department TEXT,
	status TEXT NOT NULL DEFAULT 'Active',
	assigned_vehicle_id INTEGER,
	emergency_contact TEXT,
	emergency_phone TEXT,
	address TEXT,
	driving_years INTEGER DEFAULT 0,
	violation_count INTEGER DEFAULT 0,
	accident_count INTEGER DEFAULT 0,
	rating REAL DEFAULT 5.0,
	avatar_url TEXT,
	notes TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	deleted_at TEXT
)`,
		`CREATE TABLE IF NOT EXISTS routes (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	route_code TEXT UNIQUE,
	start_point TEXT NOT NULL,
	end_point TEXT NOT NULL,
	waypoints TEXT,
	distance_km REAL,
	estimated_duration_min INTEGER,
	route_type TEXT DEFAULT 'City',
	status TEXT DEFAULT 'Active',
	notes TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	deleted_at TEXT
)`,
		`CREATE TABLE IF NOT EXISTS trips (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	trip_no TEXT NOT NULL UNIQUE,
	vehicle_id INTEGER NOT NULL,
	driver_id INTEGER NOT NULL,
	route_id INTEGER,
	start_time TEXT NOT NULL,
	end_time TEXT,
	start_location TEXT,
	end_location TEXT,
	start_mileage INTEGER,
	end_mileage INTEGER,
	distance_km REAL,
	fuel_consumed REAL,
	purpose TEXT,
	status TEXT DEFAULT 'In Progress',
	passenger_count INTEGER DEFAULT 0,
	cargo_weight REAL,
	max_speed REAL,
	avg_speed REAL,
	notes TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	deleted_at TEXT
)`,
		`CREATE TABLE IF NOT EXISTS maintenance_records (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	record_no TEXT NOT NULL UNIQUE,
	vehicle_id INTEGER NOT NULL,
	maintenance_type TEXT NOT NULL,
	description TEXT,
	service_provider TEXT,
	mileage_at_service INTEGER,
	cost REAL DEFAULT 0,
	parts_cost REAL DEFAULT 0,
	labor_cost REAL DEFAULT 0,
	start_date TEXT NOT NULL,
	end_date TEXT,
	next_maintenance_date TEXT,
	next_maintenance_mileage INTEGER,
	status TEXT DEFAULT 'Pending',
	quality_rating INTEGER,
	notes TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	deleted_at TEXT
)`,
		`CREATE TABLE IF NOT EXISTS fuel_records (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	vehicle_id INTEGER NOT NULL,
	driver_id INTEGER,
	fuel_date TEXT NOT NULL,
	fuel_type TEXT NOT NULL,
	quantity REAL NOT NULL,
	unit_price REAL NOT NULL,
	total_cost REAL NOT NULL,
	mileage_at_fuel INTEGER,
	gas_station TEXT,
	payment_method TEXT DEFAULT 'Corp Card',
	invoice_no TEXT,
	is_full_tank INTEGER DEFAULT 1,
	notes TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	deleted_at TEXT
)`,
		`CREATE TABLE IF NOT EXISTS violations (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	vehicle_id INTEGER NOT NULL,
	driver_id INTEGER,
	violation_date TEXT NOT NULL,
	violation_location TEXT,
	violation_type TEXT NOT NULL,
	violation_code TEXT,
	fine_amount REAL DEFAULT 0,
	deduction_points INTEGER DEFAULT 0,
	status TEXT DEFAULT 'Pending',
	handler TEXT,
	handled_date TEXT,
	evidence_url TEXT,
	notes TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	deleted_at TEXT
)`,
		`CREATE TABLE IF NOT EXISTS insurance_policies (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	vehicle_id INTEGER NOT NULL,
	policy_no TEXT NOT NULL UNIQUE,
	insurance_company TEXT NOT NULL,
	insurance_type TEXT NOT NULL,
	premium REAL NOT NULL,
	coverage_amount REAL,
	start_date TEXT NOT NULL,
	end_date TEXT NOT NULL,
	status TEXT DEFAULT 'Active',
	claim_count INTEGER DEFAULT 0,
	total_claim_amount REAL DEFAULT 0,
	agent_name TEXT,
	agent_phone TEXT,
	notes TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	deleted_at TEXT
)`,
		`CREATE TABLE IF NOT EXISTS reservations (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	reservation_no TEXT NOT NULL UNIQUE,
	applicant_name TEXT NOT NULL,
	applicant_department TEXT,
	applicant_phone TEXT,
	vehicle_id INTEGER,
	driver_id INTEGER,
	purpose TEXT NOT NULL,
	passengers INTEGER DEFAULT 1,
	start_time TEXT NOT NULL,
	end_time TEXT NOT NULL,
	start_location TEXT NOT NULL,
	end_location TEXT NOT NULL,
	route_id INTEGER,
	status TEXT NOT NULL DEFAULT 'Pending',
	priority TEXT DEFAULT 'Normal',
	approver TEXT,
	approved_at TEXT,
	reject_reason TEXT,
	actual_start_time TEXT,
	actual_end_time TEXT,
	actual_mileage REAL,
	notes TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	deleted_at TEXT
)`,
		`CREATE TABLE IF NOT EXISTS gps_tracking (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	vehicle_id INTEGER NOT NULL,
	latitude REAL NOT NULL,
	longitude REAL NOT NULL,
	speed REAL DEFAULT 0,
	heading REAL,
	altitude REAL,
	location_name TEXT,
	status TEXT DEFAULT 'Moving',
	recorded_at TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`,
		`CREATE TABLE IF NOT EXISTS alerts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	vehicle_id INTEGER,
	driver_id INTEGER,
	alert_type TEXT NOT NULL,
	severity TEXT DEFAULT 'Medium',
	title TEXT NOT NULL,
	description TEXT,
	location TEXT,
	latitude REAL,
	longitude REAL,
	speed REAL,
	threshold_value TEXT,
	actual_value TEXT,
	status TEXT DEFAULT 'Unhandled',
	handler TEXT,
	handled_at TEXT,
	handle_result TEXT,
	alert_time TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	deleted_at TEXT
)`,
		`CREATE TABLE IF NOT EXISTS vehicle_capabilities (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	vehicle_id INTEGER NOT NULL,
	capability TEXT NOT NULL,
	description TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`,
	}

	for _, ddl := range tables {
		if _, err := db.ExecContext(ctx, ddl); err != nil {
			return fmt.Errorf("create table: %w", err)
		}
	}

	// Create indexes
	indexes := []string{
		`CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status)`,
		`CREATE INDEX IF NOT EXISTS idx_vehicles_department ON vehicles(department)`,
		`CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status)`,
		`CREATE INDEX IF NOT EXISTS idx_drivers_department ON drivers(department)`,
		`CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips(vehicle_id)`,
		`CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id)`,
		`CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status)`,
		`CREATE INDEX IF NOT EXISTS idx_trips_start_time ON trips(start_time)`,
		`CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_records(vehicle_id)`,
		`CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_records(status)`,
		`CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON fuel_records(vehicle_id)`,
		`CREATE INDEX IF NOT EXISTS idx_fuel_date ON fuel_records(fuel_date)`,
		`CREATE INDEX IF NOT EXISTS idx_violations_vehicle ON violations(vehicle_id)`,
		`CREATE INDEX IF NOT EXISTS idx_violations_status ON violations(status)`,
		`CREATE INDEX IF NOT EXISTS idx_insurance_vehicle ON insurance_policies(vehicle_id)`,
		`CREATE INDEX IF NOT EXISTS idx_insurance_end_date ON insurance_policies(end_date)`,
		`CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status)`,
		`CREATE INDEX IF NOT EXISTS idx_reservations_vehicle ON reservations(vehicle_id)`,
		`CREATE INDEX IF NOT EXISTS idx_reservations_start_time ON reservations(start_time)`,
		`CREATE INDEX IF NOT EXISTS idx_reservations_applicant ON reservations(applicant_name)`,
		`CREATE INDEX IF NOT EXISTS idx_gps_vehicle ON gps_tracking(vehicle_id)`,
		`CREATE INDEX IF NOT EXISTS idx_gps_recorded_at ON gps_tracking(recorded_at)`,
		`CREATE INDEX IF NOT EXISTS idx_gps_vehicle_time ON gps_tracking(vehicle_id, recorded_at)`,
		`CREATE INDEX IF NOT EXISTS idx_alerts_vehicle ON alerts(vehicle_id)`,
		`CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)`,
		`CREATE INDEX IF NOT EXISTS idx_alerts_alert_time ON alerts(alert_time)`,
		`CREATE INDEX IF NOT EXISTS idx_vc_vehicle ON vehicle_capabilities(vehicle_id)`,
		`CREATE INDEX IF NOT EXISTS idx_vc_capability ON vehicle_capabilities(capability)`,
	}

	for _, idx := range indexes {
		if _, err := db.ExecContext(ctx, idx); err != nil {
			return fmt.Errorf("create index: %w", err)
		}
	}

	return nil
}

func seedFleetData(ctx context.Context, db *sql.DB) error {
	// 先清理已有数据（防止重复插入）
	cleanTables := []string{
		"DELETE FROM vehicle_capabilities",
		"DELETE FROM gps_tracking",
		"DELETE FROM alerts",
		"DELETE FROM reservations",
		"DELETE FROM violations",
		"DELETE FROM fuel_records",
		"DELETE FROM trips",
		"DELETE FROM maintenance_records",
		"DELETE FROM insurance_policies",
		"DELETE FROM routes",
		"DELETE FROM drivers",
		"DELETE FROM vehicles",
	}
	for _, q := range cleanTables {
		if _, err := db.ExecContext(ctx, q); err != nil {
			return fmt.Errorf("清理已有数据: %w", err)
		}
	}
	fmt.Println("  🧹 已清理旧数据")

	// ---- 1. Vehicles (20) ----
	vehicleSQL := `
INSERT INTO vehicles (id, plate_number, vin, brand, model, vehicle_type, color, engine_no, purchase_date, purchase_price, mileage, fuel_type, fuel_tank_capacity, seat_count, status, department, gps_device_id, annual_inspection_date, insurance_expire_date, notes) VALUES
(1,  'SBA1001A', 'JTDKN3DU5N5012345', 'Mercedes-Benz', 'S450L',      'Sedan',  'Obsidian Black', 'M256-E30', '2023-03-15', 498000.00, 42580, 'Petrol',   66.00,  5,  'Online',         'CEO Office',   'GPS-001', '2025-03-15', '2025-03-15', 'CEO dedicated car'),
(2,  'SBA2002B', 'JTDKN3DU5N5012346', 'Tesla',          'Model Y',    'EV',     'Pearl White',    NULL,       '2023-05-20', 89990.00,  38200, 'Electric', NULL,   5,  'Online',         'Sales',        'GPS-002', '2025-05-20', '2025-05-20', 'Sales Director'),
(3,  'SBB3003C', 'LSVAU2180N2123456', 'Toyota',         'Camry 2.5',  'Sedan',  'Midnight Black', 'A25A-FKS', '2022-08-10', 189000.00, 67800, 'Petrol',   60.00,  5,  'Online',         'Admin',        'GPS-003', '2024-08-10', '2025-08-10', 'Business reception'),
(4,  'SBB4004D', 'LSVAU2180N2123457', 'Honda',          'Civic 1.5T', 'Sedan',  'Platinum White', 'L15C7',    '2022-06-15', 135000.00, 55200, 'Petrol',   47.00,  5,  'Offline',        'Marketing',    'GPS-004', '2024-06-15', '2025-06-15', 'Out for client visit'),
(5,  'SBC5005E', 'LGWEF4A47NF012345', 'Toyota',         'Fortuner',   'SUV',    'Attitude Black', '2GD-FTV',  '2022-11-01', 198000.00, 48600, 'Diesel',   80.00,  7,  'Online',         'Engineering',  'GPS-005', '2024-11-01', '2025-11-01', NULL),
(6,  'SBC6006F', 'LGWEF4A47NF012346', 'BMW',            'X5 xDrive',  'SUV',    'Space Grey',     'B58B30',   '2023-07-10', 378000.00, 28900, 'Petrol',   83.00,  5,  'Online',         'Product',      'GPS-006', '2025-07-10', '2025-07-10', 'Executive SUV'),
(7,  'SBD7007G', 'LFV2A2157N3012345', 'Mitsubishi',     'Fuso Canter', 'Truck', 'Blue',           '4P10-T6',  '2021-09-20', 128000.00, 125000, 'Diesel',  100.00, 3,  'Online',         'Logistics',    'GPS-007', '2024-09-20', '2025-09-20', '14ft box truck'),
(8,  'SBD8008H', 'LFV2A2157N3012346', 'Isuzu',          'NLR77',      'Truck',  'White',          '4JH1-TC',  '2022-01-15', 98000.00,  98000,  'Diesel',  80.00,  3,  'Maintenance',    'Logistics',    'GPS-008', '2024-01-15', '2025-01-15', 'Gearbox issue under repair'),
(9,  'SBE9009J', 'LNBSCCAK5ND012345', 'Yutong',         'ZK6826H',   'Bus',    'White',          'YC4FA130', '2021-05-10', 320000.00, 180000, 'Diesel',  200.00, 33, 'Offline',        'Admin',        'GPS-009', '2024-05-10', '2025-05-10', '33-seat shuttle bus, off on weekends'),
(10, 'SBE1010K', 'LNBSCCAK5ND012346', 'Zhongtong',      'LCK6127H',  'Bus',    'Silver',         'ISLe340',  '2022-03-01', 420000.00, 145000, 'Diesel',  300.00, 49, 'Offline',        'Admin',        'GPS-010', '2024-03-01', '2025-03-01', '49-seat coach, off on weekends'),
(11, 'SBF1011L', 'LVSHCFAE5NF012345', 'Hyundai',        'Ioniq 5',    'EV',     'Gravity Grey',   NULL,       '2023-09-01', 209000.00, 22000,  'Electric', NULL,  5,  'Maintenance',    'HR',           'GPS-011', '2025-09-01', '2025-09-01', 'Battery health check'),
(12, 'SBF1012M', 'LVSHCFAE5NF012346', 'Mercedes-Benz',  'E200',       'Sedan',  'Selenite Grey',  'M254-E20', '2022-04-20', 328000.00, 62000,  'Petrol',  66.00,  5,  'Offline',        'Finance',      'GPS-012', '2024-04-20', '2025-04-20', 'CFO on business trip'),
(13, 'SBG1013N', 'LSJA24U37NF012345', 'Toyota',         'Corolla Cross', 'SUV', 'Celestite Grey', '2ZR-FXE',  '2023-01-10', 169000.00, 32000,  'Hybrid',  43.00,  5,  'Offline',        'Admin',        'GPS-013', '2025-01-10', '2025-01-10', 'GPS signal issue'),
(14, 'SBG1014P', 'LFV2A2157N3012347', 'Isuzu',          'NPR75',      'Truck',  'Blue',           '4HK1-TC',  '2022-07-01', 115000.00, 88000,  'Diesel',  100.00, 3,  'Maintenance',    'Logistics',    'GPS-014', '2024-07-01', '2025-07-01', 'Engine fault under repair'),
(15, 'SBH1015Q', 'LVHRU5849N5012347', 'BMW',            'iX3',        'SUV',    'Phytonic Blue',  NULL,       '2023-11-15', 298000.00, 15000,  'Electric', NULL,  5,  'Online',         'R&D',          'GPS-015', '2025-11-15', '2025-11-15', NULL),
(16, 'SBH1016R', 'LVHRU5849N5012348', 'BYD',            'Atto 3',     'EV',     'Boulder Grey',   NULL,       '2023-08-20', 52000.00,  20000,  'Electric', NULL,  5,  'Online',         'Operations',   'GPS-016', '2025-08-20', '2025-08-20', NULL),
(17, 'SBJ1017S', 'LGWEF4A47NF012347', 'Toyota',         'Vios',       'Sedan',  'Red Mica',       '2NR-FE',   '2023-04-01', 95000.00,  28000,  'Petrol',  42.00,  5,  'Suspended',      'Customer Svc', 'GPS-017', '2025-04-01', '2025-04-01', 'Suspended, pending reassignment'),
(18, 'SBJ1018T', 'LFV2A2157N3012348', 'BYD',            'T3',         'Truck',  'White',          NULL,       '2023-06-01', 78000.00,  35000,  'Electric', NULL,  3,  'Suspended',      'Logistics',    'GPS-018', '2025-06-01', '2025-06-01', 'EV van, charger under repair'),
(19, 'SBK1019U', 'LSVAU2180N2123458', 'Nissan',         'Sylphy',     'Sedan',  'Brilliant Silver','MR20DD',  '2022-10-10', 105000.00, 51000,  'Petrol',  52.00,  5,  'Decommissioned', 'Legal',        'GPS-019', '2024-10-10', '2025-10-10', 'Engine failure, scrapped'),
(20, 'SBK1020V', 'LVHRU5849N5012349', 'Tesla',          'Model 3',    'EV',     'Midnight Silver', NULL,      '2024-01-05', 72000.00,  8000,   'Electric', NULL,  5,  'Decommissioned', 'Design',       'GPS-020', '2026-01-05', '2026-01-05', 'Collision accident, scrapped');
`
	if _, err := db.ExecContext(ctx, vehicleSQL); err != nil {
		return fmt.Errorf("插入车辆数据: %w", err)
	}
	fmt.Println("  🚗 已插入 20 辆车辆")

	// ---- 1b. Vehicle Capabilities ----
	capSQL := `
INSERT INTO vehicle_capabilities (vehicle_id, capability, description) VALUES
(1,  'VIP Reception',     'Premium leather seats, rear independent A/C, ideal for VIP reception'),
(1,  'Long Distance',     'Full tank range 800km+, suitable for long trips'),
(2,  'VIP Reception',     'Tesla premium EV, great for business reception'),
(2,  'Long Distance',     'Range 550km+, suitable for long trips'),
(3,  'Business Use',      'Mid-size sedan, suitable for general business use'),
(3,  'Long Distance',     'Large fuel tank, range 800km+'),
(4,  'Business Use',      'Compact sedan, daily business transport'),
(5,  'Off-Road',          'SUV with high ground clearance, handles unpaved roads'),
(5,  'Bulky Cargo',       'Large boot space, suitable for transporting bulky items'),
(6,  'VIP Reception',     'Luxury SUV, suitable for high-end reception'),
(6,  'Off-Road',          'All-terrain capability for rough roads'),
(6,  'Long Distance',     'Petrol with large tank, range over 900km'),
(7,  'Cargo Transport',   '14ft box truck, max payload 4 tonnes'),
(7,  'Bulky Cargo',       'Cargo box can transport large equipment and materials'),
(7,  'Heavy Equipment',   'Equipped with hydraulic tailgate for heavy equipment loading'),
(8,  'Cargo Transport',   'Box truck, max payload 3 tonnes'),
(8,  'Bulky Cargo',       'Suitable for transporting medium equipment'),
(9,  'Group Transport',   '33-seat bus, suitable for team outings'),
(9,  'Shuttle Service',   'Daily morning/evening shuttle service'),
(10, 'Group Transport',   '49-seat coach, suitable for large groups'),
(10, 'Shuttle Service',   'Shuttle bus service'),
(10, 'Long Distance',     'Coach long-distance transport capability'),
(11, 'Daily Commute',     'Economy EV, suitable for short daily trips'),
(12, 'VIP Reception',     'Mercedes E-Class, top choice for business reception'),
(12, 'Long Distance',     'Comfortable sedan for long business trips'),
(13, 'Daily Commute',     'Compact SUV hybrid, daily commute'),
(14, 'Cargo Transport',   'Medium truck, suitable for city delivery'),
(15, 'VIP Reception',     'BMW electric SUV, high-tech appeal'),
(15, 'Off-Road',          'Electric SUV with good ground clearance'),
(16, 'Daily Commute',     'Electric car, city commuting'),
(16, 'Long Distance',     'Range over 400km'),
(17, 'Daily Commute',     'Compact sedan, daily use'),
(18, 'Cargo Transport',   'Electric van, green city delivery'),
(18, 'Bulky Cargo',       'Electric truck, suitable for medium cargo');
`
	if _, err := db.ExecContext(ctx, capSQL); err != nil {
		return fmt.Errorf("insert vehicle capabilities: %w", err)
	}
	fmt.Println("  🏷️  Inserted 34 vehicle capability tags")

	// ---- 2. Drivers (18) ----
	driverSQL := `
INSERT INTO drivers (id, name, gender, phone, id_card, license_no, license_type, license_expire_date, hire_date, department, status, assigned_vehicle_id, emergency_contact, emergency_phone, address, driving_years, violation_count, accident_count, rating, notes) VALUES
(1,  'Tan Wei Ming',       'M', '81234501', 'S8501011A', 'DL-S8501011A', 'Class 3',  '2026-05-01', '2020-03-01', 'CEO Office',    'Active',   1,  'Tan Siew Eng',     '91234501', 'Blk 123 Orchard Road #08-01',       15, 0, 0, 5.0, 'CEO dedicated driver'),
(2,  'Ahmad bin Ismail',   'M', '81234502', 'S8802022B', 'DL-S8802022B', 'Class 3',  '2025-08-15', '2021-06-15', 'Sales',         'Active',   2,  'Fatimah bte Osman','91234502', 'Blk 456 Tampines St 21 #12-05',     12, 1, 0, 4.8, NULL),
(3,  'Raj Kumar',          'M', '81234503', 'S9003033C', 'DL-S9003033C', 'Class 4',  '2026-03-20', '2019-01-10', 'Admin',         'Active',   3,  'Priya Devi',       '91234503', '15 Bukit Timah Road',               10, 2, 0, 4.6, 'Part-time bus driver'),
(4,  'Chen Li Hua',        'F', '81234504', 'S9204044D', 'DL-S9204044D', 'Class 3',  '2025-12-10', '2021-09-01', 'Marketing',     'Active',   4,  'Chen Wei',         '91234504', 'Blk 789 Jurong West St 61 #05-03',  8,  0, 0, 4.9, NULL),
(5,  'Muhammad Rizal',     'M', '81234505', 'S8706055E', 'DL-S8706055E', 'Class 4',  '2026-07-01', '2018-04-15', 'Engineering',   'Active',   5,  'Nur Aisyah',       '91234505', '28 Pasir Ris Drive 4',              13, 1, 1, 4.5, NULL),
(6,  'Lim Kah Seng',       'M', '81234506', 'S8908066F', 'DL-S8908066F', 'Class 3',  '2026-01-20', '2022-02-01', 'Product',       'Active',   6,  'Lim Mei Ling',     '91234506', '5 Tanjong Pagar Road',              11, 0, 0, 4.7, NULL),
(7,  'Siva Rajan',         'M', '81234507', 'S8509077G', 'DL-S8509077G', 'Class 4',  '2025-09-15', '2017-06-01', 'Logistics',     'Active',   7,  'Lakshmi',          '91234507', 'Blk 301 Woodlands Ave 1 #09-11',    15, 3, 1, 4.3, 'Heavy vehicle specialist'),
(8,  'Ong Beng Huat',      'M', '81234508', 'S8710088H', 'DL-S8710088H', 'Class 4',  '2026-02-28', '2018-09-01', 'Logistics',     'Active',   8,  'Ong Siew Lan',     '91234508', 'Blk 520 Ang Mo Kio Ave 10 #03-07',  13, 2, 0, 4.4, NULL),
(9,  'Abdul Rahman',       'M', '81234509', 'S8611099J', 'DL-S8611099J', 'Class 5',  '2025-11-30', '2016-03-15', 'Admin',         'Active',   9,  'Aminah bte Yusof', '91234509', 'Blk 102 Hougang Ave 1 #06-15',      14, 1, 0, 4.6, 'Bus driver'),
(10, 'Goh Chee Keong',     'M', '81234510', 'S8412100K', 'DL-S8412100K', 'Class 5',  '2026-06-15', '2015-08-01', 'Admin',         'Active',   10, 'Goh Mei Fong',     '91234510', 'Blk 205 Toa Payoh Lor 8 #11-02',    16, 0, 0, 4.8, 'Coach driver'),
(11, 'Nurul Huda',         'F', '81234511', 'S9305111L', 'DL-S9305111L', 'Class 3',  '2027-03-01', '2022-07-01', 'HR',            'Active',   11, 'Hakim bin Ali',    '91234511', 'Blk 88 Bedok North Road #07-22',    7,  0, 0, 4.9, NULL),
(12, 'David Tan',          'M', '81234512', 'S9106122M', 'DL-S9106122M', 'Class 3',  '2025-06-20', '2020-11-01', 'Finance',       'Active',   12, 'Sarah Tan',        '91234512', '10 Holland Road',                   9,  1, 0, 4.5, NULL),
(13, 'Kevin Wong',         'M', '81234513', 'S8807133N', 'DL-S8807133N', 'Class 3',  '2026-04-10', '2021-03-01', 'Admin',         'On Leave', 13, 'Jenny Wong',       '91234513', 'Blk 150 Bishan St 11 #04-08',       12, 0, 0, 4.7, 'On annual leave'),
(14, 'Suresh Naidu',       'M', '81234514', 'S8609144P', 'DL-S8609144P', 'Class 4',  '2025-10-05', '2019-05-01', 'Logistics',     'Active',   14, 'Meera',            '91234514', 'Blk 410 Yishun Ring Road #08-03',    14, 4, 2, 4.0, 'Vehicle under repair, on standby'),
(15, 'Jason Lee',          'M', '81234515', 'S9208155Q', 'DL-S9208155Q', 'Class 3',  '2027-01-15', '2023-01-01', 'R&D',           'Active',   15, 'Michelle Lee',     '91234515', '22 Clementi Road',                  8,  0, 0, 5.0, NULL),
(16, 'Priscilla Teo',      'F', '81234516', 'S9409166R', 'DL-S9409166R', 'Class 3',  '2026-09-30', '2023-03-01', 'Operations',    'Active',   16, 'Teo Ah Kow',       '91234516', 'Blk 330 Bukit Batok St 33 #02-11',  6,  0, 0, 4.8, NULL),
(17, 'Alvin Chua',         'M', '81234517', 'S9010177S', 'DL-S9010177S', 'Class 3',  '2026-05-20', '2022-05-01', 'Customer Svc',  'Active',   17, 'Chua Bee Lian',    '91234517', 'Blk 620 Sengkang East Way #10-05',  10, 1, 0, 4.6, NULL),
(18, 'Hafiz bin Osman',    'M', '81234518', 'S8811188T', 'DL-S8811188T', 'Class 4',  '2025-12-25', '2020-08-01', 'Logistics',     'Active',   18, 'Siti Nor',         '91234518', 'Blk 230 Choa Chu Kang Ave 1 #09-04',12, 0, 0, 4.7, 'EV truck driver');
`
	if _, err := db.ExecContext(ctx, driverSQL); err != nil {
		return fmt.Errorf("insert driver data: %w", err)
	}
	fmt.Println("  👤 Inserted 18 drivers")

	// ---- 3. Routes (10) ----
	routeSQL := `
INSERT INTO routes (id, name, route_code, start_point, end_point, distance_km, estimated_duration_min, route_type, status, notes) VALUES
(1,  'HQ-Changi Airport',     'R001', 'Raffles Place, CBD',         'Changi Airport T3',           22.00, 30, 'City',    'Active', 'Airport transfer route'),
(2,  'HQ-Tuas Industrial',    'R002', 'Raffles Place, CBD',         'Tuas Industrial Estate',      35.00, 45, 'City',    'Active', 'Logistics hub route'),
(3,  'HQ-Jurong Office',      'R003', 'Raffles Place, CBD',         'Jurong East, Westgate Tower', 20.00, 35, 'City',    'Active', 'Branch office commute'),
(4,  'HQ-One North Tech Park','R004', 'Raffles Place, CBD',         'One North, Fusionopolis',     12.00, 25, 'City',    'Active', 'Engineering commute'),
(5,  'SG-JB (Malaysia)',      'R005', 'Raffles Place, CBD',         'Johor Bahru, CIQ',            30.00, 90, 'Cross-Border','Active', 'JB branch office'),
(6,  'HQ-Changi Business Park','R006','Raffles Place, CBD',         'Changi Business Park',        18.00, 30, 'City',    'Active', 'Tech campus route'),
(7,  'Warehouse-Client A',    'R007', 'Tuas Warehouse',             'Marina Bay Financial Centre', 38.00, 50, 'City',    'Active', 'Fixed delivery route'),
(8,  'Warehouse-Client B',    'R008', 'Tuas Warehouse',             'Mapletree Business City',     25.00, 35, 'City',    'Active', 'Fixed delivery route'),
(9,  'HQ-Sentosa',            'R009', 'Raffles Place, CBD',         'Sentosa, Resorts World',      10.00, 20, 'City',    'Active', 'Corporate events'),
(10, 'Shuttle-Woodlands',     'R010', 'Woodlands MRT',              'Raffles Place, CBD',          25.00, 45, 'Shuttle', 'Active', 'Staff shuttle route');
`
	if _, err := db.ExecContext(ctx, routeSQL); err != nil {
		return fmt.Errorf("insert route data: %w", err)
	}
	fmt.Println("  🗺️  Inserted 10 routes")

	// ---- 4. Trip Records (30) ----
	now := time.Now()
	tripSQL := fmt.Sprintf(`
INSERT INTO trips (id, trip_no, vehicle_id, driver_id, route_id, start_time, end_time, start_location, end_location, start_mileage, end_mileage, distance_km, fuel_consumed, purpose, status, passenger_count, max_speed, avg_speed, notes) VALUES
(1,  'TR20250201001', 1,  1,  1,  '%s', '%s', 'Raffles Place',   'Changi Airport T3',     42100, 42122, 22.00, 2.80,  'VIP pickup',          'Completed', 2, 80.00, 45.00, NULL),
(2,  'TR20250201002', 3,  3,  3,  '%s', '%s', 'Raffles Place',   'Jurong East',           67300, 67320, 20.00, 2.50,  'Business meeting',    'Completed', 3, 80.00, 38.00, NULL),
(3,  'TR20250202001', 7,  7,  7,  '%s', '%s', 'Tuas Warehouse',  'Marina Bay FC',        124500, 124538, 38.00, 8.50, 'Cargo delivery',      'Completed', 0, 70.00, 38.00, '3-tonne delivery'),
(4,  'TR20250202002', 2,  2,  2,  '%s', '%s', 'Raffles Place',   'Tuas Industrial',       37800, 37835, 35.00, NULL,  'Client pickup',       'Completed', 1, 90.00, 48.00, NULL),
(5,  'TR20250203001', 9,  9,  10, '%s', '%s', 'Woodlands MRT',   'Raffles Place',        179500, 179525, 25.00, 5.50, 'Staff shuttle',       'Completed', 28, 60.00, 35.00, 'Morning shuttle'),
(6,  'TR20250203002', 4,  4,  4,  '%s', '%s', 'Raffles Place',   'One North',             54900, 54912, 12.00, 1.50, 'Client visit',        'Completed', 2, 70.00, 30.00, NULL),
(7,  'TR20250204001', 5,  5,  5,  '%s', '%s', 'Raffles Place',   'Johor Bahru CIQ',       48200, 48230, 30.00, 4.80, 'Business trip',       'Completed', 3, 90.00, 40.00, 'JB branch visit'),
(8,  'TR20250204002', 8,  8,  8,  '%s', '%s', 'Tuas Warehouse',  'Mapletree Biz City',    97600, 97625, 25.00, 5.50, 'Cargo delivery',      'Completed', 0, 65.00, 38.00, NULL),
(9,  'TR20250205001', 6,  6,  6,  '%s', '%s', 'Raffles Place',   'Changi Biz Park',       28500, 28518, 18.00, 2.20, 'Site inspection',     'Completed', 4, 80.00, 42.00, NULL),
(10, 'TR20250205002', 10, 10, 10, '%s', '%s', 'Woodlands MRT',   'Raffles Place',        144600, 144625, 25.00, 6.00, 'Staff shuttle',      'Completed', 42, 55.00, 35.00, 'Morning shuttle'),
(11, 'TR20250206001', 11, 11, 3,  '%s', '%s', 'Raffles Place',   'Jurong East',           21700, 21720, 20.00, NULL,  'Admin errand',        'Completed', 1, 80.00, 38.00, NULL),
(12, 'TR20250206002', 12, 12, 1,  '%s', '%s', 'Raffles Place',   'Changi Airport T3',     61600, 61622, 22.00, 2.80, 'Executive pickup',    'Completed', 1, 75.00, 42.00, NULL),
(13, 'TR20250207001', 15, 15, 4,  '%s', '%s', 'Raffles Place',   'One North',             14700, 14712, 12.00, NULL, 'Tech exchange',       'Completed', 2, 65.00, 30.00, NULL),
(14, 'TR20250207002', 16, 16, 3,  '%s', '%s', 'Raffles Place',   'Jurong East',           19700, 19720, 20.00, NULL,  'Ops coordination',   'Completed', 1, 80.00, 38.00, NULL),
(15, 'TR20250208001', 17, 17, 7,  '%s', '%s', 'Raffles Place',   'Marina Bay FC',         27700, 27738, 38.00, 4.50, 'Client visit',        'Completed', 0, 72.00, 40.00, NULL),
(16, 'TR20250208002', 18, 18, 8,  '%s', '%s', 'Tuas Warehouse',  'Mapletree Biz City',    34700, 34725, 25.00, NULL, 'Delivery',            'Completed', 0, 60.00, 35.00, 'EV truck delivery'),
(17, 'TR20250209001', 1,  1,  1,  '%s', '%s', 'Raffles Place',   'Changi Airport T3',     42400, 42422, 22.00, 2.70, 'VIP pickup',          'Completed', 1, 85.00, 45.00, NULL),
(18, 'TR20250209002', 7,  7,  7,  '%s', '%s', 'Tuas Warehouse',  'Marina Bay FC',        124800, 124838, 38.00, 8.20, 'Cargo delivery',     'Completed', 0, 68.00, 38.00, NULL),
(19, 'TR20250210001', 3,  3,  5,  '%s', '%s', 'Raffles Place',   'Johor Bahru CIQ',       67600, 67630, 30.00, 3.80, 'Business trip',       'Completed', 2, 90.00, 40.00, NULL),
(20, 'TR20250210002', 9,  9,  10, '%s', '%s', 'Woodlands MRT',   'Raffles Place',        179800, 179825, 25.00, 5.30, 'Staff shuttle',      'Completed', 30, 58.00, 35.00, 'Morning shuttle'),
(21, 'TR20250211001', 2,  2,  1,  '%s', '%s', 'Raffles Place',   'Changi Airport T3',     38200, 38222, 22.00, NULL,  'Client pickup',      'Completed', 1, 82.00, 42.00, NULL),
(22, 'TR20250211002', 5,  5,  6,  '%s', '%s', 'Raffles Place',   'Changi Biz Park',       48600, 48618, 18.00, 2.80, 'Project support',     'Completed', 3, 80.00, 40.00, NULL),
(23, 'TR20250212001', 4,  4,  3,  '%s', '%s', 'Raffles Place',   'Jurong East',           55200, 55220, 20.00, 2.40, 'Market research',     'Completed', 2, 80.00, 38.00, NULL),
(24, 'TR20250212002', 6,  6,  4,  '%s', '%s', 'Raffles Place',   'One North',             28900, 28912, 12.00, 1.50, 'Partnership meeting', 'Completed', 1, 70.00, 30.00, NULL),
(25, 'TR20250213001', 8,  8,  7,  '%s', '%s', 'Tuas Warehouse',  'Marina Bay FC',         97900, 97938, 38.00, 8.80, 'Cargo delivery',     'Completed', 0, 66.00, 38.00, NULL),
(26, 'TR20250213002', 10, 10, 10, '%s', '%s', 'Woodlands MRT',   'Raffles Place',        144900, 144925, 25.00, 5.80, 'Staff shuttle',     'Completed', 45, 55.00, 35.00, 'Evening shuttle'),
(27, 'TR20250214001', 11, 11, 1,  '%s', '%s', 'Raffles Place',   'Changi Airport T3',     22000, 22022, 22.00, NULL, 'Colleague pickup',    'Completed', 1, 78.00, 42.00, NULL),
(28, 'TR20250214002', 15, 15, 6,  '%s', '%s', 'Raffles Place',   'Changi Biz Park',       15000, 15018, 18.00, NULL, 'Tech support',        'Completed', 2, 80.00, 42.00, NULL),
(29, 'TR20250215001', 1,  1,  1,  '%s', NULL, 'Raffles Place',   NULL,                    42580, NULL,  NULL,   NULL,  'VIP pickup',         'In Progress', 1, NULL,   NULL,  'Heading to airport'),
(30, 'TR20250215002', 7,  7,  7,  '%s', NULL, 'Tuas Warehouse',  NULL,                   125100, NULL,  NULL,   NULL,  'Cargo delivery',     'In Progress', 0, NULL,   NULL,  'En route');
`,
		// 30 trips with staggered dates
		ts(now, -14, 8, 0), ts(now, -14, 8, 45),
		ts(now, -14, 9, 30), ts(now, -14, 10, 20),
		ts(now, -13, 7, 0), ts(now, -13, 7, 55),
		ts(now, -13, 14, 0), ts(now, -13, 15, 20),
		ts(now, -12, 6, 30), ts(now, -12, 7, 10),
		ts(now, -12, 10, 0), ts(now, -12, 10, 35),
		ts(now, -11, 8, 0), ts(now, -11, 10, 0),
		ts(now, -11, 13, 0), ts(now, -11, 14, 0),
		ts(now, -10, 9, 0), ts(now, -10, 10, 40),
		ts(now, -10, 6, 30), ts(now, -10, 7, 10),
		ts(now, -9, 10, 0), ts(now, -9, 10, 50),
		ts(now, -9, 14, 0), ts(now, -9, 14, 46),
		ts(now, -8, 9, 30), ts(now, -8, 10, 5),
		ts(now, -8, 13, 0), ts(now, -8, 13, 40),
		ts(now, -7, 8, 0), ts(now, -7, 8, 55),
		ts(now, -7, 14, 0), ts(now, -7, 15, 0),
		ts(now, -6, 8, 30), ts(now, -6, 9, 22),
		ts(now, -6, 9, 0), ts(now, -6, 9, 55),
		ts(now, -5, 7, 0), ts(now, -5, 9, 0),
		ts(now, -5, 6, 30), ts(now, -5, 7, 10),
		ts(now, -4, 14, 0), ts(now, -4, 14, 46),
		ts(now, -4, 9, 0), ts(now, -4, 10, 40),
		ts(now, -3, 10, 0), ts(now, -3, 10, 50),
		ts(now, -3, 14, 0), ts(now, -3, 14, 28),
		ts(now, -2, 7, 0), ts(now, -2, 7, 55),
		ts(now, -2, 17, 0), ts(now, -2, 17, 40),
		ts(now, -1, 10, 0), ts(now, -1, 10, 46),
		ts(now, -1, 8, 0), ts(now, -1, 9, 40),
		ts(now, 0, 8, 0),
		ts(now, 0, 7, 30),
	)
	if _, err := db.ExecContext(ctx, tripSQL); err != nil {
		return fmt.Errorf("插入行程数据: %w", err)
	}
	fmt.Println("  🚀 已插入 30 条行程记录")

	// ---- 5. Maintenance Records (15) ----
	maintenanceSQL := `
INSERT INTO maintenance_records (id, record_no, vehicle_id, maintenance_type, description, service_provider, mileage_at_service, cost, parts_cost, labor_cost, start_date, end_date, next_maintenance_date, next_maintenance_mileage, status, quality_rating, notes) VALUES
(1,  'MR20250101001', 3,  'Service',      'Regular service: oil, oil filter, air filter change',     'Borneo Motors (Toyota)',        65000, 580.00, 380.00, 200.00,   '2025-01-10', '2025-01-10', '2025-07-10', 75000, 'Completed', 5, NULL),
(2,  'MR20250101002', 4,  'Service',      '2nd service: oil, filter, brake check',                   'Kah Motor (Honda)',             50000, 480.00, 300.00, 180.00,   '2025-01-15', '2025-01-15', '2025-07-15', 60000, 'Completed', 4, NULL),
(3,  'MR20250102001', 7,  'Repair',       'Replace front brake pads and discs',                      'Cycle & Carriage Heavy Vehicles',120000, 1500.00, 1000.00, 500.00,'2025-01-20', '2025-01-21', NULL, NULL, 'Completed', 4, NULL),
(4,  'MR20250102002', 12, 'Service',      'Regular service: oil and filter change',                   'Cycle & Carriage (Mercedes)',   58000, 1200.00, 900.00, 300.00,  '2025-01-25', '2025-01-25', '2025-07-25', 68000, 'Completed', 5, 'OEM parts'),
(5,  'MR20250103001', 9,  'Service',      'Major service: oil, 3 filters, brake fluid, ATF',          'Yutong SG Service Centre',     175000, 2800.00, 2000.00, 800.00, '2025-01-28', '2025-01-29', '2025-04-28', 185000, 'Completed', 4, 'Shuttle bus service'),
(6,  'MR20250103002', 5,  'Tyre Change',  'Replace 4 tyres (Michelin Primacy 4)',                     'Stamford Tyres Jurong',        45000, 1600.00, 1400.00, 200.00, '2025-02-01', '2025-02-01', NULL, NULL, 'Completed', 5, NULL),
(7,  'MR20250104001', 14, 'Repair',       'Engine warning light, replace injector assembly',           'Isuzu Service Centre Tuas',    85000, 5000.00, 4000.00, 1000.00,'2025-02-05', NULL, NULL, NULL, 'In Progress', NULL, 'Awaiting parts delivery'),
(8,  'MR20250104002', 1,  'Service',      'EV routine check: battery health, braking system',          'C&C Star (Mercedes)',          40000, 350.00, 100.00, 250.00,  '2025-02-08', '2025-02-08', '2025-08-08', 50000, 'Completed', 5, NULL),
(9,  'MR20250105001', 8,  'Repair',       'Replace clutch plate',                                      'Isuzu Service Centre Tuas',    95000, 2200.00, 1500.00, 700.00, '2025-02-10', '2025-02-11', NULL, NULL, 'Completed', 4, NULL),
(10, 'MR20250105002', 2,  'Service',      'EV service: battery check, cabin filter replacement',        'Tesla Service Centre SG',      36000, 480.00, 150.00, 330.00,  '2025-02-12', '2025-02-12', '2025-08-12', 46000, 'Completed', 5, NULL),
(11, 'MR20250106001', 10, 'Service',      'Chassis inspection, replace air suspension components',      'Zhongtong SG Service',         142000, 3500.00, 2500.00, 1000.00,'2025-02-15', '2025-02-16', '2025-05-15', 152000, 'Completed', 3, 'Suspension ageing'),
(12, 'MR20250106002', 6,  'Service',      'Engine service: spark plugs, oil change',                    'Performance Motors (BMW)',      26000, 750.00, 450.00, 300.00,  '2025-02-18', '2025-02-18', '2025-08-18', 36000, 'Completed', 5, NULL),
(13, 'MR20250107001', 19, 'Service',      'Regular service: oil and filter change',                     'Tan Chong Motor (Nissan)',     48000, 380.00, 250.00, 130.00,  '2025-02-20', '2025-02-20', '2025-08-20', 58000, 'Completed', 4, NULL),
(14, 'MR20250107002', 15, 'Service',      'EV annual check: battery diagnostics, software update',      'Performance Motors (BMW)',     13000, 250.00, 0, 250.00,        '2025-02-22', '2025-02-22', '2026-02-22', 23000, 'Completed', 5, 'Free 1st service'),
(15, 'MR20250108001', 17, 'Accident Repair','Right front fender scratch repair and repaint',             'Borneo Motors Body Shop',     26500, 1200.00, 500.00, 700.00,  '2025-02-25', '2025-02-27', NULL, NULL, 'Completed', 4, 'Minor scratch');
`
	if _, err := db.ExecContext(ctx, maintenanceSQL); err != nil {
		return fmt.Errorf("insert maintenance data: %w", err)
	}
	fmt.Println("  🔧 Inserted 15 maintenance records")

	// ---- 6. Fuel Records (25) ----
	fuelSQL := fmt.Sprintf(`
INSERT INTO fuel_records (vehicle_id, driver_id, fuel_date, fuel_type, quantity, unit_price, total_cost, mileage_at_fuel, gas_station, payment_method, is_full_tank, notes) VALUES
(3,  3,  '%s', 'RON 95',  50.00, 2.72, 136.00,  66000, 'Shell Raffles Place',      'Corp Card', 1, NULL),
(4,  4,  '%s', 'RON 95',  40.00, 2.72, 108.80,  53000, 'SPC Jurong East',          'Corp Card', 1, NULL),
(5,  5,  '%s', 'Diesel',  65.00, 2.55, 165.75,  47000, 'Caltex Tuas',              'Fuel Card', 1, NULL),
(7,  7,  '%s', 'Diesel',  85.00, 2.55, 216.75, 122000, 'Shell Tuas Industrial',    'Fuel Card', 1, 'Full tank'),
(8,  8,  '%s', 'Diesel',  70.00, 2.55, 178.50,  96000, 'Esso Woodlands',           'Fuel Card', 1, NULL),
(9,  9,  '%s', 'Diesel', 160.00, 2.55, 408.00, 178000, 'SPC Woodlands',            'Fuel Card', 1, 'Bus refuel'),
(10, 10, '%s', 'Diesel', 250.00, 2.55, 637.50, 143000, 'Shell Toa Payoh',          'Fuel Card', 1, 'Coach refuel'),
(12, 12, '%s', 'RON 98',  55.00, 3.17, 174.35,  60000, 'Shell Holland Road',       'Corp Card', 1, NULL),
(3,  3,  '%s', 'RON 95',  48.00, 2.75, 132.00,  67200, 'Shell Raffles Place',      'Corp Card', 1, NULL),
(4,  4,  '%s', 'RON 95',  38.00, 2.75, 104.50,  54200, 'SPC Jurong East',          'Corp Card', 1, NULL),
(7,  7,  '%s', 'Diesel',  80.00, 2.58, 206.40, 123500, 'Shell Tuas Industrial',    'Fuel Card', 1, NULL),
(5,  5,  '%s', 'Diesel',  62.00, 2.58, 159.96,  48200, 'Caltex Tuas',              'Fuel Card', 1, NULL),
(6,  6,  '%s', 'RON 98',  68.00, 3.17, 215.56,  27500, 'Esso Tanjong Pagar',       'Corp Card', 1, NULL),
(8,  8,  '%s', 'Diesel',  72.00, 2.58, 185.76,  97600, 'Esso Woodlands',           'Fuel Card', 1, NULL),
(17, 17, '%s', 'RON 95',  35.00, 2.72, 95.20,   27200, 'SPC Sengkang',             'Corp Card', 1, NULL),
(19, 19, '%s', 'RON 95',  42.00, 2.72, 114.24,  50000, 'Caltex Bedok',             'Corp Card', 1, NULL),
(9,  9,  '%s', 'Diesel', 155.00, 2.55, 395.25, 179500, 'SPC Woodlands',            'Fuel Card', 1, NULL),
(3,  3,  '%s', 'RON 95',  50.00, 2.78, 139.00,  67800, 'Shell Raffles Place',      'Corp Card', 1, NULL),
(10, 10, '%s', 'Diesel', 240.00, 2.58, 619.20, 144600, 'Shell Toa Payoh',          'Fuel Card', 1, NULL),
(12, 12, '%s', 'RON 98',  52.00, 3.20, 166.40,  61600, 'Shell Holland Road',       'Corp Card', 1, NULL),
(7,  7,  '%s', 'Diesel',  82.00, 2.60, 213.20, 124800, 'Shell Tuas Industrial',    'Fuel Card', 1, NULL),
(4,  4,  '%s', 'RON 95',  40.00, 2.78, 111.20,  55200, 'SPC Jurong East',          'Corp Card', 1, NULL),
(5,  5,  '%s', 'Diesel',  65.00, 2.60, 169.00,  48600, 'Caltex Tuas',              'Fuel Card', 1, NULL),
(17, 17, '%s', 'RON 95',  36.00, 2.75, 99.00,   27700, 'SPC Sengkang',             'Corp Card', 1, NULL),
(6,  6,  '%s', 'RON 98',  65.00, 3.20, 208.00,  28900, 'Esso Tanjong Pagar',       'Corp Card', 1, NULL);
`,
		ts(now, -30, 8, 0), ts(now, -28, 9, 0), ts(now, -26, 15, 0), ts(now, -25, 7, 0),
		ts(now, -24, 16, 0), ts(now, -23, 6, 30), ts(now, -22, 6, 30), ts(now, -21, 14, 0),
		ts(now, -19, 8, 30), ts(now, -18, 10, 0), ts(now, -17, 7, 30), ts(now, -16, 15, 30),
		ts(now, -15, 14, 0), ts(now, -14, 16, 30), ts(now, -13, 9, 0), ts(now, -12, 10, 0),
		ts(now, -10, 6, 30), ts(now, -8, 8, 0), ts(now, -7, 6, 30), ts(now, -6, 14, 0),
		ts(now, -5, 7, 0), ts(now, -4, 10, 0), ts(now, -3, 15, 0), ts(now, -2, 9, 0),
		ts(now, -1, 14, 0),
	)
	if _, err := db.ExecContext(ctx, fuelSQL); err != nil {
		return fmt.Errorf("插入加油数据: %w", err)
	}
	fmt.Println("  ⛽ 已插入 25 条加油记录")

	// ---- 6b. EV Charging Records (10) ----
	evChargeSQL := fmt.Sprintf(`
INSERT INTO fuel_records (vehicle_id, driver_id, fuel_date, fuel_type, quantity, unit_price, total_cost, mileage_at_fuel, gas_station, payment_method, is_full_tank, notes) VALUES
(1,  1,  '%s', 'Charging', 65.00,  0.55, 35.75,  41800, 'SP Group Charger Raffles',    'Corp Card', 1, 'Mercedes S450L PHEV charge'),
(2,  2,  '%s', 'Charging', 58.00,  0.55, 31.90,  42300, 'Tesla Supercharger Orchard',   'Corp Card', 1, NULL),
(2,  2,  '%s', 'Charging', 70.00,  0.68, 47.60,  37500, 'Tesla Supercharger CBD',       'Corp Card', 1, 'Model Y supercharge'),
(11, 11, '%s', 'Charging', 62.00,  0.55, 34.10,  38000, 'BlueSG Charger Bedok',         'Corp Card', 1, NULL),
(15, 15, '%s', 'Charging', 75.00,  0.55, 41.25,  14200, 'Shell Recharge One North',     'Corp Card', 1, 'BMW iX3 fast charge'),
(15, 15, '%s', 'Charging', 72.00,  0.55, 39.60,  14800, 'SP Group Charger Clementi',    'Corp Card', 1, NULL),
(16, 16, '%s', 'Charging', 50.00,  0.42, 21.00,  19200, 'BlueSG Charger Bukit Batok',   'Corp Card', 1, 'Atto 3 slow charge'),
(18, 18, '%s', 'Charging', 80.00,  0.42, 33.60,  34200, 'Tuas Warehouse Charger',       'Corp Card', 1, 'EV truck overnight charge'),
(20, NULL, '%s', 'Charging', 86.00, 0.55, 47.30,   7500, 'Tesla Supercharger Marina',    'Corp Card', 1, 'Model 3 charge (pre-decommission)'),
(11, 11, '%s', 'Charging', 18.00,  0.42, 7.56,   21500, 'SP Group Charger Ang Mo Kio',  'Corp Card', 0, 'Ioniq 5 top-up');
`,
		ts(now, -20, 22, 0), ts(now, -8, 21, 30),
		ts(now, -18, 20, 0), ts(now, -6, 19, 30),
		ts(now, -15, 21, 0), ts(now, -5, 20, 0),
		ts(now, -12, 22, 30),
		ts(now, -10, 23, 0),
		ts(now, -7, 21, 0),
		ts(now, -3, 20, 30),
	)
	if _, err := db.ExecContext(ctx, evChargeSQL); err != nil {
		return fmt.Errorf("插入电动车充电数据: %w", err)
	}
	fmt.Println("  🔋 已插入 10 条电动车充电记录")

	// ---- 7. Violation Records (12) ----
	violationSQL := fmt.Sprintf(`
INSERT INTO violations (vehicle_id, driver_id, violation_date, violation_location, violation_type, violation_code, fine_amount, deduction_points, status, handler, handled_date, notes) VALUES
(3,  3,  '%s', 'ECP towards Changi',              'Speeding (1-20km/h over)',      'SP01', 150.00,  4, 'Processed', 'Raj Kumar',    '%s', NULL),
(5,  5,  '%s', 'AYE towards Tuas',                'Illegal lane change',           'LC01', 150.00,  4, 'Processed', 'Muhammad Rizal','%s', 'Crossed double white line'),
(7,  7,  '%s', 'Tuas Ave 1',                      'Speeding (21-40km/h over)',     'SP02', 300.00,  8, 'Processed', 'Siva Rajan',   '%s', 'Heavy vehicle 60km/h zone'),
(8,  8,  '%s', 'Woodlands Ave 3',                 'Red light running',             'RL01', 400.00, 12, 'Pending',   NULL,           NULL, 'Awaiting processing'),
(12, 12, '%s', 'Holland Road',                     'Illegal parking',              'PK01', 120.00,  0, 'Processed', 'David Tan',    '%s', NULL),
(3,  3,  '%s', 'CTE towards SLE',                 'Speeding (1-20km/h over)',      'SP01', 130.00,  4, 'Processed', 'Raj Kumar',    '%s', NULL),
(17, 17, '%s', 'Sengkang East Way',               'Failing to signal',             'SG01', 100.00,  4, 'Pending',   NULL,           NULL, NULL),
(7,  7,  '%s', 'PIE towards Changi',              'Speeding (1-20km/h over)',      'SP01', 150.00,  4, 'Processed', 'Siva Rajan',   '%s', NULL),
(14, 14, '%s', 'Yishun Ave 2',                    'Failing to give way',           'GW01', 150.00,  6, 'Processed', 'Suresh Naidu', '%s', NULL),
(14, 14, '%s', 'SLE towards Woodlands',           'Speeding (21-40km/h over)',     'SP02', 300.00,  8, 'Appealing', NULL,           NULL, 'Speed limit sign unclear'),
(5,  5,  '%s', 'Tuas Industrial Ave 4',           'Illegal U-turn',               'UT01', 130.00,  4, 'Pending',   NULL,           NULL, NULL),
(7,  7,  '%s', 'Second Link towards JB',          'Speeding (1-20km/h over)',      'SP01', 150.00,  4, 'Processed', 'Siva Rajan',   '%s', NULL);
`,
		ts(now, -60, 14, 30), ds(now, -55),
		ts(now, -52, 10, 15), ds(now, -48),
		ts(now, -45, 8, 20), ds(now, -40),
		ts(now, -38, 16, 45),
		ts(now, -35, 11, 30), ds(now, -30),
		ts(now, -28, 9, 10), ds(now, -25),
		ts(now, -22, 17, 20),
		ts(now, -18, 7, 45), ds(now, -15),
		ts(now, -14, 13, 50), ds(now, -10),
		ts(now, -10, 9, 30),
		ts(now, -7, 16, 0),
		ts(now, -3, 8, 30), ds(now, -1),
	)
	if _, err := db.ExecContext(ctx, violationSQL); err != nil {
		return fmt.Errorf("插入违章数据: %w", err)
	}
	fmt.Println("  🚨 已插入 12 条违章记录")

	// ---- 8. Insurance Records (20) ----
	insuranceSQL := `
INSERT INTO insurance_policies (vehicle_id, policy_no, insurance_company, insurance_type, premium, coverage_amount, start_date, end_date, status, claim_count, total_claim_amount, agent_name, agent_phone, notes) VALUES
(1,  'POL-2024-0001', 'NTUC Income',    'Third Party',     1200.00,   500000.00,  '2024-03-15', '2025-03-15', 'Expiring', 0, 0, 'James Lim',  '96001001', NULL),
(1,  'POL-2024-0002', 'NTUC Income',    'Comprehensive',   4800.00,  1000000.00,  '2024-03-15', '2025-03-15', 'Expiring', 0, 0, 'James Lim',  '96001001', 'Own damage + TP + NCD protector'),
(2,  'POL-2024-0003', 'AXA Insurance',  'Third Party',     1100.00,   500000.00,  '2024-05-20', '2025-05-20', 'Active',   0, 0, 'Sarah Chen', '96001002', NULL),
(2,  'POL-2024-0004', 'AXA Insurance',  'Comprehensive',   3800.00,  1000000.00,  '2024-05-20', '2025-05-20', 'Active',   0, 0, 'Sarah Chen', '96001002', NULL),
(3,  'POL-2024-0005', 'Great Eastern',  'Third Party',     1000.00,   500000.00,  '2024-08-10', '2025-08-10', 'Active',   0, 0, 'David Ong',  '96001003', NULL),
(3,  'POL-2024-0006', 'Great Eastern',  'Comprehensive',   3200.00,   800000.00,  '2024-08-10', '2025-08-10', 'Active',   1, 1500.00, 'David Ong','96001003', 'Minor scratch claim'),
(4,  'POL-2024-0007', 'AIG Singapore',  'Third Party',      950.00,   500000.00,  '2024-06-15', '2025-06-15', 'Active',   0, 0, 'Rachel Ng',  '96001004', NULL),
(4,  'POL-2024-0008', 'AIG Singapore',  'Own Damage',      2500.00,   135000.00,  '2024-06-15', '2025-06-15', 'Active',   0, 0, 'Rachel Ng',  '96001004', NULL),
(5,  'POL-2024-0009', 'AXA Insurance',  'Third Party',     1300.00,   500000.00,  '2024-11-01', '2025-11-01', 'Active',   0, 0, 'Sarah Chen', '96001002', NULL),
(5,  'POL-2024-0010', 'AXA Insurance',  'Comprehensive',   3800.00,  1000000.00,  '2024-11-01', '2025-11-01', 'Active',   0, 0, 'Sarah Chen', '96001002', NULL),
(7,  'POL-2024-0011', 'NTUC Income',    'Third Party',     1800.00,   500000.00,  '2024-09-20', '2025-09-20', 'Active',   0, 0, 'James Lim',  '96001001', 'Heavy vehicle TP'),
(7,  'POL-2024-0012', 'NTUC Income',    'Comprehensive',   5500.00,  1000000.00,  '2024-09-20', '2025-09-20', 'Active',   0, 0, 'James Lim',  '96001001', NULL),
(9,  'POL-2024-0013', 'Great Eastern',  'Third Party',     2200.00,   500000.00,  '2024-05-10', '2025-05-10', 'Active',   0, 0, 'Alex Tan',   '96001005', 'Bus TP insurance'),
(9,  'POL-2024-0014', 'Great Eastern',  'Comprehensive',   8000.00,  2000000.00,  '2024-05-10', '2025-05-10', 'Active',   0, 0, 'Alex Tan',   '96001005', 'Bus comprehensive'),
(12, 'POL-2024-0015', 'NTUC Income',    'Third Party',     1200.00,   500000.00,  '2024-04-20', '2025-04-20', 'Active',   0, 0, 'James Lim',  '96001001', NULL),
(12, 'POL-2024-0016', 'NTUC Income',    'Comprehensive',   6500.00,  2000000.00,  '2024-04-20', '2025-04-20', 'Active',   0, 0, 'James Lim',  '96001001', 'Mercedes comprehensive'),
(15, 'POL-2024-0017', 'AXA Insurance',  'Third Party',     1100.00,   500000.00,  '2024-11-15', '2025-11-15', 'Active',   0, 0, 'Sarah Chen', '96001002', NULL),
(15, 'POL-2024-0018', 'AXA Insurance',  'Comprehensive',   5200.00,  1500000.00,  '2024-11-15', '2025-11-15', 'Active',   0, 0, 'Sarah Chen', '96001002', NULL),
(20, 'POL-2025-0019', 'Great Eastern',  'Third Party',     1100.00,   500000.00,  '2025-01-05', '2026-01-05', 'Active',   0, 0, 'David Ong',  '96001003', NULL),
(20, 'POL-2025-0020', 'Great Eastern',  'Comprehensive',   4200.00,  1000000.00,  '2025-01-05', '2026-01-05', 'Active',   0, 0, 'David Ong',  '96001003', 'New car comprehensive');
`
	if _, err := db.ExecContext(ctx, insuranceSQL); err != nil {
		return fmt.Errorf("insert insurance data: %w", err)
	}
	fmt.Println("  🛡️  Inserted 20 insurance records")

	// ---- 8b. Reservations (20) ----
	reservationSQL := fmt.Sprintf(`
INSERT INTO reservations (id, reservation_no, applicant_name, applicant_department, applicant_phone, vehicle_id, driver_id, purpose, passengers, start_time, end_time, start_location, end_location, route_id, status, priority, approver, approved_at, reject_reason, actual_start_time, actual_end_time, actual_mileage, notes) VALUES
(1,  'RES20250201001', 'Mr Tan',       'CEO Office',    '91000001', 1,  1,  'Client pickup',       2, '%s', '%s', 'Raffles Place',    'Changi Airport T3',     1,  'Completed',   'Normal', 'PA Lee',       '%s', NULL, '%s', '%s', 22.0, NULL),
(2,  'RES20250201002', 'Ahmad Mgr',    'Sales',         '91000002', 2,  2,  'Client visit',        3, '%s', '%s', 'Raffles Place',    'One North',             4,  'Completed',   'Normal', 'Sales Dir',    '%s', NULL, '%s', '%s', 12.0, NULL),
(3,  'RES20250202001', 'Raj Eng',      'Engineering',   '91000003', 5,  5,  'Tech exchange',       2, '%s', '%s', 'Raffles Place',    'Jurong East',           3,  'Completed',   'Normal', 'CTO',          '%s', NULL, '%s', '%s', 20.0, 'Carrying equipment'),
(4,  'RES20250203001', 'Lim Dir',      'Product',       '91000004', 6,  6,  'Site inspection',     4, '%s', '%s', 'Raffles Place',    'Changi Biz Park',       6,  'Completed',   'Urgent', 'VP Ops',       '%s', NULL, '%s', '%s', 18.0, 'New project site visit'),
(5,  'RES20250204001', 'Priya Asst',   'Admin',         '91000005', 3,  3,  'Meeting reception',   5, '%s', '%s', 'Changi Airport T3','Raffles Place',          1,  'Completed',   'Normal', 'Admin Mgr',    '%s', NULL, '%s', '%s', 22.0, 'Picking up overseas guests'),
(6,  'RES20250205001', 'Siva Lead',    'Logistics',     '91000006', 7,  7,  'Cargo delivery',      1, '%s', '%s', 'Tuas Warehouse',   'Marina Bay FC',         7,  'Completed',   'Normal', 'Logistics Mgr','%s', NULL, '%s', '%s', 38.0, 'Bulky cargo'),
(7,  'RES20250206001', 'Nurul Mgr',    'HR',            '91000007', 11, 11, 'Training outing',     3, '%s', '%s', 'Raffles Place',    'Jurong East',           3,  'Completed',   'Normal', 'Admin Mgr',    '%s', NULL, '%s', '%s', 20.0, 'New hire orientation'),
(8,  'RES20250207001', 'Jason Eng',    'R&D',           '91000008', 15, 15, 'Vendor visit',        2, '%s', '%s', 'Raffles Place',    'One North',             4,  'Completed',   'Normal', 'CTO',          '%s', NULL, '%s', '%s', 12.0, NULL),
(9,  'RES20250208001', 'Priscilla Mgr','Operations',    '91000009', 16, 16, 'Market research',     2, '%s', '%s', 'Raffles Place',    'Jurong East',           3,  'Completed',   'Normal', 'Sales Dir',    '%s', NULL, '%s', '%s', 20.0, NULL),
(10, 'RES20250209001', 'David Mgr',    'Finance',       '91000010', 12, 12, 'Bank errand',         1, '%s', '%s', 'Raffles Place',    'Shenton Way',           NULL, 'Completed',  'Normal', 'Admin Mgr',    '%s', NULL, '%s', '%s', 5.0, 'Annual audit submission'),
(11, 'RES20250210001', 'Mr Tan',       'CEO Office',    '91000001', 1,  1,  'Business dinner',     3, '%s', '%s', 'Raffles Place',    'Marina Bay Sands',      NULL, 'Approved',   'Urgent', 'PA Lee',       '%s', NULL, NULL, NULL, NULL, 'Important client dinner'),
(12, 'RES20250210002', 'Ahmad Mgr',    'Sales',         '91000002', 2,  2,  'Trade show',          4, '%s', '%s', 'Raffles Place',    'Suntec Convention',     NULL, 'Approved',   'Normal', 'Sales Dir',    '%s', NULL, NULL, NULL, NULL, 'Industry exhibition'),
(13, 'RES20250211001', 'Raj Eng',      'Engineering',   '91000003', 5,  5,  'Equipment purchase',  2, '%s', '%s', 'Raffles Place',    'Sim Lim Square',        NULL, 'Approved',   'Normal', 'CTO',          '%s', NULL, NULL, NULL, NULL, 'Server equipment procurement'),
(14, 'RES20250211002', 'Priya Asst',   'Admin',         '91000005', 3,  3,  'Govt errand',         1, '%s', '%s', 'Raffles Place',    'ACRA @ Revenue House',  NULL, 'Pending',    'Normal', NULL,           NULL, NULL, NULL, NULL, NULL, 'Company registration update'),
(15, 'RES20250212001', 'Siva Lead',    'Logistics',     '91000006', 7,  7,  'Urgent delivery',     1, '%s', '%s', 'Tuas Warehouse',   'Mapletree Biz City',    8,  'Pending',     'Critical',NULL,           NULL, NULL, NULL, NULL, NULL, 'Urgent client order'),
(16, 'RES20250212002', 'Hafiz',        'Logistics',     '91000018', 18, 18, 'Stock transfer',      1, '%s', '%s', 'Tuas Warehouse',   'Jurong Warehouse',      NULL, 'Pending',    'Normal', NULL,           NULL, NULL, NULL, NULL, NULL, 'Inventory transfer'),
(17, 'RES20250213001', 'Kevin Mgr',    'Admin',         '91000013', 9,  9,  'Team building',       30, '%s', '%s', 'Raffles Place',   'Sentosa',               9,  'Pending',     'Normal', NULL,           NULL, NULL, NULL, NULL, NULL, 'Quarterly team building, need coach'),
(18, 'RES20250213002', 'Lim Dir',      'Product',       '91000004', NULL, NULL, 'JB trip',         3, '%s', '%s', 'Raffles Place',    'Johor Bahru CIQ',       5,  'Rejected',    'Normal', 'VP Ops',       '%s', 'No vehicle available, suggest train', NULL, NULL, NULL, NULL),
(19, 'RES20250214001', 'Alvin Lead',   'Customer Svc',  '91000017', NULL, NULL, 'Client visit',    2, '%s', '%s', 'Raffles Place',    'Marina Bay FC',         NULL, 'Cancelled',  'Normal', NULL,           NULL, NULL, NULL, NULL, NULL, 'Client cancelled meeting'),
(20, 'RES20250215001', 'Jason Eng',    'R&D',           '91000008', 15, 15, 'DC inspection',       2, '%s', '%s', 'Raffles Place',    'Changi Biz Park DC',    6,  'In Progress', 'Urgent', 'CTO',          '%s', NULL, '%s', NULL, NULL, 'Server fault urgent check');
`,
		// Record 1: 已完成
		ts(now, -14, 8, 0), ts(now, -14, 10, 0), ds(now, -15), ts(now, -14, 8, 5), ts(now, -14, 9, 0),
		// Record 2: 已完成
		ts(now, -14, 14, 0), ts(now, -14, 16, 0), ds(now, -15), ts(now, -14, 14, 10), ts(now, -14, 15, 30),
		// Record 3: 已完成
		ts(now, -13, 9, 0), ts(now, -13, 12, 0), ds(now, -14), ts(now, -13, 9, 5), ts(now, -13, 11, 30),
		// Record 4: 已完成
		ts(now, -12, 7, 0), ts(now, -12, 18, 0), ds(now, -13), ts(now, -12, 7, 10), ts(now, -12, 17, 30),
		// Record 5: 已完成
		ts(now, -11, 9, 0), ts(now, -11, 10, 30), ds(now, -12), ts(now, -11, 9, 15), ts(now, -11, 10, 15),
		// Record 6: 已完成
		ts(now, -10, 8, 0), ts(now, -10, 12, 0), ds(now, -11), ts(now, -10, 8, 10), ts(now, -10, 11, 30),
		// Record 7: 已完成
		ts(now, -9, 9, 0), ts(now, -9, 17, 0), ds(now, -10), ts(now, -9, 9, 10), ts(now, -9, 16, 30),
		// Record 8: 已完成
		ts(now, -8, 10, 0), ts(now, -8, 12, 0), ds(now, -9), ts(now, -8, 10, 5), ts(now, -8, 11, 40),
		// Record 9: 已完成
		ts(now, -7, 13, 0), ts(now, -7, 17, 0), ds(now, -8), ts(now, -7, 13, 10), ts(now, -7, 16, 40),
		// Record 10: 已完成
		ts(now, -6, 9, 0), ts(now, -6, 11, 0), ds(now, -7), ts(now, -6, 9, 10), ts(now, -6, 10, 45),
		// Record 11: 已批准
		ts(now, -5, 18, 0), ts(now, -5, 22, 0), ds(now, -6),
		// Record 12: 已批准
		ts(now, -5, 9, 0), ts(now, -5, 17, 0), ds(now, -6),
		// Record 13: 已批准
		ts(now, -4, 10, 0), ts(now, -4, 15, 0), ds(now, -5),
		// Record 14: 待审批
		ts(now, -3, 9, 0), ts(now, -3, 12, 0),
		// Record 15: 待审批
		ts(now, -3, 14, 0), ts(now, -3, 18, 0),
		// Record 16: 待审批
		ts(now, -2, 8, 0), ts(now, -2, 16, 0),
		// Record 17: 待审批
		ts(now, -1, 8, 0), ts(now, -1, 18, 0),
		// Record 18: 已拒绝
		ts(now, -2, 7, 0), ts(now, -2, 20, 0), ds(now, -3),
		// Record 19: 已取消
		ts(now, -1, 14, 0), ts(now, -1, 16, 0),
		// Record 20: 进行中
		ts(now, 0, 8, 0), ts(now, 0, 18, 0), ds(now, -1), ts(now, 0, 8, 10),
	)
	if _, err := db.ExecContext(ctx, reservationSQL); err != nil {
		return fmt.Errorf("插入预定数据: %w", err)
	}
	fmt.Println("  📋 已插入 20 条用车预定记录")

	// ---- 9. GPS 定位 (50条) ----
	gpsSQL := fmt.Sprintf(`
INSERT INTO gps_tracking (vehicle_id, latitude, longitude, speed, heading, altitude, location_name, status, recorded_at) VALUES
(1,  1.2840000, 103.8510000, 45.00, 90.00,  15.0, 'Raffles Place, CBD',          'Moving',  '%s'),
(1,  1.3000000, 103.8600000, 62.00, 80.00,  12.0, 'Kallang, ECP',                'Moving',  '%s'),
(1,  1.3200000, 103.8800000, 0.00,  0.00,   10.0, 'Paya Lebar',                  'Parked',  '%s'),
(2,  1.2840000, 103.8510000, 55.00, 270.00, 15.0, 'Raffles Place, CBD',          'Moving',  '%s'),
(2,  1.3100000, 103.7600000, 88.00, 270.00,  8.0, 'Jurong East',                 'Moving',  '%s'),
(3,  1.2840000, 103.8510000, 0.00,  0.00,   15.0, 'Raffles Place, CBD',          'Parked',  '%s'),
(3,  1.3300000, 103.7400000, 72.00, 270.00, 10.0, 'Jurong West',                 'Moving',  '%s'),
(4,  1.2840000, 103.8510000, 38.00, 270.00, 15.0, 'Raffles Place, CBD',          'Moving',  '%s'),
(4,  1.2990000, 103.7870000, 42.00, 270.00, 12.0, 'One North, Fusionopolis',     'Moving',  '%s'),
(5,  1.2840000, 103.8510000, 50.00, 180.00, 15.0, 'Raffles Place, CBD',          'Moving',  '%s'),
(5,  1.3500000, 103.7530000, 80.00, 0.00,    5.0, 'Woodlands Checkpoint',        'Moving',  '%s'),
(6,  1.2840000, 103.8510000, 65.00, 90.00,  15.0, 'Raffles Place, CBD',          'Moving',  '%s'),
(6,  1.3340000, 103.9630000, 70.00, 90.00,   8.0, 'Changi Business Park',        'Moving',  '%s'),
(7,  1.3200000, 103.6380000, 45.00, 90.00,   5.0, 'Tuas Industrial Estate',      'Moving',  '%s'),
(7,  1.2900000, 103.7800000, 35.00, 90.00,  10.0, 'Queenstown',                  'Moving',  '%s'),
(7,  1.2810000, 103.8540000, 0.00,  0.00,   15.0, 'Marina Bay FC',               'Parked',  '%s'),
(8,  1.3200000, 103.6380000, 40.00, 90.00,   5.0, 'Tuas Industrial Estate',      'Moving',  '%s'),
(8,  1.3050000, 103.7650000, 38.00, 90.00,  10.0, 'Mapletree Business City',     'Moving',  '%s'),
(9,  1.4370000, 103.7860000, 35.00, 180.00, 10.0, 'Woodlands MRT',               'Moving',  '%s'),
(9,  1.2840000, 103.8510000, 0.00,  0.00,   15.0, 'Raffles Place, CBD',          'Parked',  '%s'),
(10, 1.3100000, 103.8500000, 42.00, 180.00, 12.0, 'Toa Payoh',                   'Moving',  '%s'),
(10, 1.2840000, 103.8510000, 0.00,  0.00,   15.0, 'Raffles Place, CBD',          'Parked',  '%s'),
(11, 1.2840000, 103.8510000, 42.00, 270.00, 15.0, 'Raffles Place, CBD',          'Moving',  '%s'),
(11, 1.3300000, 103.7400000, 0.00,  0.00,   10.0, 'Jurong East',                 'Parked',  '%s'),
(12, 1.2840000, 103.8510000, 55.00, 90.00,  15.0, 'Raffles Place, CBD',          'Moving',  '%s'),
(12, 1.3570000, 103.9890000, 0.00,  0.00,    5.0, 'Changi Airport T3',           'Parked',  '%s'),
(13, 1.2840000, 103.8510000, 0.00,  0.00,   15.0, 'Raffles Place, CBD',          'Offline', '%s'),
(14, 1.3200000, 103.6380000, 0.00,  0.00,    5.0, 'Isuzu Service Centre Tuas',   'Parked',  '%s'),
(15, 1.2840000, 103.8510000, 48.00, 270.00, 15.0, 'Raffles Place, CBD',          'Moving',  '%s'),
(15, 1.2990000, 103.7870000, 0.00,  0.00,   12.0, 'One North, Fusionopolis',     'Parked',  '%s'),
(16, 1.2840000, 103.8510000, 60.00, 270.00, 15.0, 'Raffles Place, CBD',          'Moving',  '%s'),
(16, 1.3300000, 103.7400000, 52.00, 270.00, 10.0, 'Jurong East',                 'Moving',  '%s'),
(17, 1.2840000, 103.8510000, 35.00, 90.00,  15.0, 'Raffles Place, CBD',          'Moving',  '%s'),
(17, 1.2810000, 103.8540000, 28.00, 90.00,  15.0, 'Marina Bay FC',               'Moving',  '%s'),
(18, 1.3200000, 103.6380000, 42.00, 90.00,   5.0, 'Tuas Industrial Estate',      'Moving',  '%s'),
(18, 1.3050000, 103.7650000, 0.00,  0.00,   10.0, 'Mapletree Business City',     'Parked',  '%s'),
(19, 1.2840000, 103.8510000, 0.00,  0.00,   15.0, 'Raffles Place, CBD',          'Parked',  '%s'),
(20, 1.2840000, 103.8510000, 52.00, 90.00,  15.0, 'Raffles Place, CBD',          'Moving',  '%s'),
(1,  1.3400000, 103.9600000, 75.00, 90.00,   8.0, 'ECP towards Changi',          'Moving',  '%s'),
(2,  1.3200000, 103.6380000, 80.00, 270.00,  5.0, 'AYE towards Tuas',            'Moving',  '%s'),
(7,  1.2900000, 103.8200000, 22.00, 90.00,  12.0, 'Queenstown, Tanglin',         'Idling',  '%s'),
(9,  1.3800000, 103.8100000, 45.00, 180.00, 10.0, 'Ang Mo Kio',                  'Moving',  '%s'),
(3,  1.3000000, 103.8200000, 68.00, 270.00, 12.0, 'CTE towards SLE',             'Moving',  '%s'),
(5,  1.3500000, 103.7530000, 60.00, 0.00,    5.0, 'BKE towards Woodlands',       'Moving',  '%s'),
(10, 1.3100000, 103.8500000, 35.00, 180.00, 12.0, 'CTE towards CBD',             'Moving',  '%s'),
(6,  1.3340000, 103.9630000, 70.00, 90.00,   8.0, 'PIE towards Changi',          'Moving',  '%s'),
(12, 1.3100000, 103.8800000, 48.00, 90.00,  10.0, 'ECP towards Changi',          'Moving',  '%s'),
(15, 1.3000000, 103.8000000, 55.00, 270.00, 12.0, 'AYE towards Clementi',        'Moving',  '%s'),
(16, 1.3100000, 103.8300000, 42.00, 270.00, 12.0, 'CTE towards PIE',             'Moving',  '%s'),
(11, 1.3200000, 103.8700000, 38.00, 90.00,  10.0, 'Bedok',                       'Moving',  '%s');
`,
		// 50 GPS records with varying timestamps
		ts(now, 0, -2, 0), ts(now, 0, -1, 45), ts(now, 0, -1, 15),
		ts(now, 0, -1, 50), ts(now, 0, -1, 10),
		ts(now, 0, -3, 0), ts(now, 0, -2, 10),
		ts(now, 0, -1, 40), ts(now, 0, -1, 5),
		ts(now, 0, -2, 30), ts(now, -1, -1, 0),
		ts(now, 0, -2, 20), ts(now, -1, -0, 30),
		ts(now, 0, -1, 30), ts(now, 0, -0, 55), ts(now, 0, -0, 30),
		ts(now, 0, -2, 0), ts(now, 0, -1, 0),
		ts(now, 0, -3, 30), ts(now, 0, -2, 50),
		ts(now, 0, -3, 30), ts(now, 0, -2, 50),
		ts(now, 0, -1, 50), ts(now, 0, -1, 0),
		ts(now, 0, -1, 45), ts(now, 0, -0, 55),
		ts(now, -2, 10, 0),
		ts(now, -1, 9, 0),
		ts(now, 0, -1, 30), ts(now, 0, -0, 50),
		ts(now, 0, -1, 40), ts(now, 0, -0, 55),
		ts(now, 0, -1, 20), ts(now, 0, -0, 45),
		ts(now, 0, -2, 0), ts(now, 0, -1, 0),
		ts(now, 0, -4, 0),
		ts(now, 0, -1, 15),
		ts(now, 0, -0, 40), ts(now, 0, -0, 35),
		ts(now, 0, -0, 50), ts(now, 0, -3, 10),
		ts(now, -1, 9, 30), ts(now, -1, 10, 0),
		ts(now, 0, -3, 0),
		ts(now, -1, 9, 0),
		ts(now, 0, -0, 55), ts(now, 0, -1, 20),
		ts(now, 0, -0, 45), ts(now, 0, -1, 30),
	)
	if _, err := db.ExecContext(ctx, gpsSQL); err != nil {
		return fmt.Errorf("插入GPS数据: %w", err)
	}
	fmt.Println("  📍 已插入 50 条GPS定位记录")

	// ---- 9b. GPS 路线轨迹（车辆1: 望京→首都机场 完整轨迹 8点） ----
	gpsRouteSQL := fmt.Sprintf(`
INSERT INTO gps_tracking (vehicle_id, latitude, longitude, speed, heading, altitude, location_name, status, recorded_at) VALUES
(1, 1.2840, 103.8510, 0.00,  0.00,   15.0, 'Raffles Place Carpark',     'Parked',  '%s'),
(1, 1.2900, 103.8600, 25.00, 90.00,  12.0, 'Nicoll Highway',            'Moving',  '%s'),
(1, 1.3050, 103.8800, 55.00, 85.00,  10.0, 'Kallang',                   'Moving',  '%s'),
(1, 1.3200, 103.9000, 72.00, 80.00,   8.0, 'ECP Tanjong Rhu',           'Moving',  '%s'),
(1, 1.3300, 103.9300, 88.00, 78.00,   8.0, 'ECP Bedok',                 'Moving',  '%s'),
(1, 1.3400, 103.9600, 80.00, 75.00,   6.0, 'ECP Tanah Merah',           'Moving',  '%s'),
(1, 1.3500, 103.9750, 65.00, 70.00,   5.0, 'Changi Airport Approach',   'Moving',  '%s'),
(1, 1.3570, 103.9890, 15.00, 60.00,   5.0, 'Changi Airport T3',         'Moving',  '%s'),
(7, 1.3200, 103.6380, 0.00,  0.00,    5.0, 'Tuas Warehouse',            'Parked',  '%s'),
(7, 1.3150, 103.6600, 35.00, 90.00,   5.0, 'Tuas Ave 2',                'Moving',  '%s'),
(7, 1.3100, 103.6900, 48.00, 90.00,   8.0, 'Pioneer Road',              'Moving',  '%s'),
(7, 1.3050, 103.7200, 55.00, 90.00,   8.0, 'AYE Jurong',                'Moving',  '%s'),
(7, 1.2980, 103.7600, 42.00, 90.00,  10.0, 'AYE Queenstown',            'Moving',  '%s'),
(7, 1.2900, 103.8000, 35.00, 90.00,  12.0, 'Tanglin Road',              'Moving',  '%s'),
(7, 1.2860, 103.8300, 28.00, 90.00,  14.0, 'Shenton Way',               'Moving',  '%s'),
(7, 1.2830, 103.8500, 18.00, 90.00,  15.0, 'Bayfront Ave',              'Idling',  '%s'),
(7, 1.2810, 103.8540, 0.00,  0.00,   15.0, 'Marina Bay FC',             'Parked',  '%s'),
(9, 1.4370, 103.7860, 0.00,  0.00,   10.0, 'Woodlands MRT Pickup',      'Parked',  '%s'),
(9, 1.4200, 103.7900, 32.00, 180.00, 10.0, 'SLE Woodlands',             'Moving',  '%s'),
(9, 1.3900, 103.8000, 42.00, 180.00, 10.0, 'SLE Ang Mo Kio',            'Moving',  '%s'),
(9, 1.3600, 103.8100, 38.00, 180.00, 12.0, 'CTE Bishan',                'Moving',  '%s'),
(9, 1.3300, 103.8300, 45.00, 180.00, 14.0, 'CTE Toa Payoh',             'Moving',  '%s'),
(9, 1.3000, 103.8450, 30.00, 180.00, 15.0, 'CTE Novena',                'Moving',  '%s'),
(9, 1.2840, 103.8510, 0.00,  0.00,   15.0, 'Raffles Place',             'Parked',  '%s'),
(2, 1.2840, 103.8510, 0.00,  0.00,   15.0, 'Raffles Place Departure',   'Parked',  '%s'),
(2, 1.2900, 103.8400, 42.00, 270.00, 14.0, 'Outram Road',               'Moving',  '%s'),
(2, 1.3000, 103.8200, 55.00, 270.00, 12.0, 'Tanglin',                   'Moving',  '%s'),
(2, 1.3100, 103.7900, 65.00, 270.00, 10.0, 'AYE Dover',                 'Moving',  '%s'),
(2, 1.3200, 103.7500, 78.00, 270.00,  8.0, 'AYE Clementi',              'Moving',  '%s'),
(2, 1.3250, 103.7100, 80.00, 270.00,  6.0, 'AYE Jurong East',           'Moving',  '%s'),
(2, 1.3300, 103.6800, 75.00, 270.00,  5.0, 'AYE Jurong West',           'Moving',  '%s'),
(2, 1.3250, 103.6500, 60.00, 270.00,  5.0, 'AYE Pioneer',               'Moving',  '%s'),
(2, 1.3200, 103.6380, 25.00, 270.00,  5.0, 'Tuas Industrial Arrival',   'Moving',  '%s');
`,
		// Vehicle 1: Wangjing → Airport (8 points, yesterday morning)
		ts(now, -1, 8, 0), ts(now, -1, 8, 3), ts(now, -1, 8, 8),
		ts(now, -1, 8, 15), ts(now, -1, 8, 22), ts(now, -1, 8, 28),
		ts(now, -1, 8, 35), ts(now, -1, 8, 42),
		// Vehicle 7: Warehouse → CBD (9 points, yesterday afternoon)
		ts(now, -1, 13, 0), ts(now, -1, 13, 5), ts(now, -1, 13, 12),
		ts(now, -1, 13, 18), ts(now, -1, 13, 25), ts(now, -1, 13, 32),
		ts(now, -1, 13, 40), ts(now, -1, 13, 50), ts(now, -1, 14, 0),
		// Vehicle 9: Huilongguan → Wangjing bus route (7 points, today morning)
		ts(now, 0, 6, 30), ts(now, 0, 6, 35), ts(now, 0, 6, 42),
		ts(now, 0, 6, 48), ts(now, 0, 6, 55), ts(now, 0, 7, 2), ts(now, 0, 7, 10),
		// Vehicle 2: Wangjing → Daxing Airport (9 points, 2 days ago)
		ts(now, -2, 14, 0), ts(now, -2, 14, 5), ts(now, -2, 14, 12),
		ts(now, -2, 14, 18), ts(now, -2, 14, 25), ts(now, -2, 14, 35),
		ts(now, -2, 14, 48), ts(now, -2, 15, 5), ts(now, -2, 15, 18),
	)
	if _, err := db.ExecContext(ctx, gpsRouteSQL); err != nil {
		return fmt.Errorf("插入GPS轨迹数据: %w", err)
	}
	fmt.Println("  🗺️  已插入 33 条GPS路线轨迹")

	// ---- 10. 告警 (18条) ----
	alertSQL := fmt.Sprintf(`
INSERT INTO alerts (vehicle_id, driver_id, alert_type, severity, title, description, location, latitude, longitude, speed, threshold_value, actual_value, status, handler, handled_at, handle_result, alert_time) VALUES
(7,  7,  'Speeding',       'High',     'Truck speeding alert',            'Vehicle travelling 82km/h in 60km/h zone',     'Tuas Ave 1',               1.3200, 103.6380, 82.00, '60 km/h',  '82 km/h',  'Handled',  'Dispatch Ctr Mgr', '%s', 'Driver notified to slow down', '%s'),
(5,  5,  'Speeding',       'Medium',   'Vehicle speeding alert',          'Vehicle travelling 95km/h in 80km/h zone',     'AYE towards Tuas',         1.3100, 103.7600, 95.00, '80 km/h',  '95 km/h',  'Handled',  'Dispatch Ctr Mgr', '%s', 'Phone reminder confirmed', '%s'),
(9,  9,  'Fatigue',        'Critical', 'Bus driver fatigue alert',        'Continuous driving over 4 hours without rest',  'Woodlands MRT',            1.4370, 103.7860, 45.00, '4 hrs',    '4.5 hrs',  'Handled',  'Safety Mgr Ali',   '%s', 'Arranged relief driver', '%s'),
(13, 13, 'Device Offline', 'Medium',   'GPS device offline',              'Vehicle GPS offline for over 24 hours',         'Last: Raffles Place',      1.2840, 103.8510, 0.00,  '2 hrs',    '48 hrs',   'Handling', NULL,               NULL, NULL, '%s'),
(1,  1,  'Service Due',    'Low',      'Vehicle service reminder',        'Mercedes S450L next service in 500km',          NULL,                       NULL,   NULL,     NULL,  '50000 km', '49500 km', 'Handled',  'Fleet Admin Amy',  '%s', 'Service booked', '%s'),
(19, NULL, 'Inspection Due','High',    'Vehicle inspection expiring',     'Nissan Sylphy inspection due in 30 days',       NULL,                       NULL,   NULL,     NULL,  '30 days',  '25 days',  'Unhandled', NULL,              NULL, NULL, '%s'),
(3,  3,  'Hard Brake',     'Medium',   'Emergency braking alert',         'Emergency braking detected, deceleration exceeded threshold', 'ECP Kallang', 1.3000, 103.8600, 68.00, '0.6g',     '0.75g',    'Ignored',  'Dispatch Ctr Mgr', '%s', 'Normal evasive manoeuvre', '%s'),
(6,  6,  'Hard Accel',     'Low',      'Harsh acceleration alert',        'Harsh acceleration detected, exceeded threshold','Raffles Place',            1.2840, 103.8510, 15.00, '0.4g',     '0.52g',    'Ignored',  'Dispatch Ctr Mgr', '%s', 'Normal start acceleration', '%s'),
(10, 10, 'Geofence',       'High',     'Coach left geofence',             'Vehicle left preset geofence area',             'BKE Woodlands',            1.4500, 103.7800, 55.00, '30km radius','32km',    'Handled',  'Dispatch Ctr Mgr', '%s', 'Temporary detour confirmed', '%s'),
(7,  7,  'Speeding',       'Medium',   'Truck speeding alert',            'Vehicle travelling 88km/h in 70km/h zone',     'AYE Jurong',               1.3050, 103.7200, 88.00, '70 km/h',  '88 km/h',  'Handled',  'Dispatch Ctr Mgr', '%s', 'Driver notified', '%s'),
(2,  2,  'Speeding',       'Medium',   'EV speeding alert',               'Vehicle travelling 95km/h in 80km/h zone',     'AYE towards Tuas',         1.3200, 103.6380, 95.00, '80 km/h',  '95 km/h',  'Unhandled', NULL,              NULL, NULL, '%s'),
(14, 14, 'Long Stop',      'Low',      'Abnormal vehicle stop',           'Vehicle stopped at service centre over 72 hours','Isuzu Centre Tuas',       1.3200, 103.6380, 0.00,  '24 hrs',   '96 hrs',   'Handled',  'Fleet Admin Amy',  '%s', 'Engine repair in progress, normal', '%s'),
(8,  8,  'Hard Brake',     'Medium',   'Emergency braking alert',         'Emergency braking detected',                    'Woodlands Ave 3',          1.4300, 103.7900, 55.00, '0.6g',     '0.68g',    'Unhandled', NULL,              NULL, NULL, '%s'),
(11, 11, 'Service Due',    'Low',      'Service reminder',                'Hyundai Ioniq 5 approaching next service mileage', NULL,                    NULL,   NULL,     NULL,  '30000 km', '28500 km', 'Unhandled', NULL,              NULL, NULL, '%s'),
(12, 12, 'Insurance Due',  'High',     'Insurance expiring soon',         'Mercedes E200 TP insurance due in 60 days',     NULL,                       NULL,   NULL,     NULL,  '60 days',  '55 days',  'Unhandled', NULL,              NULL, NULL, '%s'),
(16, 16, 'Speeding',       'Low',      'Urban speeding alert',            'Vehicle travelling 68km/h in 60km/h zone',      'CTE Novena',               1.3000, 103.8450, 68.00, '60 km/h',  '68 km/h',  'Ignored',  'Dispatch Ctr',    '%s', 'Minor speeding ignored', '%s'),
(17, 17, 'Hard Brake',     'Medium',   'Emergency braking alert',         'Emergency braking in CBD area',                 'Marina Bay FC',             1.2810, 103.8540, 45.00, '0.6g',     '0.72g',    'Unhandled', NULL,              NULL, NULL, '%s'),
(18, 18, 'Device Offline', 'Low',      'Weak GPS signal',                 'EV truck GPS signal weak, accuracy degraded',   'Underground carpark',       1.3200, 103.6380, 0.00,  'Normal',   'Weak',     'Ignored',  'Fleet Admin',     '%s', 'Underground carpark signal block', '%s');
`,
		// 18 alerts with handlers and times
		ts(now, -10, 8, 30), ts(now, -10, 8, 20),
		ts(now, -9, 10, 15), ts(now, -9, 10, 0),
		ts(now, -8, 11, 0), ts(now, -8, 10, 30),
		ts(now, -7, 0, 0),
		ts(now, -6, 14, 30), ts(now, -6, 14, 0),
		ts(now, -5, 10, 0),
		ts(now, -5, 15, 0), ts(now, -5, 14, 45),
		ts(now, -4, 16, 0), ts(now, -4, 15, 50),
		ts(now, -4, 10, 30), ts(now, -4, 10, 15),
		ts(now, -3, 8, 45), ts(now, -3, 8, 30),
		ts(now, -3, 7, 0),
		ts(now, -2, 15, 0), ts(now, -2, 14, 30),
		ts(now, -2, 9, 15),
		ts(now, -1, 10, 0),
		ts(now, -1, 12, 0),
		ts(now, -1, 14, 0),
		ts(now, 0, -3, 0), ts(now, 0, -3, 10),
		ts(now, 0, -2, 30),
		ts(now, 0, -4, 0),
	)
	if _, err := db.ExecContext(ctx, alertSQL); err != nil {
		return fmt.Errorf("插入告警数据: %w", err)
	}
	fmt.Println("  ⚠️  已插入 18 条告警记录")

	return nil
}

// ts 生成时间字符串: base + dayOffset天, 设置小时和分钟。
// 注意: hour/minute 可以为负值，表示从当天零点回退（如 hour=-3 表示前一天 21:00）。
func ts(base time.Time, dayOffset, hour, minute int) string {
	t := base.AddDate(0, 0, dayOffset)
	t = time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
	t = t.Add(time.Duration(hour)*time.Hour + time.Duration(minute)*time.Minute)
	return t.Format("2006-01-02 15:04:05")
}

// ds 生成日期字符串
func ds(base time.Time, dayOffset int) string {
	t := base.AddDate(0, 0, dayOffset)
	return t.Format("2006-01-02")
}

// getWorkspaceOwner 获取工作空间所有者 ID
func getWorkspaceOwner(db *gorm.DB, wsID uuid.UUID) (uuid.UUID, error) {
	var ownerID string
	err := db.Table("what_reverse_workspaces").
		Where("id = ?", wsID.String()).
		Pluck("owner_user_id", &ownerID).Error
	if err != nil {
		return uuid.Nil, fmt.Errorf("查询工作空间: %w", err)
	}
	return uuid.Parse(ownerID)
}

// seedUISchemaAndPublish 创建 UI Schema + 版本 + 发布工作空间
func seedUISchemaAndPublish(db *gorm.DB, wsID, ownerID uuid.UUID) error {
	uiSchema := buildFleetUISchema()

	schemaJSON, err := json.Marshal(uiSchema)
	if err != nil {
		return fmt.Errorf("序列化 UI Schema: %w", err)
	}

	// 创建版本
	versionID := uuid.New()
	now := time.Now()

	// 先删除已有版本
	db.Table("what_reverse_workspace_versions").
		Where("workspace_id = ?", wsID.String()).
		Delete(map[string]interface{}{})

	// 构建业务逻辑 JS 代码
	logicCode := buildFleetLogicCode()

	// 创建新版本
	if err := db.Table("what_reverse_workspace_versions").Create(map[string]interface{}{
		"id":           versionID.String(),
		"workspace_id": wsID.String(),
		"version":      "1.0.0",
		"changelog":    "SG Fleet Management System - Initial version with business logic",
		"ui_schema":    string(schemaJSON),
		"logic_code":   logicCode,
		"created_by":   ownerID.String(),
		"created_at":   now,
	}).Error; err != nil {
		return fmt.Errorf("创建版本: %w", err)
	}
	fmt.Println("  📦 已创建版本 v1.0.0（含业务逻辑）")

	// 更新 workspace: 设置当前版本、发布状态、名称
	if err := db.Table("what_reverse_workspaces").
		Where("id = ?", wsID.String()).
		Updates(map[string]interface{}{
			"current_version_id": versionID.String(),
			"app_status":         "published",
			"published_at":       now,
			"name":               "SG Fleet Management",
			"slug":               "fleet",
			"icon":               "🚐",
			"updated_at":         now,
		}).Error; err != nil {
		return fmt.Errorf("更新工作空间: %w", err)
	}
	fmt.Println("  🚀 已发布工作空间")

	return nil
}

// buildFleetUISchema 构建车队管理系统的 AppSchema v2.0
func buildFleetUISchema() map[string]interface{} {
	return map[string]interface{}{
		"app_schema_version": "2.0.0",
		"app_name":           "SG Fleet Management",
		"default_page":       "reservations",
		"navigation": map[string]interface{}{
			"type": "sidebar",
		},
		"theme": map[string]interface{}{
			"primary_color": "#2563eb",
			"border_radius": "0.5rem",
		},
		"pages": []interface{}{
			// ====== 1. 用车预定（主系统）======
			buildReservationsPage(),
			// ====== 1b. 预定详情（隐藏页面，通过行点击导航）======
			buildReservationDetailPage(),
			// ====== 2. 仪表盘 ======
			buildDashboardPage(),
			// ====== 3. 车辆管理 ======
			buildVehiclesPage(),
			// ====== 4. 驾驶员管理 ======
			buildDriversPage(),
			// ====== 4. 行程记录 ======
			map[string]interface{}{
				"id":    "trips",
				"title": "Trips",
				"route": "/trips",
				"icon":  "MapPin",
				"blocks": []interface{}{
					map[string]interface{}{
						"id": "trips_table", "type": "data_table",
						"config": map[string]interface{}{
							"table_name": "trips",
							"columns": []interface{}{
								map[string]interface{}{"key": "trip_no", "label": "Code", "type": "text", "sortable": true},
								map[string]interface{}{"key": "vehicle_id", "label": "Vehicle", "type": "lookup", "lookup_table": "vehicles", "lookup_key": "id", "display_key": "plate_number"},
								map[string]interface{}{"key": "driver_id", "label": "Driver", "type": "lookup", "lookup_table": "drivers", "lookup_key": "id", "display_key": "name"},
								map[string]interface{}{"key": "start_location", "label": "From", "type": "text"},
								map[string]interface{}{"key": "end_location", "label": "To", "type": "text"},
								map[string]interface{}{"key": "distance_km", "label": "Distance(km)", "type": "number", "sortable": true},
								map[string]interface{}{"key": "purpose", "label": "Purpose", "type": "text"},
								map[string]interface{}{"key": "status", "label": "Status", "type": "badge"},
								map[string]interface{}{"key": "start_time", "label": "Departure", "type": "date", "sortable": true},
							},
							"actions":        []interface{}{"view", "create", "edit", "delete"},
							"search_enabled": true, "search_key": "trip_no",
							"pagination": true, "page_size": 15,
						},
						"data_source": map[string]interface{}{
							"table":    "trips",
							"order_by": []interface{}{map[string]interface{}{"column": "start_time", "direction": "DESC"}},
						},
					},
				},
			},
			// ====== 5. 路线管理 ======
			map[string]interface{}{
				"id":    "routes",
				"title": "Routes",
				"route": "/routes",
				"icon":  "Globe",
				"blocks": []interface{}{
					map[string]interface{}{
						"id": "routes_table", "type": "data_table",
						"config": map[string]interface{}{
							"table_name": "routes",
							"columns": []interface{}{
								map[string]interface{}{"key": "name", "label": "Route Name", "type": "text", "sortable": true},
								map[string]interface{}{"key": "route_code", "label": "Code", "type": "text"},
								map[string]interface{}{"key": "start_point", "label": "Start Point", "type": "text"},
								map[string]interface{}{"key": "end_point", "label": "End Point", "type": "text"},
								map[string]interface{}{"key": "distance_km", "label": "Distance(km)", "type": "number", "sortable": true},
								map[string]interface{}{"key": "route_type", "label": "Type", "type": "badge"},
								map[string]interface{}{"key": "status", "label": "Status", "type": "badge"},
							},
							"actions":        []interface{}{"view", "create", "edit", "delete"},
							"search_enabled": true, "search_key": "name",
							"pagination": true, "page_size": 15,
						},
						"data_source": map[string]interface{}{
							"table":    "routes",
							"order_by": []interface{}{map[string]interface{}{"column": "id", "direction": "ASC"}},
						},
					},
				},
			},
			// ====== 6. 维修保养 ======
			map[string]interface{}{
				"id":    "maintenance",
				"title": "Maintenance",
				"route": "/maintenance",
				"icon":  "Settings",
				"blocks": []interface{}{
					map[string]interface{}{
						"id": "stat_pending_maintenance", "type": "stats_card",
						"grid": map[string]interface{}{"col_span": 1},
						"config": map[string]interface{}{
							"label": "Pending", "value_key": "count", "icon": "Clock", "color": "amber",
						},
						"data_source": map[string]interface{}{
							"table": "maintenance_records", "where": "status = 'Pending'",
							"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
						},
					},
					map[string]interface{}{
						"id": "stat_in_progress_maintenance", "type": "stats_card",
						"grid": map[string]interface{}{"col_span": 1},
						"config": map[string]interface{}{
							"label": "In Progress", "value_key": "count", "icon": "Settings", "color": "blue",
						},
						"data_source": map[string]interface{}{
							"table": "maintenance_records", "where": "status = 'In Progress'",
							"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
						},
					},
					map[string]interface{}{
						"id": "stat_completed_maintenance", "type": "stats_card",
						"grid": map[string]interface{}{"col_span": 1},
						"config": map[string]interface{}{
							"label": "Completed", "value_key": "count", "icon": "CheckCircle", "color": "green",
						},
						"data_source": map[string]interface{}{
							"table": "maintenance_records", "where": "status = 'Completed'",
							"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
						},
					},
					map[string]interface{}{
						"id": "stat_total_maintenance", "type": "stats_card",
						"grid": map[string]interface{}{"col_span": 1},
						"config": map[string]interface{}{
							"label": "Total Orders", "value_key": "count", "icon": "Briefcase", "color": "default",
						},
						"data_source": map[string]interface{}{
							"table":       "maintenance_records",
							"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
						},
					},
					map[string]interface{}{
						"id": "maintenance_type_chart", "type": "chart",
						"label": "Maintenance Type Distribution",
						"grid":  map[string]interface{}{"col_span": 2},
						"config": map[string]interface{}{
							"chart_type": "pie", "title": "Maintenance Type Distribution",
							"x_key": "maintenance_type", "y_key": "count", "category_key": "maintenance_type",
						},
						"data_source": map[string]interface{}{"table": "maintenance_records", "limit": 100},
					},
					map[string]interface{}{
						"id": "maintenance_table", "type": "data_table",
						"config": map[string]interface{}{
							"table_name": "maintenance_records",
							"columns": []interface{}{
								map[string]interface{}{"key": "record_no", "label": "Work Order", "type": "text", "sortable": true},
								map[string]interface{}{"key": "vehicle_id", "label": "Vehicle", "type": "lookup", "lookup_table": "vehicles", "lookup_key": "id", "display_key": "plate_number"},
								map[string]interface{}{"key": "maintenance_type", "label": "Type", "type": "badge"},
								map[string]interface{}{"key": "service_provider", "label": "Provider", "type": "text"},
								map[string]interface{}{"key": "cost", "label": "Cost(SGD)", "type": "number", "sortable": true},
								map[string]interface{}{"key": "status", "label": "Status", "type": "badge"},
								map[string]interface{}{"key": "start_date", "label": "Start Date", "type": "date", "sortable": true},
							},
							"actions":        []interface{}{"view", "create", "edit", "delete"},
							"search_enabled": true, "search_key": "record_no",
							"pagination": true, "page_size": 15,
						},
						"data_source": map[string]interface{}{
							"table":    "maintenance_records",
							"order_by": []interface{}{map[string]interface{}{"column": "start_date", "direction": "DESC"}},
						},
					},
				},
			},
			// ====== 7. 加油记录 ======
			map[string]interface{}{
				"id":    "fuel",
				"title": "Fuel Records",
				"route": "/fuel",
				"icon":  "Zap",
				"blocks": []interface{}{
					map[string]interface{}{
						"id": "fuel_type_chart", "type": "chart",
						"label": "Fuel Cost by Type",
						"grid":  map[string]interface{}{"col_span": 2},
						"config": map[string]interface{}{
							"chart_type": "pie", "title": "Fuel Cost by Type",
							"x_key": "fuel_type", "y_key": "count", "category_key": "fuel_type",
						},
						"data_source": map[string]interface{}{"table": "fuel_records", "limit": 200},
					},
					map[string]interface{}{
						"id": "fuel_table", "type": "data_table",
						"config": map[string]interface{}{
							"table_name": "fuel_records",
							"columns": []interface{}{
								map[string]interface{}{"key": "vehicle_id", "label": "Vehicle", "type": "lookup", "lookup_table": "vehicles", "lookup_key": "id", "display_key": "plate_number"},
								map[string]interface{}{"key": "fuel_type", "label": "Fuel Type", "type": "badge"},
								map[string]interface{}{"key": "quantity", "label": "Quantity", "type": "number"},
								map[string]interface{}{"key": "unit_price", "label": "Price/L(SGD)", "type": "number"},
								map[string]interface{}{"key": "total_cost", "label": "Total(SGD)", "type": "number", "sortable": true},
								map[string]interface{}{"key": "gas_station", "label": "Station", "type": "text"},
								map[string]interface{}{"key": "fuel_date", "label": "Date", "type": "date", "sortable": true},
							},
							"actions":        []interface{}{"view", "create", "edit"},
							"search_enabled": true, "search_key": "gas_station",
							"pagination": true, "page_size": 15,
						},
						"data_source": map[string]interface{}{
							"table":    "fuel_records",
							"order_by": []interface{}{map[string]interface{}{"column": "fuel_date", "direction": "DESC"}},
						},
					},
				},
			},
			// ====== 8. 违章记录 ======
			map[string]interface{}{
				"id":    "violations",
				"title": "Violations",
				"route": "/violations",
				"icon":  "AlertTriangle",
				"blocks": []interface{}{
					map[string]interface{}{
						"id": "violations_table", "type": "data_table",
						"config": map[string]interface{}{
							"table_name": "violations",
							"columns": []interface{}{
								map[string]interface{}{"key": "vehicle_id", "label": "Vehicle", "type": "lookup", "lookup_table": "vehicles", "lookup_key": "id", "display_key": "plate_number"},
								map[string]interface{}{"key": "driver_id", "label": "Driver", "type": "lookup", "lookup_table": "drivers", "lookup_key": "id", "display_key": "name"},
								map[string]interface{}{"key": "violation_type", "label": "Offence Type", "type": "text"},
								map[string]interface{}{"key": "fine_amount", "label": "Fine(SGD)", "type": "number", "sortable": true},
								map[string]interface{}{"key": "deduction_points", "label": "Demerit Pts", "type": "number"},
								map[string]interface{}{"key": "status", "label": "Status", "type": "badge"},
								map[string]interface{}{"key": "violation_date", "label": "Offence Date", "type": "date", "sortable": true},
							},
							"actions":        []interface{}{"view", "edit"},
							"search_enabled": true, "search_key": "violation_type",
							"pagination": true, "page_size": 15,
						},
						"data_source": map[string]interface{}{
							"table":    "violations",
							"order_by": []interface{}{map[string]interface{}{"column": "violation_date", "direction": "DESC"}},
						},
					},
				},
			},
			// ====== 9. 保险管理 ======
			map[string]interface{}{
				"id":    "insurance",
				"title": "Insurance",
				"route": "/insurance",
				"icon":  "Briefcase",
				"blocks": []interface{}{
					map[string]interface{}{
						"id": "insurance_table", "type": "data_table",
						"config": map[string]interface{}{
							"table_name": "insurance_policies",
							"columns": []interface{}{
								map[string]interface{}{"key": "vehicle_id", "label": "Vehicle", "type": "lookup", "lookup_table": "vehicles", "lookup_key": "id", "display_key": "plate_number"},
								map[string]interface{}{"key": "policy_no", "label": "Policy No.", "type": "text"},
								map[string]interface{}{"key": "insurance_company", "label": "Insurer", "type": "text"},
								map[string]interface{}{"key": "insurance_type", "label": "Type", "type": "badge"},
								map[string]interface{}{"key": "premium", "label": "Premium(SGD)", "type": "number", "sortable": true},
								map[string]interface{}{"key": "status", "label": "Status", "type": "badge"},
								map[string]interface{}{"key": "end_date", "label": "Expiry Date", "type": "date", "sortable": true},
							},
							"actions":        []interface{}{"view", "create", "edit"},
							"search_enabled": true, "search_key": "policy_no",
							"pagination": true, "page_size": 15,
						},
						"data_source": map[string]interface{}{
							"table":    "insurance_policies",
							"order_by": []interface{}{map[string]interface{}{"column": "end_date", "direction": "ASC"}},
						},
					},
				},
			},
			// ====== 10. 告警中心 ======
			map[string]interface{}{
				"id":    "alerts",
				"title": "Alert Centre",
				"route": "/alerts",
				"icon":  "Activity",
				"blocks": []interface{}{
					map[string]interface{}{
						"id": "stat_unhandled", "type": "stats_card",
						"grid": map[string]interface{}{"col_span": 1},
						"config": map[string]interface{}{
							"label": "Unhandled", "value_key": "count", "icon": "AlertTriangle", "color": "red",
						},
						"data_source": map[string]interface{}{
							"table": "alerts", "where": "status = 'Unhandled'",
							"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
						},
					},
					map[string]interface{}{
						"id": "stat_handling", "type": "stats_card",
						"grid": map[string]interface{}{"col_span": 1},
						"config": map[string]interface{}{
							"label": "Handling", "value_key": "count", "icon": "Clock", "color": "amber",
						},
						"data_source": map[string]interface{}{
							"table": "alerts", "where": "status = 'Handling'",
							"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
						},
					},
					map[string]interface{}{
						"id": "stat_handled", "type": "stats_card",
						"grid": map[string]interface{}{"col_span": 1},
						"config": map[string]interface{}{
							"label": "Handled", "value_key": "count", "icon": "CheckCircle", "color": "green",
						},
						"data_source": map[string]interface{}{
							"table": "alerts", "where": "status = 'Handled'",
							"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
						},
					},
					map[string]interface{}{
						"id": "stat_ignored", "type": "stats_card",
						"grid": map[string]interface{}{"col_span": 1},
						"config": map[string]interface{}{
							"label": "Ignored", "value_key": "count", "icon": "Star", "color": "default",
						},
						"data_source": map[string]interface{}{
							"table": "alerts", "where": "status = 'Ignored'",
							"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
						},
					},
					map[string]interface{}{
						"id": "alert_severity_chart", "type": "chart",
						"label": "Alert Severity Distribution",
						"grid":  map[string]interface{}{"col_span": 2},
						"config": map[string]interface{}{
							"chart_type":   "pie",
							"title":        "Alert Severity Distribution",
							"x_key":        "severity",
							"y_key":        "count",
							"category_key": "severity",
						},
						"data_source": map[string]interface{}{
							"table": "alerts",
							"limit": 100,
						},
					},
					map[string]interface{}{
						"id": "alerts_table", "type": "data_table",
						"config": map[string]interface{}{
							"table_name": "alerts",
							"columns": []interface{}{
								map[string]interface{}{"key": "title", "label": "Title", "type": "text"},
								map[string]interface{}{"key": "alert_type", "label": "Type", "type": "badge"},
								map[string]interface{}{"key": "severity", "label": "Severity", "type": "badge"},
								map[string]interface{}{"key": "location", "label": "Location", "type": "text"},
								map[string]interface{}{"key": "status", "label": "Status", "type": "badge"},
								map[string]interface{}{"key": "handler", "label": "Handler", "type": "text"},
								map[string]interface{}{"key": "alert_time", "label": "Alert Time", "type": "date", "sortable": true},
							},
							"actions":        []interface{}{"view", "edit"},
							"search_enabled": true, "search_key": "title",
							"filters_enabled": true,
							"pagination":      true, "page_size": 15,
						},
						"data_source": map[string]interface{}{
							"table":    "alerts",
							"order_by": []interface{}{map[string]interface{}{"column": "alert_time", "direction": "DESC"}},
						},
					},
				},
			},
		},
	}
}

func buildDashboardPage() map[string]interface{} {
	return map[string]interface{}{
		"id": "dashboard", "title": "Dashboard", "route": "/dashboard", "icon": "LayoutDashboard",
		"blocks": []interface{}{
			map[string]interface{}{
				"id": "stat_total_vehicles", "type": "stats_card",
				"grid": map[string]interface{}{"col_span": 1},
				"config": map[string]interface{}{
					"label": "Total Vehicles", "value_key": "count", "icon": "Truck", "color": "blue",
				},
				"data_source": map[string]interface{}{
					"table":       "vehicles",
					"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
				},
			},
			map[string]interface{}{
				"id": "stat_online_vehicles", "type": "stats_card",
				"grid": map[string]interface{}{"col_span": 1},
				"config": map[string]interface{}{
					"label": "Online Vehicles", "value_key": "count", "icon": "CheckCircle", "color": "green",
				},
				"data_source": map[string]interface{}{
					"table": "vehicles", "where": "status = 'Online'",
					"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
				},
			},
			map[string]interface{}{
				"id": "stat_total_drivers", "type": "stats_card",
				"grid": map[string]interface{}{"col_span": 1},
				"config": map[string]interface{}{
					"label": "Total Drivers", "value_key": "count", "icon": "Users", "color": "default",
				},
				"data_source": map[string]interface{}{
					"table":       "drivers",
					"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
				},
			},
			map[string]interface{}{
				"id": "stat_active_alerts", "type": "stats_card",
				"grid": map[string]interface{}{"col_span": 1},
				"config": map[string]interface{}{
					"label": "Pending Alerts", "value_key": "count", "icon": "AlertTriangle", "color": "red",
				},
				"data_source": map[string]interface{}{
					"table": "alerts", "where": "status = 'Unhandled'",
					"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
				},
			},
			map[string]interface{}{
				"id": "stat_pending_reservations_dash", "type": "stats_card",
				"grid": map[string]interface{}{"col_span": 1},
				"config": map[string]interface{}{
					"label": "Pending Bookings", "value_key": "count", "icon": "CalendarCheck", "color": "amber",
				},
				"data_source": map[string]interface{}{
					"table": "reservations", "where": "status = 'Pending'",
					"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
				},
			},
			map[string]interface{}{
				"id": "vehicle_status_chart", "type": "chart",
				"label": "Vehicle Status",
				"grid":  map[string]interface{}{"col_span": 2},
				"config": map[string]interface{}{
					"chart_type": "pie", "title": "Vehicle Status",
					"x_key": "status", "y_key": "count", "category_key": "status",
				},
				"data_source": map[string]interface{}{"table": "vehicles", "limit": 100},
			},
			map[string]interface{}{
				"id": "vehicle_type_chart", "type": "chart",
				"label": "Vehicle Types",
				"grid":  map[string]interface{}{"col_span": 2},
				"config": map[string]interface{}{
					"chart_type": "pie", "title": "Vehicle Types",
					"x_key": "vehicle_type", "y_key": "count", "category_key": "vehicle_type",
				},
				"data_source": map[string]interface{}{"table": "vehicles", "limit": 100},
			},
			map[string]interface{}{
				"id": "fuel_consumption_chart", "type": "chart",
				"label": "Fuel Consumption",
				"grid":  map[string]interface{}{"col_span": 2},
				"config": map[string]interface{}{
					"chart_type": "pie", "title": "Fuel Consumption",
					"x_key": "fuel_type", "y_key": "count", "category_key": "fuel_type",
				},
				"data_source": map[string]interface{}{"table": "fuel_records", "limit": 200},
			},
			map[string]interface{}{
				"id": "alert_type_chart", "type": "chart",
				"label": "Alert Types",
				"grid":  map[string]interface{}{"col_span": 2},
				"config": map[string]interface{}{
					"chart_type": "pie", "title": "Alert Types",
					"x_key": "alert_type", "y_key": "count", "category_key": "alert_type",
				},
				"data_source": map[string]interface{}{"table": "alerts", "limit": 100},
			},
			map[string]interface{}{
				"id": "recent_trips", "type": "data_table", "label": "Recent Trips",
				"config": map[string]interface{}{
					"table_name": "trips",
					"columns": []interface{}{
						map[string]interface{}{"key": "trip_no", "label": "Trip No.", "type": "text"},
						map[string]interface{}{"key": "start_location", "label": "From", "type": "text"},
						map[string]interface{}{"key": "end_location", "label": "To", "type": "text"},
						map[string]interface{}{"key": "distance_km", "label": "Distance(km)", "type": "number"},
						map[string]interface{}{"key": "status", "label": "Status", "type": "badge"},
						map[string]interface{}{"key": "start_time", "label": "Departure", "type": "date"},
					},
					"page_size": 10, "pagination": true, "search_enabled": true, "search_key": "trip_no",
					"actions": []interface{}{"view"},
				},
				"data_source": map[string]interface{}{
					"table": "trips", "order_by": []interface{}{map[string]interface{}{"column": "start_time", "direction": "DESC"}},
				},
			},
			map[string]interface{}{
				"id": "recent_alerts", "type": "data_table", "label": "Recent Alerts",
				"config": map[string]interface{}{
					"table_name": "alerts",
					"columns": []interface{}{
						map[string]interface{}{"key": "title", "label": "Title", "type": "text"},
						map[string]interface{}{"key": "alert_type", "label": "Type", "type": "badge"},
						map[string]interface{}{"key": "severity", "label": "Severity", "type": "badge"},
						map[string]interface{}{"key": "status", "label": "Status", "type": "badge"},
						map[string]interface{}{"key": "alert_time", "label": "Alert Time", "type": "date"},
					},
					"page_size": 5,
					"actions":   []interface{}{"view"},
				},
				"data_source": map[string]interface{}{
					"table": "alerts", "order_by": []interface{}{map[string]interface{}{"column": "alert_time", "direction": "DESC"}}, "limit": 5,
				},
			},
			map[string]interface{}{
				"id": "recent_reservations", "type": "data_table", "label": "Recent Bookings",
				"config": map[string]interface{}{
					"table_name": "reservations",
					"columns": []interface{}{
						map[string]interface{}{"key": "reservation_no", "label": "Booking No.", "type": "text"},
						map[string]interface{}{"key": "applicant_name", "label": "申请人", "type": "text"},
						map[string]interface{}{"key": "applicant_department", "label": "Dept", "type": "text"},
						map[string]interface{}{"key": "purpose", "label": "Purpose", "type": "text"},
						map[string]interface{}{"key": "priority", "label": "Priority", "type": "badge"},
						map[string]interface{}{"key": "status", "label": "Status", "type": "badge"},
						map[string]interface{}{"key": "start_time", "label": "Booking Time", "type": "date"},
					},
					"page_size": 5,
					"actions":   []interface{}{"view"},
				},
				"data_source": map[string]interface{}{
					"table": "reservations", "order_by": []interface{}{map[string]interface{}{"column": "start_time", "direction": "DESC"}}, "limit": 5,
				},
			},
		},
	}
}

func buildVehiclesPage() map[string]interface{} {
	return map[string]interface{}{
		"id": "vehicles", "title": "Vehicles", "route": "/vehicles", "icon": "Truck",
		"blocks": []interface{}{
			map[string]interface{}{
				"id": "vehicles_table", "type": "data_table",
				"config": map[string]interface{}{
					"table_name": "vehicles",
					"columns": []interface{}{
						map[string]interface{}{"key": "plate_number", "label": "Plate No.", "type": "text", "sortable": true},
						map[string]interface{}{"key": "brand", "label": "Brand", "type": "text"},
						map[string]interface{}{"key": "model", "label": "Model", "type": "text"},
						map[string]interface{}{"key": "vehicle_type", "label": "Type", "type": "badge"},
						map[string]interface{}{"key": "fuel_type", "label": "Fuel", "type": "badge"},
						map[string]interface{}{"key": "mileage", "label": "Mileage(km)", "type": "number", "sortable": true},
						map[string]interface{}{"key": "department", "label": "Dept", "type": "text"},
						map[string]interface{}{"key": "status", "label": "Status", "type": "badge"},
					},
					"actions": []interface{}{"view", "create", "edit", "delete"}, "search_enabled": true, "search_key": "plate_number",
					"pagination": true, "page_size": 15, "filters_enabled": true,
				},
				"data_source": map[string]interface{}{
					"table": "vehicles", "order_by": []interface{}{map[string]interface{}{"column": "id", "direction": "ASC"}},
				},
			},
		},
	}
}

func buildDriversPage() map[string]interface{} {
	return map[string]interface{}{
		"id": "drivers", "title": "Drivers", "route": "/drivers", "icon": "Users",
		"blocks": []interface{}{
			map[string]interface{}{
				"id": "drivers_table", "type": "data_table",
				"config": map[string]interface{}{
					"table_name": "drivers",
					"columns": []interface{}{
						map[string]interface{}{"key": "name", "label": "Name", "type": "text", "sortable": true},
						map[string]interface{}{"key": "phone", "label": "Phone", "type": "text"},
						map[string]interface{}{"key": "license_type", "label": "Licence Class", "type": "badge"},
						map[string]interface{}{"key": "department", "label": "Dept", "type": "text"},
						map[string]interface{}{"key": "driving_years", "label": "Exp(yrs)", "type": "number"},
						map[string]interface{}{"key": "rating", "label": "Rating", "type": "number"},
						map[string]interface{}{"key": "violation_count", "label": "Violations", "type": "number"},
						map[string]interface{}{"key": "status", "label": "Status", "type": "badge"},
					},
					"actions": []interface{}{"view", "create", "edit", "delete"}, "search_enabled": true, "search_key": "name",
					"pagination": true, "page_size": 15,
				},
				"data_source": map[string]interface{}{
					"table": "drivers", "order_by": []interface{}{map[string]interface{}{"column": "id", "direction": "ASC"}},
				},
			},
		},
	}
}

func buildReservationsPage() map[string]interface{} {
	return map[string]interface{}{
		"id": "reservations", "title": "Reservations", "route": "/reservations", "icon": "CalendarCheck",
		"blocks": []interface{}{
			// ---- 状态统计卡片 ----
			map[string]interface{}{
				"id": "stat_pending_reservations", "type": "stats_card",
				"grid": map[string]interface{}{"col_span": 1},
				"config": map[string]interface{}{
					"label": "Pending", "value_key": "count", "icon": "Clock", "color": "amber",
				},
				"data_source": map[string]interface{}{
					"table": "reservations", "where": "status = 'Pending'",
					"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
				},
			},
			map[string]interface{}{
				"id": "stat_approved_reservations", "type": "stats_card",
				"grid": map[string]interface{}{"col_span": 1},
				"config": map[string]interface{}{
					"label": "Approved", "value_key": "count", "icon": "CheckCircle", "color": "blue",
				},
				"data_source": map[string]interface{}{
					"table": "reservations", "where": "status = 'Approved'",
					"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
				},
			},
			map[string]interface{}{
				"id": "stat_inprogress_reservations", "type": "stats_card",
				"grid": map[string]interface{}{"col_span": 1},
				"config": map[string]interface{}{
					"label": "In Progress", "value_key": "count", "icon": "Navigation", "color": "green",
				},
				"data_source": map[string]interface{}{
					"table": "reservations", "where": "status = 'In Progress'",
					"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
				},
			},
			map[string]interface{}{
				"id": "stat_completed_reservations", "type": "stats_card",
				"grid": map[string]interface{}{"col_span": 1},
				"config": map[string]interface{}{
					"label": "Completed", "value_key": "count", "icon": "CircleCheck", "color": "default",
				},
				"data_source": map[string]interface{}{
					"table": "reservations", "where": "status = 'Completed'",
					"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
				},
			},
			// ---- 日历视图 ----
			map[string]interface{}{
				"id": "reservation_calendar", "type": "calendar",
				"grid": map[string]interface{}{"col_span": 4},
				"config": map[string]interface{}{
					"table_name":   "reservations",
					"title_key":    "purpose",
					"start_key":    "start_time",
					"end_key":      "end_time",
					"status_key":   "status",
					"default_view": "month",
					"detail_fields": []interface{}{
						map[string]interface{}{"key": "reservation_no", "label": "Code"},
						map[string]interface{}{"key": "applicant_name", "label": "Applicant"},
						map[string]interface{}{"key": "applicant_department", "label": "Dept"},
						map[string]interface{}{"key": "start_location", "label": "From"},
						map[string]interface{}{"key": "end_location", "label": "To"},
						map[string]interface{}{"key": "passengers", "label": "Pax"},
						map[string]interface{}{"key": "priority", "label": "Priority"},
					},
					"status_colors": map[string]interface{}{
						"Pending":     "bg-amber-500/15 text-amber-700 border-amber-400/30",
						"Approved":    "bg-emerald-500/15 text-emerald-700 border-emerald-400/30",
						"In Progress": "bg-blue-500/15 text-blue-700 border-blue-400/30",
						"Completed":   "bg-slate-500/10 text-slate-600 border-slate-400/30",
						"Rejected":    "bg-red-500/15 text-red-700 border-red-400/30",
						"Cancelled":   "bg-gray-500/10 text-gray-500 border-gray-400/30",
					},
					"click_action": map[string]interface{}{
						"type":      "navigate",
						"page_id":   "reservation_detail",
						"param_key": "record_id",
					},
				},
				"data_source": map[string]interface{}{"table": "reservations"},
			},
			// ---- 图表 ----
			map[string]interface{}{
				"id": "reservation_status_chart", "type": "chart",
				"label": "Booking Status",
				"grid":  map[string]interface{}{"col_span": 2},
				"config": map[string]interface{}{
					"chart_type": "pie", "title": "Booking Status",
					"x_key": "status", "category_key": "status",
				},
				"data_source": map[string]interface{}{"table": "reservations", "limit": 200},
			},
			map[string]interface{}{
				"id": "reservation_dept_chart", "type": "chart",
				"label": "Bookings by Dept",
				"grid":  map[string]interface{}{"col_span": 2},
				"config": map[string]interface{}{
					"chart_type": "bar", "title": "Bookings by Dept",
					"x_key": "applicant_department", "category_key": "applicant_department",
				},
				"data_source": map[string]interface{}{"table": "reservations", "limit": 200},
			},
			// ---- 新建预定（Dialog 弹窗）----
			map[string]interface{}{
				"id": "reservation_create_dialog", "type": "form_dialog",
				"config": map[string]interface{}{
					"table_name":     "reservations",
					"title":          "New Reservation",
					"description":    "Fill in reservation details. System will auto-match available vehicles",
					"trigger_label":  "New Booking",
					"dialog_size":    "lg",
					"submit_label":   "Submit Booking",
					"pre_submit_api": "/api/validate-reservation",
					"fields": []interface{}{
						map[string]interface{}{"key": "applicant_name", "label": "申请人", "type": "text", "required": true},
						map[string]interface{}{"key": "applicant_department", "label": "Dept", "type": "select", "required": true, "options": []interface{}{
							map[string]interface{}{"label": "CEO Office", "value": "CEO Office"},
							map[string]interface{}{"label": "Sales", "value": "Sales"},
							map[string]interface{}{"label": "Engineering", "value": "Engineering"},
							map[string]interface{}{"label": "Marketing", "value": "Marketing"},
							map[string]interface{}{"label": "Logistics", "value": "Logistics"},
							map[string]interface{}{"label": "Finance", "value": "Finance"},
							map[string]interface{}{"label": "HR", "value": "HR"},
						}},
						map[string]interface{}{"key": "applicant_phone", "label": "Phone", "type": "text", "placeholder": "+65 8xxx xxxx"},
						map[string]interface{}{"key": "purpose", "label": "Purpose", "type": "text", "required": true, "placeholder": "e.g. Client visit, Meeting"},
						map[string]interface{}{"key": "passengers", "label": "Passengers", "type": "number", "default_value": 1},
						map[string]interface{}{"key": "start_time", "label": "Start Time", "type": "datetime", "required": true},
						map[string]interface{}{"key": "end_time", "label": "End Time", "type": "datetime", "required": true},
						map[string]interface{}{"key": "start_location", "label": "From", "type": "text", "required": true, "placeholder": "e.g. Raffles Place"},
						map[string]interface{}{"key": "end_location", "label": "To", "type": "text", "required": true},
						// 用车需求 — 选择后自动匹配车辆
						map[string]interface{}{"key": "requirements", "label": "Requirements", "type": "select", "placeholder": "Select requirements (optional)",
							"dynamic_options": map[string]interface{}{
								"api":       "/api/capability-tags",
								"label_key": "capability",
								"value_key": "capability",
							},
						},
						// 车辆选择 — 根据需求+时间段动态过滤可用车辆
						map[string]interface{}{"key": "vehicle_id", "label": "Assign Vehicle", "type": "select", "placeholder": "Auto-matched by requirements",
							"dynamic_options": map[string]interface{}{
								"api":        "/api/match-vehicles",
								"depends_on": []interface{}{"requirements", "start_time", "end_time", "passengers"},
								"label_key":  "plate_number",
								"value_key":  "id",
							},
						},
						map[string]interface{}{"key": "priority", "label": "Priority", "type": "select", "default_value": "Normal", "options": []interface{}{
							map[string]interface{}{"label": "Normal", "value": "Normal"},
							map[string]interface{}{"label": "Urgent", "value": "Urgent"},
							map[string]interface{}{"label": "Critical", "value": "Critical"},
						}},
						map[string]interface{}{"key": "notes", "label": "Notes", "type": "textarea"},
						map[string]interface{}{"key": "status", "label": "", "type": "text", "default_value": "Pending"},
					},
				},
			},
			// ---- 预定列表 ----
			map[string]interface{}{
				"id": "reservations_table", "type": "data_table",
				"config": map[string]interface{}{
					"table_name": "reservations",
					"columns": []interface{}{
						map[string]interface{}{"key": "reservation_no", "label": "Booking No.", "type": "text", "sortable": true},
						map[string]interface{}{"key": "applicant_name", "label": "申请人", "type": "text", "sortable": true},
						map[string]interface{}{"key": "applicant_department", "label": "Dept", "type": "text"},
						map[string]interface{}{"key": "vehicle_id", "label": "Vehicle", "type": "lookup", "lookup_table": "vehicles", "lookup_key": "id", "display_key": "plate_number"},
						map[string]interface{}{"key": "purpose", "label": "Purpose", "type": "text"},
						map[string]interface{}{"key": "start_location", "label": "From", "type": "text"},
						map[string]interface{}{"key": "end_location", "label": "To", "type": "text"},
						map[string]interface{}{"key": "passengers", "label": "Pax", "type": "number"},
						map[string]interface{}{"key": "priority", "label": "Priority", "type": "badge"},
						map[string]interface{}{"key": "status", "label": "Status", "type": "badge"},
						map[string]interface{}{"key": "start_time", "label": "Booking Time", "type": "date", "sortable": true},
					},
					"actions": []interface{}{"view", "edit", "delete"},
					"status_actions": []interface{}{
						map[string]interface{}{
							"label": "Approve", "from_status": []interface{}{"Pending"}, "to_status": "Approved",
							"status_column": "status", "color": "green", "confirm": true,
						},
						map[string]interface{}{
							"label": "Reject", "from_status": []interface{}{"Pending"}, "to_status": "Rejected",
							"status_column": "status", "color": "red", "confirm": true,
							"extra_fields": []interface{}{
								map[string]interface{}{"key": "reject_reason", "label": "Reject Reason", "required": true},
							},
						},
						map[string]interface{}{
							"label": "Start Trip", "from_status": []interface{}{"Approved"}, "to_status": "In Progress",
							"status_column": "status", "color": "blue", "confirm": true,
						},
						map[string]interface{}{
							"label": "Complete", "from_status": []interface{}{"In Progress"}, "to_status": "Completed",
							"status_column": "status", "color": "default", "confirm": true,
						},
						map[string]interface{}{
							"label": "Cancel", "from_status": []interface{}{"Pending", "Approved"}, "to_status": "Cancelled",
							"status_column": "status", "color": "default", "confirm": true,
						},
					},
					"search_enabled":  true,
					"search_key":      "reservation_no",
					"filters_enabled": true,
					"pagination":      true,
					"page_size":       15,
					"row_click_action": map[string]interface{}{
						"type":    "navigate",
						"page_id": "reservation_detail",
						"params":  map[string]interface{}{"record_id": "id"},
					},
				},
				"data_source": map[string]interface{}{
					"table":    "reservations",
					"order_by": []interface{}{map[string]interface{}{"column": "start_time", "direction": "DESC"}},
				},
			},
		},
	}
}

func buildReservationDetailPage() map[string]interface{} {
	return map[string]interface{}{
		"id":           "reservation_detail",
		"title":        "Reservation Detail",
		"route":        "/reservations/detail",
		"icon":         "FileText",
		"hidden":       true,
		"require_auth": false,
		"blocks": []interface{}{
			map[string]interface{}{
				"id": "reservation_detail_view", "type": "detail_view",
				"config": map[string]interface{}{
					"table_name":      "reservations",
					"record_id_param": "record_id",
					"fields": []interface{}{
						map[string]interface{}{"key": "reservation_no", "label": "Booking No."},
						map[string]interface{}{"key": "applicant_name", "label": "Applicant"},
						map[string]interface{}{"key": "applicant_department", "label": "Dept"},
						map[string]interface{}{"key": "applicant_phone", "label": "Phone"},
						map[string]interface{}{"key": "purpose", "label": "Purpose"},
						map[string]interface{}{"key": "passengers", "label": "Passengers"},
						map[string]interface{}{"key": "start_location", "label": "From"},
						map[string]interface{}{"key": "end_location", "label": "To"},
						map[string]interface{}{"key": "start_time", "label": "Start Time"},
						map[string]interface{}{"key": "end_time", "label": "End Time"},
						map[string]interface{}{"key": "vehicle_id", "label": "Assigned Vehicle"},
						map[string]interface{}{"key": "driver_id", "label": "Assigned Driver"},
						map[string]interface{}{"key": "priority", "label": "Priority"},
						map[string]interface{}{"key": "status", "label": "Status"},
						map[string]interface{}{"key": "approver", "label": "Approver"},
						map[string]interface{}{"key": "approved_at", "label": "Approved At"},
						map[string]interface{}{"key": "reject_reason", "label": "Reject Reason"},
						map[string]interface{}{"key": "actual_start_time", "label": "Actual Start"},
						map[string]interface{}{"key": "actual_end_time", "label": "Actual End"},
						map[string]interface{}{"key": "actual_mileage", "label": "Actual Mileage(km)"},
						map[string]interface{}{"key": "notes", "label": "Notes"},
						map[string]interface{}{"key": "created_at", "label": "Created At"},
					},
				},
				"data_source": map[string]interface{}{
					"table": "reservations",
				},
			},
		},
	}
}

func buildReservationCreatePage() map[string]interface{} {
	return map[string]interface{}{
		"id":     "reservation_create",
		"title":  "新建预定",
		"route":  "/reservations/create",
		"icon":   "PlusCircle",
		"hidden": true,
		"blocks": []interface{}{
			map[string]interface{}{
				"id": "reservation_form", "type": "form",
				"config": map[string]interface{}{
					"table_name":  "reservations",
					"title":       "新建用车预定",
					"description": "请填写用车预定申请信息",
					"fields": []interface{}{
						map[string]interface{}{"key": "reservation_no", "label": "Booking No.", "type": "text", "required": true, "placeholder": "如 RES20250215002"},
						map[string]interface{}{"key": "applicant_name", "label": "申请人", "type": "text", "required": true},
						map[string]interface{}{"key": "applicant_department", "label": "Dept", "type": "text", "required": true},
						map[string]interface{}{"key": "applicant_phone", "label": "Phone", "type": "text"},
						map[string]interface{}{"key": "purpose", "label": "Purpose", "type": "text", "required": true},
						map[string]interface{}{"key": "passengers", "label": "Passengers", "type": "number"},
						map[string]interface{}{"key": "start_time", "label": "Start Time", "type": "datetime", "required": true},
						map[string]interface{}{"key": "end_time", "label": "End Time", "type": "datetime", "required": true},
						map[string]interface{}{"key": "start_location", "label": "From", "type": "text", "required": true},
						map[string]interface{}{"key": "end_location", "label": "To", "type": "text", "required": true},
						map[string]interface{}{"key": "priority", "label": "Priority", "type": "text", "placeholder": "普通/紧急/特急"},
						map[string]interface{}{"key": "notes", "label": "Notes", "type": "text"},
					},
					"submit_label": "提交预定申请",
				},
				"data_source": map[string]interface{}{
					"table": "reservations",
				},
			},
		},
	}
}

// seedAgentChatSessions 创建模拟 Agent 对话会话
func seedAgentChatSessions(db *gorm.DB, wsID, ownerID uuid.UUID) error {
	// 先清理已有会话
	db.Table("what_reverse_agent_sessions").
		Where("workspace_id = ?", wsID.String()).
		Delete(map[string]interface{}{})

	now := time.Now()
	baseTime := now.Add(-2 * time.Hour) // 会话开始于 2 小时前

	sessionID := uuid.New()

	// 构建消息列表 — 模拟用户和 AI 的对话过程
	messages := []map[string]interface{}{
		{
			"role":      "user",
			"content":   "帮我创建一个智慧车队管理系统，需要管理车辆、驾驶员、行程、维修保养、加油、违章、保险、GPS定位和告警信息。",
			"timestamp": baseTime.Format(time.RFC3339),
		},
		{
			"role":      "assistant",
			"content":   "好的！我来帮你创建智慧车队管理系统。这是一个很全面的系统，我会按以下步骤进行：\n\n1. **设计数据库表结构** — 10 张核心数据表\n2. **创建数据表** — 在工作空间数据库中创建\n3. **填充示例数据** — 生成真实感的模拟数据\n4. **构建应用界面** — 使用 AppSchema v2.0 设计多页面应用\n\n让我先开始创建数据表...",
			"timestamp": baseTime.Add(5 * time.Second).Format(time.RFC3339),
			"metadata":  map[string]interface{}{"step": 1, "type": "thought"},
		},
		{
			"role":      "assistant",
			"content":   "正在创建车辆信息表 `vehicles`...",
			"timestamp": baseTime.Add(10 * time.Second).Format(time.RFC3339),
			"metadata":  map[string]interface{}{"step": 2, "type": "thought"},
		},
		{
			"role":      "assistant",
			"content":   "正在创建驾驶员信息表 `drivers`...",
			"timestamp": baseTime.Add(15 * time.Second).Format(time.RFC3339),
			"metadata":  map[string]interface{}{"step": 3, "type": "thought"},
		},
		{
			"role":      "assistant",
			"content":   "正在创建路线信息表 `routes`、行程记录表 `trips`、维修保养表 `maintenance_records`...",
			"timestamp": baseTime.Add(20 * time.Second).Format(time.RFC3339),
			"metadata":  map[string]interface{}{"step": 4, "type": "thought"},
		},
		{
			"role":      "assistant",
			"content":   "正在创建加油记录表 `fuel_records`、违章记录表 `violations`、保险记录表 `insurance_policies`...",
			"timestamp": baseTime.Add(25 * time.Second).Format(time.RFC3339),
			"metadata":  map[string]interface{}{"step": 5, "type": "thought"},
		},
		{
			"role":      "assistant",
			"content":   "正在创建 GPS 定位表 `gps_tracking`、告警信息表 `alerts`...",
			"timestamp": baseTime.Add(30 * time.Second).Format(time.RFC3339),
			"metadata":  map[string]interface{}{"step": 6, "type": "thought"},
		},
		{
			"role":      "assistant",
			"content":   "✅ 所有 10 张数据表创建完成！现在开始填充示例数据...\n\n- 🚗 20 辆车辆（含轿车、SUV、货车、客车、新能源）\n- 👤 18 名驾驶员\n- 🗺️ 10 条路线\n- 🚀 30 条行程记录\n- 🔧 15 条维修保养记录\n- ⛽ 25 条加油记录\n- 🚨 12 条违章记录\n- 🛡️ 20 条保险记录\n- 📍 50 条 GPS 定位记录\n- ⚠️ 18 条告警记录",
			"timestamp": baseTime.Add(60 * time.Second).Format(time.RFC3339),
			"metadata":  map[string]interface{}{"step": 7, "type": "thought"},
		},
		{
			"role":      "user",
			"content":   "数据已经创建好了，请帮我设计应用界面，我需要一个仪表盘和各个管理模块。",
			"timestamp": baseTime.Add(90 * time.Second).Format(time.RFC3339),
		},
		{
			"role":      "assistant",
			"content":   "好的！我来设计一个完整的车队管理应用界面。采用侧边栏导航，包含 10 个页面模块：\n\n**应用设计方案：**\n1. 📊 **仪表盘** — 车辆统计卡片 + 最近行程表 + 最新告警\n2. 🚗 **车辆管理** — 车辆列表，支持增删改查、搜索筛选\n3. 👤 **驾驶员** — 驾驶员列表，含评分和违章统计\n4. 📍 **行程记录** — 行程表格，按时间倒序\n5. 🌍 **路线管理** — 路线配置\n6. 🔧 **维修保养** — 维修工单管理\n7. ⛽ **加油记录** — 加油流水\n8. ⚠️ **违章记录** — 违章信息管理\n9. 💼 **保险管理** — 保单跟踪\n10. 🔔 **告警中心** — 告警统计卡片 + 告警列表\n\n现在开始生成 UI Schema...",
			"timestamp": baseTime.Add(95 * time.Second).Format(time.RFC3339),
			"metadata":  map[string]interface{}{"step": 8, "type": "thought"},
		},
		{
			"role":      "assistant",
			"content":   "✅ UI Schema 已生成并应用！应用已自动发布。\n\n**智慧车队管理系统已就绪！**\n\n你可以通过以下方式访问：\n- 📊 **Builder > Preview** 标签页预览完整应用\n- 🖥️ **Runtime** 页面查看独立运行的应用\n\n系统特性：\n- 🔒 数据完全隔离在工作空间独立数据库中\n- 📱 响应式设计，支持移动端\n- 🔍 支持搜索、筛选、排序\n- ✏️ 支持在线编辑数据\n- 📊 实时统计数据\n\n如需调整任何模块，随时告诉我！",
			"timestamp": baseTime.Add(120 * time.Second).Format(time.RFC3339),
			"metadata": map[string]interface{}{
				"step": 9, "type": "thought",
				"affected_resources": []interface{}{"ui_schema", "database"},
			},
		},
	}

	// 构建工具调用记录
	toolCalls := []map[string]interface{}{
		{
			"step":      1,
			"tool_name": "query_vm_data",
			"args":      json.RawMessage(`{"sql":"CREATE TABLE IF NOT EXISTS vehicles (id INTEGER PRIMARY KEY AUTOINCREMENT, plate_number TEXT NOT NULL UNIQUE, ...)"}`),
			"result":    map[string]interface{}{"success": true, "output": "表 vehicles 创建成功"},
			"timestamp": baseTime.Add(10 * time.Second).Format(time.RFC3339),
		},
		{
			"step":      2,
			"tool_name": "query_vm_data",
			"args":      json.RawMessage(`{"sql":"CREATE TABLE IF NOT EXISTS drivers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, ...)"}`),
			"result":    map[string]interface{}{"success": true, "output": "表 drivers 创建成功"},
			"timestamp": baseTime.Add(15 * time.Second).Format(time.RFC3339),
		},
		{
			"step":      3,
			"tool_name": "query_vm_data",
			"args":      json.RawMessage(`{"sql":"CREATE TABLE IF NOT EXISTS routes (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, ...)"}`),
			"result":    map[string]interface{}{"success": true, "output": "表 routes 创建成功"},
			"timestamp": baseTime.Add(18 * time.Second).Format(time.RFC3339),
		},
		{
			"step":      4,
			"tool_name": "query_vm_data",
			"args":      json.RawMessage(`{"sql":"CREATE TABLE IF NOT EXISTS trips (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_no TEXT NOT NULL UNIQUE, ...)"}`),
			"result":    map[string]interface{}{"success": true, "output": "表 trips 创建成功"},
			"timestamp": baseTime.Add(20 * time.Second).Format(time.RFC3339),
		},
		{
			"step":      5,
			"tool_name": "query_vm_data",
			"args":      json.RawMessage(`{"sql":"CREATE TABLE IF NOT EXISTS maintenance_records (...); CREATE TABLE IF NOT EXISTS fuel_records (...); ..."}`),
			"result":    map[string]interface{}{"success": true, "output": "剩余 6 张表创建成功"},
			"timestamp": baseTime.Add(30 * time.Second).Format(time.RFC3339),
		},
		{
			"step":      6,
			"tool_name": "insert_data",
			"args":      json.RawMessage(`{"tables":"vehicles,drivers,routes,trips,maintenance_records,fuel_records,violations,insurance_policies,gps_tracking,alerts","total_rows":218}`),
			"result":    map[string]interface{}{"success": true, "output": "共插入 218 条示例数据"},
			"timestamp": baseTime.Add(60 * time.Second).Format(time.RFC3339),
		},
		{
			"step":      7,
			"tool_name": "modify_ui_schema",
			"args":      json.RawMessage(`{"app_name":"智慧车队管理系统","pages":10,"navigation":"sidebar"}`),
			"result":    map[string]interface{}{"success": true, "output": "UI Schema 已生成并应用 (10 pages)"},
			"timestamp": baseTime.Add(100 * time.Second).Format(time.RFC3339),
		},
		{
			"step":      8,
			"tool_name": "publish_app",
			"args":      json.RawMessage(`{"workspace_id":"` + wsID.String() + `"}`),
			"result":    map[string]interface{}{"success": true, "output": "应用已发布"},
			"timestamp": baseTime.Add(115 * time.Second).Format(time.RFC3339),
		},
	}

	messagesJSON, err := json.Marshal(map[string]interface{}{"data": messages})
	if err != nil {
		return fmt.Errorf("序列化会话1消息: %w", err)
	}
	toolCallsJSON, err := json.Marshal(map[string]interface{}{"data": toolCalls})
	if err != nil {
		return fmt.Errorf("序列化会话1工具调用: %w", err)
	}

	if err := db.Table("what_reverse_agent_sessions").Create(map[string]interface{}{
		"id":             sessionID.String(),
		"workspace_id":   wsID.String(),
		"user_id":        ownerID.String(),
		"status":         "completed",
		"messages":       string(messagesJSON),
		"tool_calls":     string(toolCallsJSON),
		"pending_action": nil,
		"created_at":     baseTime,
		"updated_at":     baseTime.Add(120 * time.Second),
	}).Error; err != nil {
		return fmt.Errorf("创建会话: %w", err)
	}
	fmt.Printf("  💬 已创建 Agent 会话 1 — 系统搭建 (ID: %s)\n", sessionID)

	// ===== 第二轮对话: 数据查询与分析 =====
	session2ID := uuid.New()
	baseTime2 := now.Add(-30 * time.Minute)

	messages2 := []map[string]interface{}{
		{
			"role":      "user",
			"content":   "帮我查看一下当前车队的运营情况，有多少车辆在线？有没有待处理的告警？",
			"timestamp": baseTime2.Format(time.RFC3339),
		},
		{
			"role":      "assistant",
			"content":   "我来帮你查看当前车队运营状况。\n\n让我查询各项数据...",
			"timestamp": baseTime2.Add(3 * time.Second).Format(time.RFC3339),
			"metadata":  map[string]interface{}{"step": 1, "type": "thought"},
		},
		{
			"role":      "assistant",
			"content":   "📊 **车队运营概况**\n\n**车辆状态统计（共 20 辆）：**\n- 🟢 在线：8 辆（京A88001/比亚迪汉EV、京A88002/Model Y、京A88003/帕萨特、京B66005/H6、京B66006/理想L7、京C55007/欧马可、京A88015/ES6、京A88016/P7）\n- 🔵 离线：5 辆（京A88004/凯美瑞、京D77009/班车、京D77010/大客车、京A88012/奔驰E300L、京B66013/MG ONE）\n- 🟡 维修中：3 辆（京C55008/顺达、京A88011/秦PLUS、京C55014/奥铃CTS）\n- 🔴 已报废：2 辆（京A88019/雅阁、京A88020/极氪001）\n- ⚪ 停运：2 辆（京B66017/UNI-V、京C55018/EV18）\n\n**告警情况：**\n- ❌ 未处理：6 条\n- ⏳ 处理中：1 条\n- ✅ 已处理：7 条\n- ⚫ 已忽略：4 条\n\n**重点告警：**\n1. 🚨 **紧急** — 京D77009 班车驾驶员疲劳驾驶\n2. ⚠️ **高** — 京C55007 货车超速（82km/h，限速60）\n3. ⚠️ **高** — 京D77010 大客车越出电子围栏\n4. ⚠️ **高** — 京A88019 年检即将到期\n5. ⚠️ **高** — 京A88012 保险即将到期\n\n建议优先处理紧急和高等级告警，确保车辆和驾驶员安全。",
			"timestamp": baseTime2.Add(8 * time.Second).Format(time.RFC3339),
			"metadata":  map[string]interface{}{"step": 2, "type": "thought"},
		},
		{
			"role":      "user",
			"content":   "近期的加油费用情况怎么样？哪些车辆油耗比较高？",
			"timestamp": baseTime2.Add(30 * time.Second).Format(time.RFC3339),
		},
		{
			"role":      "assistant",
			"content":   "📊 **近期加油费用分析**\n\n**总体费用：**\n- 燃油记录：25 条 + 充电记录：10 条\n- 涵盖燃料类型：92号汽油、95号汽油、0号柴油、充电\n\n**高油耗车辆 TOP 5：**\n1. 🚌 京D77010（金龙大客车49座）— 0号柴油，累计 490L，费用 ¥3,706\n2. 🚛 京C55007（福田欧马可货车）— 0号柴油，累计 293L，费用 ¥2,219\n3. 🚌 京D77009（宇通班车33座）— 0号柴油，累计 315L，费用 ¥2,378\n4. 🚗 京A88003（大众帕萨特）— 95号汽油，累计 161L，费用 ¥1,307\n5. 🚛 京C55008（江铃顺达货车）— 0号柴油，累计 175L，费用 ¥1,323\n\n**新能源车辆充电：**\n- 比亚迪汉EV、特斯拉Model Y、蔚来ES6、小鹏P7 等 6 辆电动车\n- 平均每次充电费用约 ¥70-130\n\n**建议：**\n- 货车和客车柴油占总费用 65% 以上\n- 可优化配送路线减少空驶\n- 电动车充电成本仅为燃油车的 1/5，建议加速替换",
			"timestamp": baseTime2.Add(35 * time.Second).Format(time.RFC3339),
			"metadata":  map[string]interface{}{"step": 3, "type": "thought"},
		},
		{
			"role":      "user",
			"content":   "好的，帮我把告警中心页面加一个按严重程度的饼图统计。",
			"timestamp": baseTime2.Add(60 * time.Second).Format(time.RFC3339),
		},
		{
			"role":      "assistant",
			"content":   "好的！我来给告警中心页面添加一个按严重程度分布的饼图。\n\n正在更新 UI Schema...",
			"timestamp": baseTime2.Add(63 * time.Second).Format(time.RFC3339),
			"metadata":  map[string]interface{}{"step": 4, "type": "thought"},
		},
		{
			"role":      "assistant",
			"content":   "✅ 已在告警中心页面添加了告警严重程度饼图！\n\n图表展示了 紧急/高/中/低 四个等级的告警分布。你可以在告警中心页面顶部看到这个新的统计图表。\n\n还需要其他修改吗？",
			"timestamp": baseTime2.Add(70 * time.Second).Format(time.RFC3339),
			"metadata": map[string]interface{}{
				"step": 5, "type": "thought",
				"affected_resources": []interface{}{"ui_schema"},
			},
		},
	}

	toolCalls2 := []map[string]interface{}{
		{
			"step":      1,
			"tool_name": "get_workspace_info",
			"args":      json.RawMessage(`{"workspace_id":"` + wsID.String() + `","include_tables":true}`),
			"result":    map[string]interface{}{"success": true, "output": "工作空间信息获取成功，包含 10 张数据表"},
			"timestamp": baseTime2.Add(3 * time.Second).Format(time.RFC3339),
		},
		{
			"step":      2,
			"tool_name": "query_vm_data",
			"args":      json.RawMessage(`{"sql":"SELECT status, COUNT(*) as count FROM vehicles GROUP BY status"}`),
			"result":    map[string]interface{}{"success": true, "output": "查询完成：在线8, 离线5, 维修中3, 已报废2, 停运2"},
			"timestamp": baseTime2.Add(5 * time.Second).Format(time.RFC3339),
		},
		{
			"step":      3,
			"tool_name": "query_vm_data",
			"args":      json.RawMessage(`{"sql":"SELECT status, COUNT(*) as count FROM alerts GROUP BY status"}`),
			"result":    map[string]interface{}{"success": true, "output": "查询完成：未处理6, 处理中1, 已处理7, 已忽略4"},
			"timestamp": baseTime2.Add(6 * time.Second).Format(time.RFC3339),
		},
		{
			"step":      4,
			"tool_name": "modify_ui_schema",
			"args":      json.RawMessage(`{"action":"add_block","page_id":"alerts","block_type":"chart","config":{"chart_type":"pie","title":"告警严重程度分布"}}`),
			"result":    map[string]interface{}{"success": true, "output": "已添加饼图到告警中心页面"},
			"timestamp": baseTime2.Add(65 * time.Second).Format(time.RFC3339),
		},
	}

	messages2JSON, err := json.Marshal(map[string]interface{}{"data": messages2})
	if err != nil {
		return fmt.Errorf("序列化会话2消息: %w", err)
	}
	toolCalls2JSON, err := json.Marshal(map[string]interface{}{"data": toolCalls2})
	if err != nil {
		return fmt.Errorf("序列化会话2工具调用: %w", err)
	}

	if err := db.Table("what_reverse_agent_sessions").Create(map[string]interface{}{
		"id":             session2ID.String(),
		"workspace_id":   wsID.String(),
		"user_id":        ownerID.String(),
		"status":         "completed",
		"messages":       string(messages2JSON),
		"tool_calls":     string(toolCalls2JSON),
		"pending_action": nil,
		"created_at":     baseTime2,
		"updated_at":     baseTime2.Add(70 * time.Second),
	}).Error; err != nil {
		return fmt.Errorf("创建会话2: %w", err)
	}
	fmt.Printf("  💬 已创建 Agent 会话 2 — 运营分析 (ID: %s)\n", session2ID)

	// ====== 会话 3: 车辆维修与保养管理 ======
	session3ID := uuid.New()
	baseTime3 := now.Add(-15 * time.Minute)

	messages3 := []map[string]interface{}{
		{
			"role": "user", "content": "帮我看看哪些车辆快到保养周期了，需要安排维修保养的。",
			"timestamp": baseTime3.Format(time.RFC3339),
		},
		{
			"role": "assistant", "timestamp": baseTime3.Add(4 * time.Second).Format(time.RFC3339),
			"content":  "我来查询车辆的保养情况。让我检查维修记录和里程数据...",
			"metadata": map[string]interface{}{"step": 1, "type": "thought"},
		},
		{
			"role": "assistant", "timestamp": baseTime3.Add(12 * time.Second).Format(time.RFC3339),
			"content":  "🔧 **车辆保养提醒**\n\n**需要立即保养的车辆（按里程）：**\n1. 🚗 京A88003（帕萨特）— 里程 67,800 km，上次保养在 65,000 km，已超 2,800 km\n2. 🚗 京A88004（凯美瑞）— 里程 55,200 km，上次保养在 50,000 km，已超 5,200 km\n3. 🚛 京C55007（欧马可货车）— 里程 125,000 km，上次保养在 120,000 km，已超 5,000 km\n\n**即将到期的年检：**\n- 京A88003 — 年检到期日：2024-08-10（已过期）\n- 京C55008 — 年检到期日：2024-01-15（已过期）\n\n**保险即将到期：**\n- 京A88001 — 交强险到期：2025-03-15（待续保）\n- 京A88012 — 交强险到期：2025-04-20\n\n**建议：**\n1. 优先安排京A88003和京A88004的常规保养\n2. 尽快预约京A88003年检\n3. 提前续保京A88001交强险",
			"metadata": map[string]interface{}{"step": 2, "type": "thought"},
		},
		{
			"role": "user", "content": "帮我给京A88003创建一个保养工单，安排到明天。",
			"timestamp": baseTime3.Add(30 * time.Second).Format(time.RFC3339),
		},
		{
			"role": "assistant", "timestamp": baseTime3.Add(33 * time.Second).Format(time.RFC3339),
			"content":  "好的，我来为京A88003创建保养工单...",
			"metadata": map[string]interface{}{"step": 3, "type": "thought"},
		},
		{
			"role": "assistant", "timestamp": baseTime3.Add(40 * time.Second).Format(time.RFC3339),
			"content": "✅ 保养工单已创建！\n\n**工单详情：**\n- 🔧 工单号：MT-2026-016\n- 🚗 车辆：京A88003（帕萨特）\n- 📋 类型：常规保养\n- 🏪 服务商：北京大众4S店\n- 📅 预约日期：明天\n- 💰 预估费用：￥1,580\n- 📝 保养项目：机油更换、机滤更换、空滤检查、刹车片检查、轮胎检查\n\n工单已自动分配给车辆管理员。你可以在「维修保养」页面查看和跟踪进度。\n\n还需要为其他车辆安排保养吗？",
			"metadata": map[string]interface{}{
				"step": 4, "type": "thought",
				"affected_resources": []interface{}{"database"},
			},
		},
		{
			"role": "user", "content": "再帮我看看仪表盘上的统计数据准不准确。",
			"timestamp": baseTime3.Add(60 * time.Second).Format(time.RFC3339),
		},
		{
			"role": "assistant", "timestamp": baseTime3.Add(65 * time.Second).Format(time.RFC3339),
			"content":  "📊 **仪表盘数据校验**\n\n我对比了数据库实际数据和仪表盘显示：\n\n| 指标 | 数据库实际值 | 仪表盘显示 | 状态 |\n|------|-----------|----------|------|\n| 车辆总数 | 20 | 20 | ✅ 正确 |\n| 在线车辆 | 8 | 8 | ✅ 正确 |\n| 驾驶员总数 | 18 | 18 | ✅ 正确 |\n| 待处理告警 | 6 | 6 | ✅ 正确 |\n\n**图表验证：**\n- 车辆状态饼图：在线8、离线5、维修中3、已报废2、停运2 → ✅ 与数据一致\n- 车辆类型饼图：轿车5、SUV4、货车4、客车2、新能源5 → ✅ 与数据一致\n\n所有统计数据均准确无误！仪表盘实时反映数据库最新状态。",
			"metadata": map[string]interface{}{"step": 5, "type": "thought"},
		},
	}

	toolCalls3 := []map[string]interface{}{
		{
			"step": 1, "tool_name": "query_vm_data",
			"args":      json.RawMessage(`{"sql":"SELECT v.plate_number, v.brand, v.model, v.mileage, MAX(m.start_date) as last_maintenance FROM vehicles v LEFT JOIN maintenance_records m ON v.id = m.vehicle_id GROUP BY v.id ORDER BY v.mileage DESC"}`),
			"result":    map[string]interface{}{"success": true, "output": "查询完成：返回 20 辆车辆的保养信息"},
			"timestamp": baseTime3.Add(4 * time.Second).Format(time.RFC3339),
		},
		{
			"step": 2, "tool_name": "query_vm_data",
			"args":      json.RawMessage(`{"sql":"SELECT * FROM insurance_policies WHERE end_date < date('now', '+30 day') AND status = '有效' ORDER BY end_date ASC"}`),
			"result":    map[string]interface{}{"success": true, "output": "查询完成：2 条保险即将到期"},
			"timestamp": baseTime3.Add(8 * time.Second).Format(time.RFC3339),
		},
		{
			"step": 3, "tool_name": "insert_data",
			"args":      json.RawMessage(`{"table":"maintenance_records","data":{"record_no":"MT-2026-016","vehicle_id":3,"maintenance_type":"常规保养","service_provider":"北京大众4S店","cost":1580,"status":"待处理","description":"机油更换、机滤更换、空滤检查、刹车片检查、轮胎检查"}}`),
			"result":    map[string]interface{}{"success": true, "output": "已创建保养工单 MT-2026-016"},
			"timestamp": baseTime3.Add(35 * time.Second).Format(time.RFC3339),
		},
		{
			"step": 4, "tool_name": "query_vm_data",
			"args":      json.RawMessage(`{"sql":"SELECT (SELECT COUNT(*) FROM vehicles) as total_vehicles, (SELECT COUNT(*) FROM vehicles WHERE status='在线') as online_vehicles, (SELECT COUNT(*) FROM drivers) as total_drivers, (SELECT COUNT(*) FROM alerts WHERE status='未处理') as pending_alerts"}`),
			"result":    map[string]interface{}{"success": true, "output": "车辆20, 在线8, 驾驶员18, 待处理告警6"},
			"timestamp": baseTime3.Add(62 * time.Second).Format(time.RFC3339),
		},
	}

	messages3JSON, err := json.Marshal(map[string]interface{}{"data": messages3})
	if err != nil {
		return fmt.Errorf("序列化会话3消息: %w", err)
	}
	toolCalls3JSON, err := json.Marshal(map[string]interface{}{"data": toolCalls3})
	if err != nil {
		return fmt.Errorf("序列化会话3工具调用: %w", err)
	}

	if err := db.Table("what_reverse_agent_sessions").Create(map[string]interface{}{
		"id":             session3ID.String(),
		"workspace_id":   wsID.String(),
		"user_id":        ownerID.String(),
		"status":         "completed",
		"messages":       string(messages3JSON),
		"tool_calls":     string(toolCalls3JSON),
		"pending_action": nil,
		"created_at":     baseTime3,
		"updated_at":     baseTime3.Add(65 * time.Second),
	}).Error; err != nil {
		return fmt.Errorf("创建会话3: %w", err)
	}
	fmt.Printf("  💬 已创建 Agent 会话 3 — 维修保养管理 (ID: %s)\n", session3ID)

	return nil
}

// seedSlugAndAccess 设置 slug 别名和公开访问策略
func seedSlugAndAccess(db *gorm.DB, wsID uuid.UUID) error {
	// 添加 slug 别名 "fleet"
	var aliasCount int64
	db.Table("what_reverse_workspace_slug_aliases").
		Where("slug = ?", "fleet").
		Count(&aliasCount)

	if aliasCount == 0 {
		aliasID := uuid.New()
		if err := db.Table("what_reverse_workspace_slug_aliases").Create(map[string]interface{}{
			"id":           aliasID.String(),
			"workspace_id": wsID.String(),
			"slug":         "fleet",
			"created_at":   time.Now(),
		}).Error; err != nil {
			return fmt.Errorf("创建 slug 别名: %w", err)
		}
		fmt.Println("  🔗 已创建 slug 别名: fleet")
	} else {
		fmt.Println("  🔗 slug 别名 fleet 已存在")
	}

	// 设置 workspace 公开访问（允许未登录用户通过 runtime 访问）
	if err := db.Table("what_reverse_workspaces").
		Where("id = ?", wsID.String()).
		Updates(map[string]interface{}{
			"access_mode": "public_anonymous",
			"updated_at":  time.Now(),
		}).Error; err != nil {
		return fmt.Errorf("更新访问策略: %w", err)
	}
	fmt.Println("  🌐 已设置公开访问模式")

	return nil
}

// buildFleetLogicCode 构建车队管理系统的 JS 业务逻辑代码
func buildFleetLogicCode() string {
	return `
exports.routes = {
  // 获取所有可用能力标签（用于下拉选择）
  "GET /capability-tags": function(ctx) {
    var tags = db.query(
      "SELECT DISTINCT capability, COUNT(*) as vehicle_count " +
      "FROM vehicle_capabilities GROUP BY capability ORDER BY vehicle_count DESC"
    );
    return tags;
  },

  // 根据需求匹配可用车辆
  "POST /match-vehicles": function(ctx) {
    var requirements = ctx.body.requirements || [];
    var startTime = ctx.body.start_time || "";
    var endTime = ctx.body.end_time || "";
    var passengers = ctx.body.passengers || 1;

    // 基础条件：车辆在线
    var baseWhere = "v.status = 'Online'";

    // 排除时间段内已被预定的车辆
    var excludeBooked = "";
    if (startTime && endTime) {
      excludeBooked = " AND v.id NOT IN (" +
        "SELECT vehicle_id FROM reservations " +
        "WHERE vehicle_id IS NOT NULL " +
        "AND status IN ('Approved','In Progress') " +
        "AND start_time < '" + endTime + "' AND end_time > '" + startTime + "'" +
        ")";
    }

    // 座位数过滤
    var seatFilter = "";
    if (passengers > 1) {
      seatFilter = " AND v.seat_count >= " + passengers;
    }

    if (!requirements || requirements.length === 0) {
      // 无特殊需求 → 返回所有空闲车辆
      var all = db.query(
        "SELECT v.id, v.plate_number, v.brand, v.model, v.vehicle_type, " +
        "v.seat_count, v.status, v.fuel_type, v.department " +
        "FROM vehicles v WHERE " + baseWhere + excludeBooked + seatFilter +
        " ORDER BY v.id"
      );
      // 附加每辆车的能力标签
      for (var i = 0; i < all.length; i++) {
        var caps = db.query(
          "SELECT capability FROM vehicle_capabilities WHERE vehicle_id = ?",
          [all[i].id]
        );
        all[i].capabilities = caps.map(function(c) { return c.capability; });
      }
      return { status: 200, body: { vehicles: all, match_type: "all_available", total: all.length } };
    }

    // 有特殊需求 → 找同时满足所有需求的车辆
    var placeholders = requirements.map(function() { return "?"; }).join(",");
    var params = requirements.slice();
    if (startTime && endTime) {
      // 不能在 SQL 里直接拼接已排除的子查询参数，改用子查询
    }

    var matched = db.query(
      "SELECT v.id, v.plate_number, v.brand, v.model, v.vehicle_type, " +
      "v.seat_count, v.status, v.fuel_type, v.department, " +
      "COUNT(DISTINCT vc.capability) as matched_count " +
      "FROM vehicles v " +
      "JOIN vehicle_capabilities vc ON v.id = vc.vehicle_id " +
      "WHERE vc.capability IN (" + placeholders + ") " +
      "AND " + baseWhere + excludeBooked + seatFilter +
      " GROUP BY v.id " +
      "HAVING matched_count = ?",
      params.concat([requirements.length])
    );

    // 附加每辆车的全部能力标签
    for (var j = 0; j < matched.length; j++) {
      var caps2 = db.query(
        "SELECT capability FROM vehicle_capabilities WHERE vehicle_id = ?",
        [matched[j].id]
      );
      matched[j].capabilities = caps2.map(function(c) { return c.capability; });
    }

    return {
      status: 200,
      body: {
        vehicles: matched,
        match_type: "capability_matched",
        required: requirements,
        total: matched.length
      }
    };
  },

  // 预定校验 API
  "POST /validate-reservation": function(ctx) {
    var vehicleId = ctx.body.vehicle_id;
    var startTime = ctx.body.start_time;
    var endTime = ctx.body.end_time;

    if (!startTime || !endTime) {
      return { status: 200, body: { valid: true } };
    }

    if (!vehicleId) {
      return { status: 200, body: { valid: true } };
    }

    // 检查时间冲突
    var conflicts = db.query(
      "SELECT reservation_no, purpose, start_time, end_time FROM reservations " +
      "WHERE vehicle_id = ? AND status IN ('Approved','In Progress') " +
      "AND start_time < ? AND end_time > ?",
      [vehicleId, endTime, startTime]
    );

    if (conflicts.length > 0) {
      var conflictInfo = conflicts.map(function(c) {
        return c.reservation_no + "(" + c.purpose + ")";
      }).join(", ");
      return {
        status: 200,
        body: {
          valid: false,
          error: "Vehicle already booked during this period: " + conflictInfo
        }
      };
    }

    // 检查车辆状态
    var vehicle = db.queryOne(
      "SELECT status, plate_number FROM vehicles WHERE id = ?",
      [vehicleId]
    );
    if (vehicle && vehicle.status !== 'Online') {
      return {
        status: 200,
        body: {
          valid: false,
          error: "Vehicle " + vehicle.plate_number + " is currently '" + vehicle.status + "', cannot be reserved"
        }
      };
    }

    return { status: 200, body: { valid: true } };
  },

  // 获取车辆的能力列表
  "GET /vehicles/:id/capabilities": function(ctx) {
    var caps = db.query(
      "SELECT capability, description FROM vehicle_capabilities WHERE vehicle_id = ?",
      [ctx.params.id]
    );
    return caps;
  },

  // before-insert hook：预定自动生成编号
  "POST /hooks/before-insert/reservations": function(ctx) {
    var data = ctx.body.data || {};

    // 自动生成预定编号（如果未提供）
    if (!data.reservation_no || data.reservation_no === "") {
      var now = new Date();
      var dateStr = now.getFullYear().toString() +
        ("0" + (now.getMonth() + 1)).slice(-2) +
        ("0" + now.getDate()).slice(-2);
      var countResult = db.queryOne(
        "SELECT COUNT(*) as cnt FROM reservations WHERE reservation_no LIKE ?",
        ["RES" + dateStr + "%"]
      );
      var seq = (countResult ? countResult.cnt : 0) + 1;
      data.reservation_no = "RES" + dateStr + ("000" + seq).slice(-3);
    }

    // 设置默认状态
    if (!data.status) {
      data.status = "Pending";
    }

    return { allow: true, data: data };
  }
};
`
}
