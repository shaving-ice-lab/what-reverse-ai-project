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

	fmt.Println("🚀 智慧车队管理系统 — 数据库初始化与数据填充")
	fmt.Println("================================================")

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
	fmt.Println("✅ 主数据库连接成功")

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
	fmt.Println("✅ 车队管理表结构创建完成")

	// 5. 填充数据
	if err := seedFleetData(ctx, wsDB); err != nil {
		fmt.Printf("❌ 数据填充失败: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ 车队管理数据填充完成")

	// 6. 查询 workspace owner_user_id
	ownerID, err := getWorkspaceOwner(db, wsID)
	if err != nil {
		fmt.Printf("❌ 无法获取工作空间所有者: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("✅ 工作空间所有者: %s\n", ownerID)

	// 7. 创建 UI Schema (AppSchema v2.0) + 版本 + 发布
	if err := seedUISchemaAndPublish(db, wsID, ownerID); err != nil {
		fmt.Printf("❌ UI Schema 创建失败: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ UI Schema 创建并发布完成")

	// 8. 创建 Mock Agent Chat 会话
	if err := seedAgentChatSessions(db, wsID, ownerID); err != nil {
		fmt.Printf("❌ Agent Chat 会话创建失败: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ Agent Chat 会话创建完成")

	// 9. 设置 slug 别名 + 公开访问
	if err := seedSlugAndAccess(db, wsID); err != nil {
		fmt.Printf("❌ Slug/访问配置失败: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ Slug 别名和访问策略配置完成")

	// 10. 获取 workspace slug
	var wsSlug string
	db.Table("what_reverse_workspaces").Where("id = ?", wsID.String()).Pluck("slug", &wsSlug)

	fmt.Println("================================================")
	fmt.Println("🎉 智慧车队管理系统初始化完成！")
	fmt.Println("  📱 访问 Agent 页面查看对话历史")
	fmt.Println("  📊 访问 Database 页面查看数据表")
	fmt.Println("  🖥️  访问 Builder > Preview 查看应用")
	fmt.Printf("  🌐 Runtime: http://localhost:3011/runtime/%s\n", wsSlug)
	fmt.Println("  🌐 Runtime (别名): http://localhost:3011/runtime/fleet")
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
		"name":                "智慧车队管理系统",
		"slug":                "fleet-" + wsID.String()[:8],
		"icon":                "🚛",
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
	vehicle_type TEXT NOT NULL DEFAULT '轿车',
	color TEXT,
	engine_no TEXT,
	purchase_date TEXT,
	purchase_price REAL,
	mileage INTEGER DEFAULT 0,
	fuel_type TEXT DEFAULT '汽油',
	fuel_tank_capacity REAL,
	seat_count INTEGER DEFAULT 5,
	status TEXT NOT NULL DEFAULT '在线',
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
	gender TEXT DEFAULT '男',
	phone TEXT NOT NULL,
	id_card TEXT,
	license_no TEXT,
	license_type TEXT DEFAULT 'C1',
	license_expire_date TEXT,
	hire_date TEXT,
	department TEXT,
	status TEXT NOT NULL DEFAULT '在岗',
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
	route_type TEXT DEFAULT '市内',
	status TEXT DEFAULT '启用',
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
	status TEXT DEFAULT '进行中',
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
	status TEXT DEFAULT '待处理',
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
	payment_method TEXT DEFAULT '公司卡',
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
	status TEXT DEFAULT '待处理',
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
	status TEXT DEFAULT '有效',
	claim_count INTEGER DEFAULT 0,
	total_claim_amount REAL DEFAULT 0,
	agent_name TEXT,
	agent_phone TEXT,
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
	status TEXT DEFAULT '行驶',
	recorded_at TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`,
		`CREATE TABLE IF NOT EXISTS alerts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	vehicle_id INTEGER,
	driver_id INTEGER,
	alert_type TEXT NOT NULL,
	severity TEXT DEFAULT '中',
	title TEXT NOT NULL,
	description TEXT,
	location TEXT,
	latitude REAL,
	longitude REAL,
	speed REAL,
	threshold_value TEXT,
	actual_value TEXT,
	status TEXT DEFAULT '未处理',
	handler TEXT,
	handled_at TEXT,
	handle_result TEXT,
	alert_time TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	deleted_at TEXT
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
		`CREATE INDEX IF NOT EXISTS idx_gps_vehicle ON gps_tracking(vehicle_id)`,
		`CREATE INDEX IF NOT EXISTS idx_gps_recorded_at ON gps_tracking(recorded_at)`,
		`CREATE INDEX IF NOT EXISTS idx_gps_vehicle_time ON gps_tracking(vehicle_id, recorded_at)`,
		`CREATE INDEX IF NOT EXISTS idx_alerts_vehicle ON alerts(vehicle_id)`,
		`CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)`,
		`CREATE INDEX IF NOT EXISTS idx_alerts_alert_time ON alerts(alert_time)`,
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
		"DELETE FROM gps_tracking",
		"DELETE FROM alerts",
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

	// ---- 1. 车辆 (20辆) ----
	vehicleSQL := `
INSERT INTO vehicles (id, plate_number, vin, brand, model, vehicle_type, color, engine_no, purchase_date, purchase_price, mileage, fuel_type, fuel_tank_capacity, seat_count, status, department, gps_device_id, annual_inspection_date, insurance_expire_date, notes) VALUES
(1, '京A88001', 'LVHRU5849N5012345', '比亚迪', '汉EV', '新能源', '极光白', NULL, '2023-03-15', 259800.00, 42580, '电动', NULL, 5, '在线', '总裁办', 'GPS-001', '2025-03-15', '2025-03-15', '总裁专车'),
(2, '京A88002', 'LVHRU5849N5012346', '特斯拉', 'Model Y', '新能源', '珍珠白', NULL, '2023-05-20', 299900.00, 38200, '电动', NULL, 5, '在线', '销售部', 'GPS-002', '2025-05-20', '2025-05-20', '销售总监用车'),
(3, '京A88003', 'LSVAU2180N2123456', '大众', '帕萨特', '轿车', '星空黑', 'EA888-301', '2022-08-10', 218900.00, 67800, '汽油', 66.00, 5, '在线', '行政部', 'GPS-003', '2024-08-10', '2025-08-10', '商务接待用车'),
(4, '京A88004', 'LSVAU2180N2123457', '丰田', '凯美瑞', '轿车', '铂金白', '2.5L-A25A', '2022-06-15', 179800.00, 55200, '汽油', 60.00, 5, '离线', '市场部', 'GPS-004', '2024-06-15', '2025-06-15', '外出未归'),
(5, '京B66005', 'LGWEF4A47NF012345', '哈弗', 'H6', 'SUV', '赤焰红', 'GW4C20', '2022-11-01', 139900.00, 48600, '汽油', 58.00, 5, '在线', '技术部', 'GPS-005', '2024-11-01', '2025-11-01', NULL),
(6, '京B66006', 'LGWEF4A47NF012346', '理想', 'L7', 'SUV', '银灰色', NULL, '2023-07-10', 339800.00, 28900, '混合动力', 65.00, 6, '在线', '产品部', 'GPS-006', '2025-07-10', '2025-07-10', '增程式混动'),
(7, '京C55007', 'LFV2A2157N3012345', '福田', '欧马可', '货车', '蓝色', 'ISF3.8', '2021-09-20', 168000.00, 125000, '柴油', 120.00, 3, '在线', '物流部', 'GPS-007', '2024-09-20', '2025-09-20', '4.2米厢式货车'),
(8, '京C55008', 'LFV2A2157N3012346', '江铃', '顺达', '货车', '白色', 'JX493ZLQ5', '2022-01-15', 128000.00, 98000, '柴油', 100.00, 3, '维修中', '物流部', 'GPS-008', '2024-01-15', '2025-01-15', '变速箱异响维修中'),
(9, '京D77009', 'LNBSCCAK5ND012345', '宇通', 'ZK6826', '客车', '白色', 'YC4FA130', '2021-05-10', 380000.00, 180000, '柴油', 200.00, 33, '离线', '行政部', 'GPS-009', '2024-05-10', '2025-05-10', '33座通勤班车，周末停运'),
(10, '京D77010', 'LNBSCCAK5ND012346', '金龙', 'XMQ6127', '客车', '银色', 'ISLe340', '2022-03-01', 520000.00, 145000, '柴油', 300.00, 49, '离线', '行政部', 'GPS-010', '2024-03-01', '2025-03-01', '49座大客车，周末停运'),
(11, '京A88011', 'LVSHCFAE5NF012345', '比亚迪', '秦PLUS DM-i', '新能源', '时光灰', NULL, '2023-09-01', 139800.00, 22000, '混合动力', 48.00, 5, '维修中', '人力资源部', 'GPS-011', '2025-09-01', '2025-09-01', '电池检测中'),
(12, '京A88012', 'LVSHCFAE5NF012346', '奔驰', 'E300L', '轿车', '曜岩黑', 'M264-920', '2022-04-20', 498000.00, 62000, '汽油', 66.00, 5, '离线', '财务部', 'GPS-012', '2024-04-20', '2025-04-20', '财务总监出差中'),
(13, '京B66013', 'LSJA24U37NF012345', 'MG', 'MG ONE', 'SUV', '曜影黑', '15E4E', '2023-01-10', 129900.00, 32000, '汽油', 50.00, 5, '离线', '行政部', 'GPS-013', '2025-01-10', '2025-01-10', 'GPS信号异常'),
(14, '京C55014', 'LFV2A2157N3012347', '福田', '奥铃CTS', '货车', '蓝色', 'ISF2.8', '2022-07-01', 145000.00, 88000, '柴油', 100.00, 3, '维修中', '物流部', 'GPS-014', '2024-07-01', '2025-07-01', '发动机故障维修中'),
(15, '京A88015', 'LVHRU5849N5012347', '蔚来', 'ES6', 'SUV', '星云紫', NULL, '2023-11-15', 368000.00, 15000, '电动', NULL, 5, '在线', '研发部', 'GPS-015', '2025-11-15', '2025-11-15', NULL),
(16, '京A88016', 'LVHRU5849N5012348', '小鹏', 'P7', '新能源', '天辰灰', NULL, '2023-08-20', 249900.00, 20000, '电动', NULL, 5, '在线', '运营部', 'GPS-016', '2025-08-20', '2025-08-20', NULL),
(17, '京B66017', 'LGWEF4A47NF012347', '长安', 'UNI-V', '轿车', '赤焰红', 'JL476ZQCF', '2023-04-01', 109900.00, 28000, '汽油', 53.00, 5, '停运', '客服部', 'GPS-017', '2025-04-01', '2025-04-01', '暂停使用，待分配'),
(18, '京C55018', 'LFV2A2157N3012348', '东风', 'EV18', '货车', '白色', NULL, '2023-06-01', 198000.00, 35000, '电动', NULL, 3, '停运', '物流部', 'GPS-018', '2025-06-01', '2025-06-01', '纯电动厢式货车，充电桩维修暂停'),
(19, '京A88019', 'LSVAU2180N2123458', '本田', '雅阁', '轿车', '极光蓝', 'L15CG', '2022-10-10', 179800.00, 51000, '汽油', 56.00, 5, '已报废', '法务部', 'GPS-019', '2024-10-10', '2025-10-10', '发动机报废'),
(20, '京A88020', 'LVHRU5849N5012349', '极氪', '001', '新能源', '暮光金', NULL, '2024-01-05', 309000.00, 8000, '电动', NULL, 5, '已报废', '设计部', 'GPS-020', '2026-01-05', '2026-01-05', '碰撞事故报废');
`
	if _, err := db.ExecContext(ctx, vehicleSQL); err != nil {
		return fmt.Errorf("插入车辆数据: %w", err)
	}
	fmt.Println("  🚗 已插入 20 辆车辆")

	// ---- 2. 驾驶员 (18人) ----
	driverSQL := `
INSERT INTO drivers (id, name, gender, phone, id_card, license_no, license_type, license_expire_date, hire_date, department, status, assigned_vehicle_id, emergency_contact, emergency_phone, address, driving_years, violation_count, accident_count, rating, notes) VALUES
(1,  '张建国', '男', '13800138001', '110101198501011234', 'D110101198501011234', 'C1', '2026-05-01', '2020-03-01', '总裁办',     '在岗', 1,  '张秀英', '13900139001', '北京市朝阳区望京街道', 15, 0, 0, 5.0, '总裁专职司机'),
(2,  '李明辉', '男', '13800138002', '110102198802022345', 'D110102198802022345', 'C1', '2025-08-15', '2021-06-15', '销售部',     '在岗', 2,  '李萍',   '13900139002', '北京市海淀区中关村',   12, 1, 0, 4.8, NULL),
(3,  '王晓东', '男', '13800138003', '110103199003033456', 'D110103199003033456', 'B2', '2026-03-20', '2019-01-10', '行政部',     '在岗', 3,  '王芳',   '13900139003', '北京市西城区金融街',   10, 2, 0, 4.6, '兼职班车驾驶'),
(4,  '赵丽娟', '女', '13800138004', '110104199204044567', 'D110104199204044567', 'C1', '2025-12-10', '2021-09-01', '市场部',     '在岗', 4,  '赵伟',   '13900139004', '北京市丰台区总部基地', 8,  0, 0, 4.9, NULL),
(5,  '刘强',   '男', '13800138005', '110105198706055678', 'D110105198706055678', 'B2', '2026-07-01', '2018-04-15', '技术部',     '在岗', 5,  '刘洋',   '13900139005', '北京市大兴区亦庄',     13, 1, 1, 4.5, NULL),
(6,  '陈伟',   '男', '13800138006', '110106198908066789', 'D110106198908066789', 'C1', '2026-01-20', '2022-02-01', '产品部',     '在岗', 6,  '陈红',   '13900139006', '北京市通州区运河商务区', 11, 0, 0, 4.7, NULL),
(7,  '杨海军', '男', '13800138007', '110107198509077890', 'D110107198509077890', 'A2', '2025-09-15', '2017-06-01', '物流部',     '在岗', 7,  '杨梅',   '13900139007', '北京市顺义区空港',     15, 3, 1, 4.3, '大型货车专职司机'),
(8,  '周建明', '男', '13800138008', '110108198710088901', 'D110108198710088901', 'A2', '2026-02-28', '2018-09-01', '物流部',     '在岗', 8,  '周丽',   '13900139008', '北京市昌平区回龙观',   13, 2, 0, 4.4, NULL),
(9,  '吴国强', '男', '13800138009', '110109198611099012', 'D110109198611099012', 'A1', '2025-11-30', '2016-03-15', '行政部',     '在岗', 9,  '吴秀兰', '13900139009', '北京市房山区良乡',     14, 1, 0, 4.6, '班车驾驶员'),
(10, '孙志刚', '男', '13800138010', '110110198412100123', 'D110110198412100123', 'A1', '2026-06-15', '2015-08-01', '行政部',     '在岗', 10, '孙丽华', '13900139010', '北京市石景山区鲁谷',   16, 0, 0, 4.8, '大客车驾驶员'),
(11, '黄婷婷', '女', '13800138011', '110111199305111234', 'D110111199305111234', 'C1', '2027-03-01', '2022-07-01', '人力资源部', '在岗', 11, '黄军',   '13900139011', '北京市朝阳区三里屯',   7,  0, 0, 4.9, NULL),
(12, '朱鹏飞', '男', '13800138012', '110112199106122345', 'D110112199106122345', 'C1', '2025-06-20', '2020-11-01', '财务部',     '在岗', 12, '朱颖',   '13900139012', '北京市东城区东直门',   9,  1, 0, 4.5, NULL),
(13, '林峰',   '男', '13800138013', '110113198807133456', 'D110113198807133456', 'C1', '2026-04-10', '2021-03-01', '行政部',     '休假', 13, '林红',   '13900139013', '北京市朝阳区双井',     12, 0, 0, 4.7, '年假中'),
(14, '徐龙',   '男', '13800138014', '110114198609144567', 'D110114198609144567', 'A2', '2025-10-05', '2019-05-01', '物流部',     '在岗', 14, '徐静',   '13900139014', '北京市丰台区花乡',     14, 4, 2, 4.0, '车辆维修中暂时待命'),
(15, '马晓峰', '男', '13800138015', '110115199208155678', 'D110115199208155678', 'C1', '2027-01-15', '2023-01-01', '研发部',     '在岗', 15, '马丽',   '13900139015', '北京市海淀区上地',     8,  0, 0, 5.0, NULL),
(16, '郑宇航', '男', '13800138016', '110116199409166789', 'D110116199409166789', 'C1', '2026-09-30', '2023-03-01', '运营部',     '在岗', 16, '郑萍',   '13900139016', '北京市朝阳区国贸',     6,  0, 0, 4.8, NULL),
(17, '谢建华', '男', '13800138017', '110117199010177890', 'D110117199010177890', 'C1', '2026-05-20', '2022-05-01', '客服部',     '在岗', 17, '谢芳',   '13900139017', '北京市西城区西直门',   10, 1, 0, 4.6, NULL),
(18, '何志远', '男', '13800138018', '110118198811188901', 'D110118198811188901', 'B2', '2025-12-25', '2020-08-01', '物流部',     '在岗', 18, '何丽',   '13900139018', '北京市大兴区黄村',     12, 0, 0, 4.7, '电动货车驾驶');
`
	if _, err := db.ExecContext(ctx, driverSQL); err != nil {
		return fmt.Errorf("插入驾驶员数据: %w", err)
	}
	fmt.Println("  👤 已插入 18 名驾驶员")

	// ---- 3. 路线 (10条) ----
	routeSQL := `
INSERT INTO routes (id, name, route_code, start_point, end_point, distance_km, estimated_duration_min, route_type, status, notes) VALUES
(1, '总部-首都机场',       'R001', '北京市朝阳区望京SOHO',    '首都国际机场T3航站楼', 25.50, 45, '市内', '启用', '机场接送专线'),
(2, '总部-大兴机场',       'R002', '北京市朝阳区望京SOHO',    '大兴国际机场',         65.00, 80, '市内', '启用', '大兴机场接送'),
(3, '总部-亦庄园区',       'R003', '北京市朝阳区望京SOHO',    '北京经济技术开发区',   30.00, 50, '市内', '启用', '日常通勤线路'),
(4, '总部-中关村软件园',   'R004', '北京市朝阳区望京SOHO',    '海淀区中关村软件园',   15.00, 35, '市内', '启用', '技术部通勤'),
(5, '北京-天津',           'R005', '北京市朝阳区望京SOHO',    '天津市滨海新区',      145.00, 120, '城际', '启用', '天津分公司'),
(6, '北京-雄安',           'R006', '北京市朝阳区望京SOHO',    '雄安新区启动区',      120.00, 100, '城际', '启用', '雄安项目'),
(7, '仓库-客户A',          'R007', '顺义区空港物流园',        '朝阳区CBD',           35.00, 55, '市内', '启用', '固定配送线路'),
(8, '仓库-客户B',          'R008', '顺义区空港物流园',        '丰台区总部基地',       40.00, 60, '市内', '启用', '固定配送线路'),
(9, '北京-上海',           'R009', '北京市朝阳区望京SOHO',    '上海市浦东新区',     1200.00, 780, '长途', '启用', '长途出差线路'),
(10, '员工班车-回龙观线',  'R010', '昌平区回龙观',            '朝阳区望京SOHO',       20.00, 40, '专线', '启用', '通勤班车线路');
`
	if _, err := db.ExecContext(ctx, routeSQL); err != nil {
		return fmt.Errorf("插入路线数据: %w", err)
	}
	fmt.Println("  🗺️  已插入 10 条路线")

	// ---- 4. 行程记录 (30条) ----
	now := time.Now()
	tripSQL := fmt.Sprintf(`
INSERT INTO trips (id, trip_no, vehicle_id, driver_id, route_id, start_time, end_time, start_location, end_location, start_mileage, end_mileage, distance_km, fuel_consumed, purpose, status, passenger_count, max_speed, avg_speed, notes) VALUES
(1,  'TR20250201001', 1,  1,  1,  '%s', '%s', '望京SOHO', '首都机场T3', 42100, 42126, 25.50, NULL,  '接送贵宾',     '已完成', 2, 80.00, 35.00, NULL),
(2,  'TR20250201002', 3,  3,  3,  '%s', '%s', '望京SOHO', '亦庄园区',   67300, 67330, 30.00, 3.80,  '商务会议',     '已完成', 3, 90.00, 42.00, NULL),
(3,  'TR20250202001', 7,  7,  7,  '%s', '%s', '空港物流园', '朝阳CBD',  124500, 124535, 35.00, 8.50, '货物配送',     '已完成', 0, 70.00, 38.00, '配送3吨货物'),
(4,  'TR20250202002', 2,  2,  2,  '%s', '%s', '望京SOHO', '大兴机场',   37800, 37865, 65.00, NULL,  '客户接送',     '已完成', 1, 110.00, 55.00, NULL),
(5,  'TR20250203001', 9,  9,  10, '%s', '%s', '回龙观',    '望京SOHO',  179500, 179520, 20.00, 5.50, '通勤班车',     '已完成', 28, 60.00, 30.00, '早班车'),
(6,  'TR20250203002', 4,  4,  4,  '%s', '%s', '望京SOHO', '中关村软件园', 54900, 54915, 15.00, 1.80, '客户拜访',    '已完成', 2, 70.00, 28.00, NULL),
(7,  'TR20250204001', 5,  5,  5,  '%s', '%s', '望京SOHO', '天津滨海',   48200, 48345, 145.00, 12.50, '出差',        '已完成', 3, 120.00, 75.00, '天津分公司出差'),
(8,  'TR20250204002', 8,  8,  8,  '%s', '%s', '空港物流园', '丰台总部基地', 97600, 97640, 40.00, 9.00, '货物配送',  '已完成', 0, 65.00, 40.00, NULL),
(9,  'TR20250205001', 6,  6,  6,  '%s', '%s', '望京SOHO', '雄安新区',   28500, 28620, 120.00, 8.00, '项目考察',     '已完成', 4, 130.00, 72.00, NULL),
(10, 'TR20250205002', 10, 10, 10, '%s', '%s', '回龙观',    '望京SOHO',  144600, 144620, 20.00, 6.00, '通勤班车',   '已完成', 42, 55.00, 30.00, '早班车'),
(11, 'TR20250206001', 11, 11, 3,  '%s', '%s', '望京SOHO', '亦庄园区',   21700, 21730, 30.00, 2.00, '行政办事',     '已完成', 1, 85.00, 38.00, NULL),
(12, 'TR20250206002', 12, 12, 1,  '%s', '%s', '望京SOHO', '首都机场T3', 61600, 61626, 25.50, 3.20, '接送领导',     '已完成', 1, 75.00, 34.00, NULL),
(13, 'TR20250207001', 15, 15, 4,  '%s', '%s', '望京SOHO', '中关村软件园', 14700, 14715, 15.00, NULL, '技术交流',   '已完成', 2, 65.00, 26.00, NULL),
(14, 'TR20250207002', 16, 16, 3,  '%s', '%s', '望京SOHO', '亦庄园区',   19700, 19730, 30.00, NULL,  '运营协调',    '已完成', 1, 90.00, 40.00, NULL),
(15, 'TR20250208001', 17, 17, 7,  '%s', '%s', '望京SOHO', '朝阳CBD',    27700, 27735, 35.00, 4.50, '客户走访',    '已完成', 0, 72.00, 35.00, NULL),
(16, 'TR20250208002', 18, 18, 8,  '%s', '%s', '空港物流园', '丰台总部基地', 34700, 34740, 40.00, NULL, '配送',     '已完成', 0, 60.00, 38.00, '电动货车配送'),
(17, 'TR20250209001', 1,  1,  2,  '%s', '%s', '望京SOHO', '大兴机场',   42400, 42465, 65.00, NULL,  '贵宾接送',    '已完成', 1, 115.00, 52.00, NULL),
(18, 'TR20250209002', 7,  7,  7,  '%s', '%s', '空港物流园', '朝阳CBD',  124800, 124835, 35.00, 8.20, '货物配送',   '已完成', 0, 68.00, 36.00, NULL),
(19, 'TR20250210001', 3,  3,  5,  '%s', '%s', '望京SOHO', '天津滨海',   67600, 67745, 145.00, 14.50, '商务出差',  '已完成', 2, 125.00, 78.00, NULL),
(20, 'TR20250210002', 9,  9,  10, '%s', '%s', '回龙观',    '望京SOHO',  179800, 179820, 20.00, 5.30, '通勤班车',   '已完成', 30, 58.00, 30.00, '早班车'),
(21, 'TR20250211001', 2,  2,  1,  '%s', '%s', '望京SOHO', '首都机场T3', 38200, 38226, 25.50, NULL,  '客户接送',    '已完成', 1, 82.00, 36.00, NULL),
(22, 'TR20250211002', 5,  5,  6,  '%s', '%s', '望京SOHO', '雄安新区',   48600, 48720, 120.00, 10.00, '项目支持',  '已完成', 3, 128.00, 70.00, NULL),
(23, 'TR20250212001', 4,  4,  3,  '%s', '%s', '望京SOHO', '亦庄园区',   55200, 55230, 30.00, 3.60, '市场调研',    '已完成', 2, 88.00, 40.00, NULL),
(24, 'TR20250212002', 6,  6,  4,  '%s', '%s', '望京SOHO', '中关村软件园', 28900, 28915, 15.00, 1.20, '合作洽谈', '已完成', 1, 70.00, 28.00, NULL),
(25, 'TR20250213001', 8,  8,  7,  '%s', '%s', '空港物流园', '朝阳CBD',  97900, 97935, 35.00, 8.80, '货物配送',    '已完成', 0, 66.00, 38.00, NULL),
(26, 'TR20250213002', 10, 10, 10, '%s', '%s', '回龙观',    '望京SOHO',  144900, 144920, 20.00, 5.80, '通勤班车',  '已完成', 45, 55.00, 30.00, '晚班车'),
(27, 'TR20250214001', 11, 11, 1,  '%s', '%s', '望京SOHO', '首都机场T3', 22000, 22026, 25.50, 1.80, '接送同事',   '已完成', 1, 78.00, 35.00, NULL),
(28, 'TR20250214002', 15, 15, 6,  '%s', '%s', '望京SOHO', '雄安新区',   15000, 15120, 120.00, NULL, '技术支持',   '已完成', 2, 135.00, 72.00, NULL),
(29, 'TR20250215001', 1,  1,  1,  '%s', NULL, '望京SOHO', NULL,         42580, NULL,  NULL,   NULL,  '接送贵宾',   '进行中', 1, NULL,   NULL,  '正在前往机场'),
(30, 'TR20250215002', 7,  7,  7,  '%s', NULL, '空港物流园', NULL,       125100, NULL,  NULL,   NULL,  '货物配送',   '进行中', 0, NULL,   NULL,  '正在配送途中');
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

	// ---- 5. 维修保养 (15条) ----
	maintenanceSQL := `
INSERT INTO maintenance_records (id, record_no, vehicle_id, maintenance_type, description, service_provider, mileage_at_service, cost, parts_cost, labor_cost, start_date, end_date, next_maintenance_date, next_maintenance_mileage, status, quality_rating, notes) VALUES
(1,  'MR20250101001', 3,  '保养', '常规保养：更换机油、机滤、空滤',             '北京大众4S店',     65000, 1580.00, 980.00, 600.00,   '2025-01-10', '2025-01-10', '2025-07-10', 75000, '已完成', 5, NULL),
(2,  'MR20250101002', 4,  '保养', '二保：更换机油、机滤、检查刹车',             '北京丰田4S店',     50000, 1280.00, 800.00, 480.00,   '2025-01-15', '2025-01-15', '2025-07-15', 60000, '已完成', 4, NULL),
(3,  'MR20250102001', 7,  '维修', '更换前轮刹车片、刹车盘',                     '顺义卡车修理厂',   120000, 3500.00, 2500.00, 1000.00, '2025-01-20', '2025-01-21', NULL, NULL, '已完成', 4, NULL),
(4,  'MR20250102002', 12, '保养', '常规保养：更换机油、机滤',                    '北京奔驰4S店',     58000, 3200.00, 2600.00, 600.00,  '2025-01-25', '2025-01-25', '2025-07-25', 68000, '已完成', 5, '奔驰原厂配件'),
(5,  'MR20250103001', 9,  '保养', '大保养：更换机油、三滤、刹车油、变速箱油',   '宇通特约服务站',   175000, 5800.00, 4200.00, 1600.00, '2025-01-28', '2025-01-29', '2025-04-28', 185000, '已完成', 4, '班车保养'),
(6,  'MR20250103002', 5,  '轮胎更换', '更换4条轮胎（米其林Primacy 4）',          '京东养车望京店',   45000, 3200.00, 2800.00, 400.00,  '2025-02-01', '2025-02-01', NULL, NULL, '已完成', 5, NULL),
(7,  'MR20250104001', 14, '维修', '发动机故障灯报警，更换喷油器总成',           '福田特约维修站',   85000, 12000.00, 9500.00, 2500.00, '2025-02-05', NULL, NULL, NULL, '进行中', NULL, '等待配件到货'),
(8,  'MR20250104002', 1,  '保养', '电动车常规检查：电池健康、制动系统',         '比亚迪服务中心',   40000, 680.00, 200.00, 480.00,   '2025-02-08', '2025-02-08', '2025-08-08', 50000, '已完成', 5, NULL),
(9,  'MR20250105001', 8,  '维修', '更换离合器片',                               '江铃特约维修站',   95000, 4500.00, 3000.00, 1500.00, '2025-02-10', '2025-02-11', NULL, NULL, '已完成', 4, NULL),
(10, 'MR20250105002', 2,  '保养', '电动车保养：检查电池、更换空调滤芯',         '特斯拉服务中心',   36000, 980.00, 350.00, 630.00,   '2025-02-12', '2025-02-12', '2025-08-12', 46000, '已完成', 5, NULL),
(11, 'MR20250106001', 10, '保养', '底盘检查、更换空气悬挂元件',                 '金龙特约服务站',   142000, 8500.00, 6500.00, 2000.00, '2025-02-15', '2025-02-16', '2025-05-15', 152000, '已完成', 3, '悬挂老化'),
(12, 'MR20250106002', 6,  '保养', '增程器保养：更换火花塞、机油',               '理想汽车服务中心', 26000, 1500.00, 900.00, 600.00,   '2025-02-18', '2025-02-18', '2025-08-18', 36000, '已完成', 5, NULL),
(13, 'MR20250107001', 19, '保养', '常规保养：更换机油、机滤',                    '北京本田4S店',     48000, 1100.00, 700.00, 400.00,   '2025-02-20', '2025-02-20', '2025-08-20', 58000, '已完成', 4, NULL),
(14, 'MR20250107002', 15, '保养', '电动车年度检查：电池诊断、更新系统',         '蔚来服务中心',     13000, 500.00, 0, 500.00,          '2025-02-22', '2025-02-22', '2026-02-22', 23000, '已完成', 5, '免费首保'),
(15, 'MR20250108001', 17, '事故修复', '右前翼子板剐蹭修复、补漆',               '长安特约钣喷中心', 26500, 2800.00, 1200.00, 1600.00, '2025-02-25', '2025-02-27', NULL, NULL, '已完成', 4, '轻微剐蹭');
`
	if _, err := db.ExecContext(ctx, maintenanceSQL); err != nil {
		return fmt.Errorf("插入维修保养数据: %w", err)
	}
	fmt.Println("  🔧 已插入 15 条维修保养记录")

	// ---- 6. 加油记录 (25条) ----
	fuelSQL := fmt.Sprintf(`
INSERT INTO fuel_records (vehicle_id, driver_id, fuel_date, fuel_type, quantity, unit_price, total_cost, mileage_at_fuel, gas_station, payment_method, is_full_tank, notes) VALUES
(3,  3,  '%s', '95号汽油', 55.00, 8.09, 444.95,  66000, '中石化望京加油站',       '公司卡', 1, NULL),
(4,  4,  '%s', '92号汽油', 48.00, 7.89, 378.72,  53000, '中石油朝阳加油站',       '公司卡', 1, NULL),
(5,  5,  '%s', '92号汽油', 50.00, 7.89, 394.50,  47000, '中石化亦庄加油站',       '公司卡', 1, NULL),
(7,  7,  '%s', '0号柴油',  100.00, 7.55, 755.00, 122000, '中石化顺义物流园站',    '加油卡', 1, '满箱'),
(8,  8,  '%s', '0号柴油',  85.00, 7.55, 641.75,  96000, '中石油昌平加油站',       '加油卡', 1, NULL),
(9,  9,  '%s', '0号柴油',  160.00, 7.55, 1208.00, 178000, '中石化回龙观加油站',   '加油卡', 1, '班车加油'),
(10, 10, '%s', '0号柴油',  250.00, 7.55, 1887.50, 143000, '中石化石景山加油站',   '加油卡', 1, '大客车加油'),
(12, 12, '%s', '95号汽油', 56.00, 8.09, 453.04,  60000, '中石化东直门加油站',     '公司卡', 1, NULL),
(3,  3,  '%s', '95号汽油', 52.00, 8.15, 423.80,  67200, '中石化望京加油站',       '公司卡', 1, NULL),
(4,  4,  '%s', '92号汽油', 45.00, 7.92, 356.40,  54200, '中石油朝阳加油站',       '公司卡', 1, NULL),
(7,  7,  '%s', '0号柴油',  95.00, 7.58, 720.10,  123500, '中石化顺义物流园站',    '加油卡', 1, NULL),
(5,  5,  '%s', '92号汽油', 48.00, 7.92, 380.16,  48200, '中石化亦庄加油站',       '公司卡', 1, NULL),
(6,  6,  '%s', '95号汽油', 40.00, 8.09, 323.60,  27500, '中石化通州加油站',       '公司卡', 0, '增程器用油'),
(8,  8,  '%s', '0号柴油',  90.00, 7.58, 682.20,  97600, '中石油昌平加油站',       '加油卡', 1, NULL),
(17, 17, '%s', '92号汽油', 42.00, 7.89, 331.38,  27200, '中石化西直门加油站',     '公司卡', 1, NULL),
(19, 19, '%s', '92号汽油', 45.00, 7.89, 355.05,  50000, '中石油朝阳加油站',       '公司卡', 1, NULL),
(9,  9,  '%s', '0号柴油',  155.00, 7.55, 1170.25, 179500, '中石化回龙观加油站',   '加油卡', 1, NULL),
(3,  3,  '%s', '95号汽油', 54.00, 8.12, 438.48,  67800, '中石化望京加油站',       '公司卡', 1, NULL),
(10, 10, '%s', '0号柴油',  240.00, 7.58, 1819.20, 144600, '中石化石景山加油站',   '加油卡', 1, NULL),
(12, 12, '%s', '95号汽油', 53.00, 8.12, 430.36,  61600, '中石化东直门加油站',     '公司卡', 1, NULL),
(7,  7,  '%s', '0号柴油',  98.00, 7.60, 744.80,  124800, '中石化顺义物流园站',    '加油卡', 1, NULL),
(4,  4,  '%s', '92号汽油', 46.00, 7.95, 365.70,  55200, '中石油朝阳加油站',       '公司卡', 1, NULL),
(5,  5,  '%s', '92号汽油', 50.00, 7.95, 397.50,  48600, '中石化亦庄加油站',       '公司卡', 1, NULL),
(17, 17, '%s', '92号汽油', 44.00, 7.92, 348.48,  27700, '中石化西直门加油站',     '公司卡', 1, NULL),
(6,  6,  '%s', '95号汽油', 42.00, 8.12, 341.04,  28900, '中石化通州加油站',       '公司卡', 0, NULL);
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

	// ---- 6b. 电动车充电记录 (10条) ----
	evChargeSQL := fmt.Sprintf(`
INSERT INTO fuel_records (vehicle_id, driver_id, fuel_date, fuel_type, quantity, unit_price, total_cost, mileage_at_fuel, gas_station, payment_method, is_full_tank, notes) VALUES
(1,  1,  '%s', '充电', 65.00,  1.20, 78.00,   41800, '国家电网望京充电站',       '公司卡', 1, 'BYD汉EV快充'),
(1,  1,  '%s', '充电', 58.00,  1.20, 69.60,   42300, '特来电望京南充电站',       '公司卡', 1, NULL),
(2,  2,  '%s', '充电', 70.00,  1.80, 126.00,  37500, '特斯拉超充望京站',         '公司卡', 1, 'Model Y超级充电'),
(2,  2,  '%s', '充电', 62.00,  1.80, 111.60,  38000, '特斯拉超充国贸站',         '公司卡', 1, NULL),
(15, 15, '%s', '充电', 75.00,  1.50, 112.50,  14200, '蔚来换电站中关村',         '公司卡', 1, 'ES6换电'),
(15, 15, '%s', '充电', 72.00,  1.50, 108.00,  14800, '蔚来换电站望京站',         '公司卡', 1, NULL),
(16, 16, '%s', '充电', 60.00,  1.20, 72.00,   19200, '国家电网亦庄充电站',       '公司卡', 1, 'P7慢充'),
(18, 18, '%s', '充电', 80.00,  1.00, 80.00,   34200, '顺义物流园专用充电桩',     '公司卡', 1, '电动货车夜间充电'),
(20, NULL, '%s', '充电', 86.00,  1.50, 129.00,  7500,  '国家电网望京充电站',       '公司卡', 1, '极氪001快充（报废前记录）'),
(11, 11, '%s', '充电', 18.00,  1.20, 21.60,   21500, '特来电朝阳充电站',         '公司卡', 0, '秦PLUS插混补电');
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

	// ---- 7. 违章记录 (12条) ----
	violationSQL := fmt.Sprintf(`
INSERT INTO violations (vehicle_id, driver_id, violation_date, violation_location, violation_type, violation_code, fine_amount, deduction_points, status, handler, handled_date, notes) VALUES
(3,  3,  '%s', '北京市朝阳区东三环中路',   '超速行驶(超速20%%以下)',       '1345', 200.00,  3, '已处理', '王晓东', '%s', NULL),
(5,  5,  '%s', '北京市丰台区南四环西路',   '违反禁令标志',                 '1344', 200.00,  3, '已处理', '刘强',   '%s', '误入公交专用道'),
(7,  7,  '%s', '北京市顺义区天竺路',       '超速行驶(超速20%%-50%%)',      '1345', 200.00,  6, '已处理', '杨海军', '%s', '货车限速60'),
(8,  8,  '%s', '北京市昌平区立汤路',       '闯红灯',                       '1625', 200.00,  6, '待处理', NULL,     NULL, '等待处理'),
(12, 12, '%s', '北京市东城区东直门内大街', '违反禁止停车标线',             '1039', 200.00,  3, '已处理', '朱鹏飞', '%s', NULL),
(3,  3,  '%s', '北京市海淀区北四环中路',   '超速行驶(超速20%%以下)',       '1345', 100.00,  3, '已处理', '王晓东', '%s', NULL),
(17, 17, '%s', '北京市西城区西直门内大街', '不按导向车道行驶',             '1208', 100.00,  2, '待处理', NULL,     NULL, NULL),
(7,  7,  '%s', '北京市朝阳区机场高速',     '超速行驶(超速20%%以下)',       '1345', 200.00,  3, '已处理', '杨海军', '%s', NULL),
(14, 14, '%s', '北京市丰台区花乡桥',       '未按规定让行',                 '1315', 200.00,  3, '已处理', '徐龙',   '%s', NULL),
(14, 14, '%s', '北京市顺义区裕民大街',     '超速行驶(超速20%%-50%%)',      '1345', 200.00,  6, '申诉中', NULL,     NULL, '认为限速标志不清'),
(5,  5,  '%s', '北京市大兴区亦庄经济开发区', '违反禁令标志',               '1344', 100.00,  1, '待处理', NULL,     NULL, NULL),
(7,  7,  '%s', '天津市滨海新区津滨高速',   '超速行驶(超速20%%以下)',       '1345', 200.00,  3, '已处理', '杨海军', '%s', NULL);
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

	// ---- 8. 保险记录 (20条) ----
	insuranceSQL := `
INSERT INTO insurance_policies (vehicle_id, policy_no, insurance_company, insurance_type, premium, coverage_amount, start_date, end_date, status, claim_count, total_claim_amount, agent_name, agent_phone, notes) VALUES
(1,  'POL-2024-0001', '中国人保',     '交强险',         950.00,     122000.00,   '2024-03-15', '2025-03-15', '待续保', 0, 0, '张经理', '13600136001', NULL),
(1,  'POL-2024-0002', '中国人保',     '商业险',         5800.00,    1000000.00,  '2024-03-15', '2025-03-15', '待续保', 0, 0, '张经理', '13600136001', '含车损+三者+不计免赔'),
(2,  'POL-2024-0003', '中国平安',     '交强险',         950.00,     122000.00,   '2024-05-20', '2025-05-20', '有效',   0, 0, '李经理', '13600136002', NULL),
(2,  'POL-2024-0004', '中国平安',     '全险',           8500.00,    2000000.00,  '2024-05-20', '2025-05-20', '有效',   0, 0, '李经理', '13600136002', NULL),
(3,  'POL-2024-0005', '太平洋保险',   '交强险',         950.00,     122000.00,   '2024-08-10', '2025-08-10', '有效',   0, 0, '王经理', '13600136003', NULL),
(3,  'POL-2024-0006', '太平洋保险',   '商业险',         4200.00,    1000000.00,  '2024-08-10', '2025-08-10', '有效',   1, 3500.00, '王经理', '13600136003', '有一次小剐蹭出险'),
(4,  'POL-2024-0007', '中国人寿',     '交强险',         950.00,     122000.00,   '2024-06-15', '2025-06-15', '有效',   0, 0, '赵经理', '13600136004', NULL),
(4,  'POL-2024-0008', '中国人寿',     '车损险',         3500.00,    179800.00,   '2024-06-15', '2025-06-15', '有效',   0, 0, '赵经理', '13600136004', NULL),
(5,  'POL-2024-0009', '中国平安',     '交强险',         950.00,     122000.00,   '2024-11-01', '2025-11-01', '有效',   0, 0, '李经理', '13600136002', NULL),
(5,  'POL-2024-0010', '中国平安',     '第三者责任险',   2800.00,    1500000.00,  '2024-11-01', '2025-11-01', '有效',   0, 0, '李经理', '13600136002', NULL),
(7,  'POL-2024-0011', '中国人保',     '交强险',         1100.00,    122000.00,   '2024-09-20', '2025-09-20', '有效',   0, 0, '孙经理', '13600136005', '货车交强险'),
(7,  'POL-2024-0012', '中国人保',     '商业险',         6800.00,    1000000.00,  '2024-09-20', '2025-09-20', '有效',   0, 0, '孙经理', '13600136005', NULL),
(9,  'POL-2024-0013', '太平洋保险',   '交强险',         1200.00,    122000.00,   '2024-05-10', '2025-05-10', '有效',   0, 0, '周经理', '13600136006', '客车交强险'),
(9,  'POL-2024-0014', '太平洋保险',   '商业险',         12000.00,   2000000.00,  '2024-05-10', '2025-05-10', '有效',   0, 0, '周经理', '13600136006', '客车商业险'),
(12, 'POL-2024-0015', '中国人保',     '交强险',         950.00,     122000.00,   '2024-04-20', '2025-04-20', '有效',   0, 0, '张经理', '13600136001', NULL),
(12, 'POL-2024-0016', '中国人保',     '全险',           12000.00,   3000000.00,  '2024-04-20', '2025-04-20', '有效',   0, 0, '张经理', '13600136001', '奔驰全险'),
(15, 'POL-2024-0017', '中国平安',     '交强险',         950.00,     122000.00,   '2024-11-15', '2025-11-15', '有效',   0, 0, '李经理', '13600136002', NULL),
(15, 'POL-2024-0018', '中国平安',     '全险',           9800.00,    2000000.00,  '2024-11-15', '2025-11-15', '有效',   0, 0, '李经理', '13600136002', NULL),
(20, 'POL-2025-0019', '太平洋保险',   '交强险',         950.00,     122000.00,   '2025-01-05', '2026-01-05', '有效',   0, 0, '王经理', '13600136003', NULL),
(20, 'POL-2025-0020', '太平洋保险',   '全险',           8200.00,    2000000.00,  '2025-01-05', '2026-01-05', '有效',   0, 0, '王经理', '13600136003', '新车全险');
`
	if _, err := db.ExecContext(ctx, insuranceSQL); err != nil {
		return fmt.Errorf("插入保险数据: %w", err)
	}
	fmt.Println("  🛡️  已插入 20 条保险记录")

	// ---- 9. GPS 定位 (50条) ----
	gpsSQL := fmt.Sprintf(`
INSERT INTO gps_tracking (vehicle_id, latitude, longitude, speed, heading, altitude, location_name, status, recorded_at) VALUES
(1,  39.9932168, 116.4804650, 45.00, 180.00, 48.5, '北京市朝阳区望京街道',     '行驶', '%s'),
(1,  39.9800000, 116.4700000, 62.00, 175.00, 47.2, '北京市朝阳区东湖街道',     '行驶', '%s'),
(1,  39.9500000, 116.4600000, 0.00,  0.00,   46.0, '北京市朝阳区亮马桥',       '停车', '%s'),
(2,  39.9932168, 116.4804650, 55.00, 220.00, 48.5, '北京市朝阳区望京街道',     '行驶', '%s'),
(2,  39.9100000, 116.4200000, 88.00, 200.00, 42.0, '北京市朝阳区国贸',         '行驶', '%s'),
(3,  39.9932168, 116.4804650, 0.00,  0.00,   48.5, '北京市朝阳区望京街道',     '停车', '%s'),
(3,  39.7800000, 116.5200000, 72.00, 160.00, 35.0, '北京市大兴区亦庄',         '行驶', '%s'),
(4,  39.9932168, 116.4804650, 38.00, 290.00, 48.5, '北京市朝阳区望京街道',     '行驶', '%s'),
(4,  39.9700000, 116.3100000, 42.00, 280.00, 50.0, '北京市海淀区中关村',       '行驶', '%s'),
(5,  39.9932168, 116.4804650, 50.00, 195.00, 48.5, '北京市朝阳区望京街道',     '行驶', '%s'),
(5,  39.0800000, 117.2000000, 110.00, 120.00, 5.0, '天津市滨海新区',           '行驶', '%s'),
(6,  39.9932168, 116.4804650, 65.00, 210.00, 48.5, '北京市朝阳区望京街道',     '行驶', '%s'),
(6,  38.9200000, 115.9700000, 125.00, 180.00, 15.0, '雄安新区启动区',          '行驶', '%s'),
(7,  40.0700000, 116.5900000, 45.00, 240.00, 30.0, '北京市顺义区空港物流园',   '行驶', '%s'),
(7,  39.9200000, 116.4400000, 35.00, 210.00, 45.0, '北京市朝阳区三元桥',       '行驶', '%s'),
(7,  39.9100000, 116.4600000, 0.00,  0.00,   44.0, '北京市朝阳区CBD',          '停车', '%s'),
(8,  40.0700000, 116.5900000, 40.00, 250.00, 30.0, '北京市顺义区空港物流园',   '行驶', '%s'),
(8,  39.8600000, 116.2800000, 38.00, 190.00, 40.0, '北京市丰台区总部基地',     '行驶', '%s'),
(9,  40.0700000, 116.3200000, 35.00, 180.00, 55.0, '北京市昌平区回龙观',       '行驶', '%s'),
(9,  39.9932168, 116.4804650, 0.00,  0.00,   48.5, '北京市朝阳区望京街道',     '停车', '%s'),
(10, 39.9500000, 116.1800000, 42.00, 90.00,  50.0, '北京市石景山区鲁谷',       '行驶', '%s'),
(10, 39.9932168, 116.4804650, 0.00,  0.00,   48.5, '北京市朝阳区望京街道',     '停车', '%s'),
(11, 39.9932168, 116.4804650, 42.00, 195.00, 48.5, '北京市朝阳区望京街道',     '行驶', '%s'),
(11, 39.7800000, 116.5200000, 0.00,  0.00,   35.0, '北京市大兴区亦庄',         '停车', '%s'),
(12, 39.9932168, 116.4804650, 55.00, 160.00, 48.5, '北京市朝阳区望京街道',     '行驶', '%s'),
(12, 40.0800000, 116.6100000, 0.00,  0.00,   25.0, '首都国际机场T3航站楼',     '停车', '%s'),
(13, 39.9932168, 116.4804650, 0.00,  0.00,   48.5, '北京市朝阳区望京街道',     '离线', '%s'),
(14, 39.8600000, 116.2800000, 0.00,  0.00,   40.0, '福田特约维修站',           '停车', '%s'),
(15, 39.9932168, 116.4804650, 48.00, 280.00, 48.5, '北京市朝阳区望京街道',     '行驶', '%s'),
(15, 39.9700000, 116.3100000, 0.00,  0.00,   50.0, '北京市海淀区中关村软件园', '停车', '%s'),
(16, 39.9932168, 116.4804650, 60.00, 195.00, 48.5, '北京市朝阳区望京街道',     '行驶', '%s'),
(16, 39.7800000, 116.5200000, 52.00, 165.00, 35.0, '北京市大兴区亦庄',         '行驶', '%s'),
(17, 39.9932168, 116.4804650, 35.00, 240.00, 48.5, '北京市朝阳区望京街道',     '行驶', '%s'),
(17, 39.9100000, 116.4600000, 28.00, 220.00, 44.0, '北京市朝阳区CBD',          '行驶', '%s'),
(18, 40.0700000, 116.5900000, 42.00, 250.00, 30.0, '北京市顺义区空港物流园',   '行驶', '%s'),
(18, 39.8600000, 116.2800000, 0.00,  0.00,   40.0, '北京市丰台区总部基地',     '停车', '%s'),
(19, 39.9932168, 116.4804650, 0.00,  0.00,   48.5, '北京市朝阳区望京街道',     '停车', '%s'),
(20, 39.9932168, 116.4804650, 52.00, 175.00, 48.5, '北京市朝阳区望京街道',     '行驶', '%s'),
(1,  40.0800000, 116.6100000, 75.00, 60.00,  25.0, '机场高速',                 '行驶', '%s'),
(2,  39.5100000, 116.4200000, 95.00, 190.00, 35.0, '大兴机场高速',             '行驶', '%s'),
(7,  39.9400000, 116.4800000, 22.00, 200.00, 45.0, '朝阳区呼家楼',             '怠速', '%s'),
(9,  40.0200000, 116.3800000, 45.00, 175.00, 52.0, '昌平区北苑',               '行驶', '%s'),
(3,  39.8500000, 116.4900000, 68.00, 170.00, 38.0, '南三环',                   '行驶', '%s'),
(5,  39.5000000, 116.8000000, 105.00, 125.00, 10.0, '京津高速',                '行驶', '%s'),
(10, 39.9700000, 116.3600000, 35.00, 85.00,  48.0, '北三环',                   '行驶', '%s'),
(6,  39.5000000, 116.1000000, 118.00, 185.00, 20.0, '京雄高速',                '行驶', '%s'),
(12, 39.9600000, 116.5100000, 48.00, 45.00,  43.0, '东四环',                   '行驶', '%s'),
(15, 39.9800000, 116.3500000, 55.00, 270.00, 50.0, '北四环',                   '行驶', '%s'),
(16, 39.8800000, 116.4900000, 42.00, 175.00, 40.0, '东三环',                   '行驶', '%s'),
(11, 39.9400000, 116.4500000, 38.00, 195.00, 46.0, '朝阳区三里屯',             '行驶', '%s');
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
(1, 39.9932, 116.4805, 0.00,  0.00,   48.5, '望京SOHO停车场',           '停车', '%s'),
(1, 39.9950, 116.4820, 25.00, 45.00,  48.0, '望京街道望京东路',         '行驶', '%s'),
(1, 40.0010, 116.4880, 55.00, 50.00,  46.0, '来广营东路',               '行驶', '%s'),
(1, 40.0150, 116.5050, 72.00, 55.00,  42.0, '京密路入口',               '行驶', '%s'),
(1, 40.0320, 116.5250, 88.00, 50.00,  38.0, '机场高速南段',             '行驶', '%s'),
(1, 40.0500, 116.5500, 95.00, 48.00,  32.0, '机场高速中段',             '行驶', '%s'),
(1, 40.0680, 116.5800, 80.00, 52.00,  28.0, '机场高速北段',             '行驶', '%s'),
(1, 40.0800, 116.6100, 15.00, 60.00,  25.0, '首都机场T3航站楼',         '行驶', '%s'),
(7, 40.0700, 116.5900, 0.00,  0.00,   30.0, '顺义空港物流园仓库',       '停车', '%s'),
(7, 40.0600, 116.5700, 35.00, 220.00, 32.0, '天竺镇天柱路',             '行驶', '%s'),
(7, 40.0450, 116.5500, 48.00, 215.00, 35.0, '顺义区李桥镇',             '行驶', '%s'),
(7, 40.0300, 116.5200, 55.00, 210.00, 38.0, '机场高速辅路',             '行驶', '%s'),
(7, 40.0100, 116.4900, 42.00, 200.00, 42.0, '来广营地区',               '行驶', '%s'),
(7, 39.9800, 116.4700, 35.00, 195.00, 44.0, '望京西园',                 '行驶', '%s'),
(7, 39.9500, 116.4600, 28.00, 190.00, 45.0, '三元桥',                   '行驶', '%s'),
(7, 39.9300, 116.4550, 18.00, 185.00, 44.0, '国贸桥',                   '怠速', '%s'),
(7, 39.9200, 116.4500, 0.00,  0.00,   44.0, '朝阳区CBD客户处',          '停车', '%s'),
(9, 40.0700, 116.3200, 0.00,  0.00,   55.0, '回龙观班车发车点',         '停车', '%s'),
(9, 40.0550, 116.3400, 32.00, 135.00, 52.0, '回龙观东大街',             '行驶', '%s'),
(9, 40.0400, 116.3600, 42.00, 140.00, 50.0, '立水桥',                   '行驶', '%s'),
(9, 40.0200, 116.3900, 38.00, 130.00, 48.0, '北苑路',                   '行驶', '%s'),
(9, 40.0050, 116.4200, 45.00, 120.00, 48.0, '亚运村',                   '行驶', '%s'),
(9, 39.9932, 116.4500, 30.00, 110.00, 48.0, '望京西',                   '行驶', '%s'),
(9, 39.9932, 116.4805, 0.00,  0.00,   48.5, '望京SOHO',                 '停车', '%s'),
(2, 39.9932, 116.4805, 0.00,  0.00,   48.5, '望京SOHO出发',             '停车', '%s'),
(2, 39.9800, 116.4700, 42.00, 195.00, 47.0, '望京南',                   '行驶', '%s'),
(2, 39.9500, 116.4500, 55.00, 200.00, 45.0, '三元桥',                   '行驶', '%s'),
(2, 39.9200, 116.4300, 65.00, 205.00, 43.0, '国贸',                     '行驶', '%s'),
(2, 39.8800, 116.4200, 78.00, 200.00, 42.0, '十里河',                   '行驶', '%s'),
(2, 39.8200, 116.4100, 92.00, 195.00, 40.0, '南四环',                   '行驶', '%s'),
(2, 39.7200, 116.4100, 105.00, 190.00, 38.0, '大兴机场高速',            '行驶', '%s'),
(2, 39.5800, 116.4200, 110.00, 188.00, 35.0, '大兴机场高速中段',        '行驶', '%s'),
(2, 39.5100, 116.4100, 45.00, 185.00, 32.0, '大兴机场到达层',           '行驶', '%s');
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
(7,  7,  '超速',       '高',   '货车超速告警',               '车辆在限速60km/h路段行驶速度达到82km/h',     '北京市顺义区天竺路',       40.0700, 116.5900, 82.00, '60 km/h',  '82 km/h',  '已处理', '调度中心李主管', '%s', '已通知驾驶员降速', '%s'),
(5,  5,  '超速',       '中',   '小型车超速提醒',             '车辆在限速100km/h路段行驶速度达到118km/h',    '京津高速',                 39.5000, 116.8000, 118.00, '100 km/h', '118 km/h', '已处理', '调度中心李主管', '%s', '电话提醒已确认', '%s'),
(9,  9,  '疲劳驾驶',   '紧急', '班车驾驶员疲劳驾驶告警',     '连续驾驶超过4小时未休息',                     '北京市昌平区回龙观',       40.0700, 116.3200, 45.00, '4 小时',   '4.5 小时', '已处理', '安全主管张伟',   '%s', '已安排换班休息', '%s'),
(13, 13, '设备离线',   '中',   'GPS设备离线',                '车辆GPS设备持续离线超过24小时',                '最后位置：望京SOHO',       39.9932, 116.4805, 0.00,  '2 小时',   '48 小时',  '处理中', NULL,            NULL, NULL, '%s'),
(1,  1,  '保养到期',   '低',   '车辆保养提醒',               '比亚迪汉EV距下次保养还有500km',               NULL,                       NULL,    NULL,     NULL,  '50000 km', '49500 km', '已处理', '车管员小王',    '%s', '已预约保养', '%s'),
(19, NULL, '年检到期',  '高',   '车辆年检即将到期',           '本田雅阁年检将于30天内到期',                  NULL,                       NULL,    NULL,     NULL,  '30 天',    '25 天',    '未处理', NULL,            NULL, NULL, '%s'),
(3,  3,  '急刹车',     '中',   '紧急制动告警',               '车辆发生紧急制动，减速度超过阈值',            '北京市朝阳区东三环',       39.9300, 116.4700, 68.00, '0.6g',     '0.75g',    '已忽略', '调度中心李主管', '%s', '正常避让行为', '%s'),
(6,  6,  '急加速',     '低',   '急加速提醒',                 '车辆急加速，加速度超过阈值',                  '北京市朝阳区望京街道',     39.9932, 116.4805, 15.00, '0.4g',     '0.52g',    '已忽略', '调度中心李主管', '%s', '正常起步加速', '%s'),
(10, 10, '围栏越界',   '高',   '大客车越出电子围栏',         '车辆驶出预设电子围栏区域',                    '北京市昌平区北六环外',     40.1500, 116.3500, 55.00, '围栏半径30km', '32km', '已处理', '调度中心李主管', '%s', '临时绕路已确认', '%s'),
(7,  7,  '超速',       '中',   '货车超速告警',               '车辆在限速80km/h路段行驶速度达到95km/h',     '北京市朝阳区机场高速',     40.0500, 116.5500, 95.00, '80 km/h',  '95 km/h',  '已处理', '调度中心李主管', '%s', '已通知驾驶员', '%s'),
(2,  2,  '超速',       '中',   '电动车超速提醒',             '车辆在限速100km/h路段行驶速度达到112km/h',    '大兴机场高速',             39.5100, 116.4200, 112.00, '100 km/h', '112 km/h', '未处理', NULL,            NULL, NULL, '%s'),
(14, 14, '异常停留',   '低',   '车辆异常停留',               '车辆在维修站停留超过72小时',                  '福田特约维修站',           39.8600, 116.2800, 0.00,  '24 小时',  '96 小时',  '已处理', '车管员小王',    '%s', '发动机维修中属正常', '%s'),
(8,  8,  '急刹车',     '中',   '紧急制动告警',               '车辆发生紧急制动',                           '北京市昌平区立汤路',       40.0600, 116.3600, 55.00, '0.6g',     '0.68g',    '未处理', NULL,            NULL, NULL, '%s'),
(11, 11, '保养到期',   '低',   '保养提醒',                   '比亚迪秦PLUS距下次保养里程即将到达',         NULL,                       NULL,    NULL,     NULL,  '30000 km', '28500 km', '未处理', NULL,            NULL, NULL, '%s'),
(12, 12, '保险到期',   '高',   '保险即将到期',               '奔驰E300L交强险将于60天内到期',              NULL,                       NULL,    NULL,     NULL,  '60 天',    '55 天',    '未处理', NULL,            NULL, NULL, '%s'),
(16, 16, '超速',       '低',   '城区超速提醒',               '车辆在限速60km/h路段行驶速度达到68km/h',     '北京市朝阳区东三环',       39.8800, 116.4900, 68.00, '60 km/h',  '68 km/h',  '已忽略', '调度中心',      '%s', '轻微超速已忽略', '%s'),
(17, 17, '急刹车',     '中',   '紧急制动告警',               '车辆在CBD区域发生紧急制动',                  '北京市朝阳区CBD',          39.9100, 116.4600, 45.00, '0.6g',     '0.72g',    '未处理', NULL,            NULL, NULL, '%s'),
(18, 18, '设备离线',   '低',   'GPS信号弱',                  '电动货车GPS信号弱，位置精度下降',            '地下车库',                 39.8600, 116.2800, 0.00,  '正常',     '信号弱',   '已忽略', '车管员',        '%s', '地下车库信号遮挡', '%s');
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

	// 创建新版本
	if err := db.Table("what_reverse_workspace_versions").Create(map[string]interface{}{
		"id":           versionID.String(),
		"workspace_id": wsID.String(),
		"version":      "1.0.0",
		"changelog":    "智慧车队管理系统 - 初始版本",
		"ui_schema":    string(schemaJSON),
		"created_by":   ownerID.String(),
		"created_at":   now,
	}).Error; err != nil {
		return fmt.Errorf("创建版本: %w", err)
	}
	fmt.Println("  📦 已创建版本 v1.0.0")

	// 更新 workspace: 设置当前版本、发布状态、名称
	if err := db.Table("what_reverse_workspaces").
		Where("id = ?", wsID.String()).
		Updates(map[string]interface{}{
			"current_version_id": versionID.String(),
			"app_status":         "published",
			"published_at":       now,
			"name":               "智慧车队管理系统",
			"slug":               "fleet",
			"icon":               "🚛",
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
		"app_name":           "智慧车队管理系统",
		"default_page":       "dashboard",
		"navigation": map[string]interface{}{
			"type": "sidebar",
		},
		"theme": map[string]interface{}{
			"primary_color": "#2563eb",
			"border_radius": "0.5rem",
		},
		"pages": []interface{}{
			// ====== 1. 仪表盘 ======
			buildDashboardPage(),
			// ====== 2. 车辆管理 ======
			buildVehiclesPage(),
			// ====== 3. 驾驶员管理 ======
			buildDriversPage(),
			// ====== 4. 行程记录 ======
			map[string]interface{}{
				"id":    "trips",
				"title": "行程记录",
				"route": "/trips",
				"icon":  "MapPin",
				"blocks": []interface{}{
					map[string]interface{}{
						"id": "trips_table", "type": "data_table",
						"config": map[string]interface{}{
							"table_name": "trips",
							"columns": []interface{}{
								map[string]interface{}{"key": "trip_no", "label": "编号", "type": "text", "sortable": true},
								map[string]interface{}{"key": "vehicle_id", "label": "车辆ID", "type": "number"},
								map[string]interface{}{"key": "driver_id", "label": "驾驶员ID", "type": "number"},
								map[string]interface{}{"key": "start_location", "label": "出发地", "type": "text"},
								map[string]interface{}{"key": "end_location", "label": "目的地", "type": "text"},
								map[string]interface{}{"key": "distance_km", "label": "距离(km)", "type": "number", "sortable": true},
								map[string]interface{}{"key": "purpose", "label": "目的", "type": "text"},
								map[string]interface{}{"key": "status", "label": "状态", "type": "badge"},
								map[string]interface{}{"key": "start_time", "label": "出发时间", "type": "date", "sortable": true},
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
				"title": "路线管理",
				"route": "/routes",
				"icon":  "Globe",
				"blocks": []interface{}{
					map[string]interface{}{
						"id": "routes_table", "type": "data_table",
						"config": map[string]interface{}{
							"table_name": "routes",
							"columns": []interface{}{
								map[string]interface{}{"key": "name", "label": "路线名称", "type": "text", "sortable": true},
								map[string]interface{}{"key": "route_code", "label": "编号", "type": "text"},
								map[string]interface{}{"key": "start_point", "label": "起点", "type": "text"},
								map[string]interface{}{"key": "end_point", "label": "终点", "type": "text"},
								map[string]interface{}{"key": "distance_km", "label": "距离(km)", "type": "number", "sortable": true},
								map[string]interface{}{"key": "route_type", "label": "类型", "type": "badge"},
								map[string]interface{}{"key": "status", "label": "状态", "type": "badge"},
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
				"title": "维修保养",
				"route": "/maintenance",
				"icon":  "Settings",
				"blocks": []interface{}{
					map[string]interface{}{
						"id": "stat_pending_maintenance", "type": "stats_card",
						"grid": map[string]interface{}{"col_span": 1},
						"config": map[string]interface{}{
							"label": "待处理工单", "value_key": "count", "icon": "Clock", "color": "amber",
						},
						"data_source": map[string]interface{}{
							"table": "maintenance_records", "where": "status = '待处理'",
							"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
						},
					},
					map[string]interface{}{
						"id": "stat_in_progress_maintenance", "type": "stats_card",
						"grid": map[string]interface{}{"col_span": 1},
						"config": map[string]interface{}{
							"label": "进行中", "value_key": "count", "icon": "Settings", "color": "blue",
						},
						"data_source": map[string]interface{}{
							"table": "maintenance_records", "where": "status = '进行中'",
							"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
						},
					},
					map[string]interface{}{
						"id": "stat_completed_maintenance", "type": "stats_card",
						"grid": map[string]interface{}{"col_span": 1},
						"config": map[string]interface{}{
							"label": "已完成", "value_key": "count", "icon": "CheckCircle", "color": "green",
						},
						"data_source": map[string]interface{}{
							"table": "maintenance_records", "where": "status = '已完成'",
							"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
						},
					},
					map[string]interface{}{
						"id": "stat_total_maintenance", "type": "stats_card",
						"grid": map[string]interface{}{"col_span": 1},
						"config": map[string]interface{}{
							"label": "工单总数", "value_key": "count", "icon": "Briefcase", "color": "default",
						},
						"data_source": map[string]interface{}{
							"table":       "maintenance_records",
							"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
						},
					},
					map[string]interface{}{
						"id": "maintenance_type_chart", "type": "chart",
						"label": "维修类型分布",
						"grid":  map[string]interface{}{"col_span": 2},
						"config": map[string]interface{}{
							"chart_type": "pie", "title": "维修类型分布",
							"x_key": "maintenance_type", "y_key": "count", "category_key": "maintenance_type",
						},
						"data_source": map[string]interface{}{"table": "maintenance_records", "limit": 100},
					},
					map[string]interface{}{
						"id": "maintenance_table", "type": "data_table",
						"config": map[string]interface{}{
							"table_name": "maintenance_records",
							"columns": []interface{}{
								map[string]interface{}{"key": "record_no", "label": "工单号", "type": "text", "sortable": true},
								map[string]interface{}{"key": "vehicle_id", "label": "车辆ID", "type": "number"},
								map[string]interface{}{"key": "maintenance_type", "label": "类型", "type": "badge"},
								map[string]interface{}{"key": "service_provider", "label": "服务商", "type": "text"},
								map[string]interface{}{"key": "cost", "label": "费用(元)", "type": "number", "sortable": true},
								map[string]interface{}{"key": "status", "label": "状态", "type": "badge"},
								map[string]interface{}{"key": "start_date", "label": "开始日期", "type": "date", "sortable": true},
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
				"title": "加油记录",
				"route": "/fuel",
				"icon":  "Zap",
				"blocks": []interface{}{
					map[string]interface{}{
						"id": "fuel_type_chart", "type": "chart",
						"label": "燃料类型费用分布",
						"grid":  map[string]interface{}{"col_span": 2},
						"config": map[string]interface{}{
							"chart_type": "pie", "title": "燃料类型费用分布",
							"x_key": "fuel_type", "y_key": "count", "category_key": "fuel_type",
						},
						"data_source": map[string]interface{}{"table": "fuel_records", "limit": 200},
					},
					map[string]interface{}{
						"id": "fuel_table", "type": "data_table",
						"config": map[string]interface{}{
							"table_name": "fuel_records",
							"columns": []interface{}{
								map[string]interface{}{"key": "vehicle_id", "label": "车辆ID", "type": "number"},
								map[string]interface{}{"key": "fuel_type", "label": "燃料类型", "type": "badge"},
								map[string]interface{}{"key": "quantity", "label": "加油量", "type": "number"},
								map[string]interface{}{"key": "unit_price", "label": "单价(元)", "type": "number"},
								map[string]interface{}{"key": "total_cost", "label": "总费用(元)", "type": "number", "sortable": true},
								map[string]interface{}{"key": "gas_station", "label": "加油站", "type": "text"},
								map[string]interface{}{"key": "fuel_date", "label": "日期", "type": "date", "sortable": true},
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
				"title": "违章记录",
				"route": "/violations",
				"icon":  "AlertTriangle",
				"blocks": []interface{}{
					map[string]interface{}{
						"id": "violations_table", "type": "data_table",
						"config": map[string]interface{}{
							"table_name": "violations",
							"columns": []interface{}{
								map[string]interface{}{"key": "vehicle_id", "label": "车辆ID", "type": "number"},
								map[string]interface{}{"key": "driver_id", "label": "驾驶员ID", "type": "number"},
								map[string]interface{}{"key": "violation_type", "label": "违章类型", "type": "text"},
								map[string]interface{}{"key": "fine_amount", "label": "罚款(元)", "type": "number", "sortable": true},
								map[string]interface{}{"key": "deduction_points", "label": "扣分", "type": "number"},
								map[string]interface{}{"key": "status", "label": "状态", "type": "badge"},
								map[string]interface{}{"key": "violation_date", "label": "违章时间", "type": "date", "sortable": true},
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
				"title": "保险管理",
				"route": "/insurance",
				"icon":  "Briefcase",
				"blocks": []interface{}{
					map[string]interface{}{
						"id": "insurance_table", "type": "data_table",
						"config": map[string]interface{}{
							"table_name": "insurance_policies",
							"columns": []interface{}{
								map[string]interface{}{"key": "vehicle_id", "label": "车辆ID", "type": "number"},
								map[string]interface{}{"key": "policy_no", "label": "保单号", "type": "text"},
								map[string]interface{}{"key": "insurance_company", "label": "保险公司", "type": "text"},
								map[string]interface{}{"key": "insurance_type", "label": "险种", "type": "badge"},
								map[string]interface{}{"key": "premium", "label": "保费(元)", "type": "number", "sortable": true},
								map[string]interface{}{"key": "status", "label": "状态", "type": "badge"},
								map[string]interface{}{"key": "end_date", "label": "到期日", "type": "date", "sortable": true},
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
				"title": "告警中心",
				"route": "/alerts",
				"icon":  "Activity",
				"blocks": []interface{}{
					map[string]interface{}{
						"id": "stat_unhandled", "type": "stats_card",
						"grid": map[string]interface{}{"col_span": 1},
						"config": map[string]interface{}{
							"label": "未处理", "value_key": "count", "icon": "AlertTriangle", "color": "red",
						},
						"data_source": map[string]interface{}{
							"table": "alerts", "where": "status = '未处理'",
							"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
						},
					},
					map[string]interface{}{
						"id": "stat_handling", "type": "stats_card",
						"grid": map[string]interface{}{"col_span": 1},
						"config": map[string]interface{}{
							"label": "处理中", "value_key": "count", "icon": "Clock", "color": "amber",
						},
						"data_source": map[string]interface{}{
							"table": "alerts", "where": "status = '处理中'",
							"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
						},
					},
					map[string]interface{}{
						"id": "stat_handled", "type": "stats_card",
						"grid": map[string]interface{}{"col_span": 1},
						"config": map[string]interface{}{
							"label": "已处理", "value_key": "count", "icon": "CheckCircle", "color": "green",
						},
						"data_source": map[string]interface{}{
							"table": "alerts", "where": "status = '已处理'",
							"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
						},
					},
					map[string]interface{}{
						"id": "stat_ignored", "type": "stats_card",
						"grid": map[string]interface{}{"col_span": 1},
						"config": map[string]interface{}{
							"label": "已忽略", "value_key": "count", "icon": "Star", "color": "default",
						},
						"data_source": map[string]interface{}{
							"table": "alerts", "where": "status = '已忽略'",
							"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
						},
					},
					map[string]interface{}{
						"id": "alert_severity_chart", "type": "chart",
						"label": "告警严重程度分布",
						"grid":  map[string]interface{}{"col_span": 2},
						"config": map[string]interface{}{
							"chart_type":   "pie",
							"title":        "告警严重程度分布",
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
								map[string]interface{}{"key": "title", "label": "告警标题", "type": "text"},
								map[string]interface{}{"key": "alert_type", "label": "类型", "type": "badge"},
								map[string]interface{}{"key": "severity", "label": "等级", "type": "badge"},
								map[string]interface{}{"key": "location", "label": "位置", "type": "text"},
								map[string]interface{}{"key": "status", "label": "状态", "type": "badge"},
								map[string]interface{}{"key": "handler", "label": "处理人", "type": "text"},
								map[string]interface{}{"key": "alert_time", "label": "告警时间", "type": "date", "sortable": true},
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
		"id": "dashboard", "title": "仪表盘", "route": "/dashboard", "icon": "LayoutDashboard",
		"blocks": []interface{}{
			map[string]interface{}{
				"id": "stat_total_vehicles", "type": "stats_card",
				"grid": map[string]interface{}{"col_span": 1},
				"config": map[string]interface{}{
					"label": "车辆总数", "value_key": "count", "icon": "Truck", "color": "blue",
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
					"label": "在线车辆", "value_key": "count", "icon": "CheckCircle", "color": "green",
				},
				"data_source": map[string]interface{}{
					"table": "vehicles", "where": "status = '在线'",
					"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
				},
			},
			map[string]interface{}{
				"id": "stat_total_drivers", "type": "stats_card",
				"grid": map[string]interface{}{"col_span": 1},
				"config": map[string]interface{}{
					"label": "驾驶员总数", "value_key": "count", "icon": "Users", "color": "default",
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
					"label": "待处理告警", "value_key": "count", "icon": "AlertTriangle", "color": "red",
				},
				"data_source": map[string]interface{}{
					"table": "alerts", "where": "status = '未处理'",
					"aggregation": []interface{}{map[string]interface{}{"function": "count", "column": "id", "alias": "count"}},
				},
			},
			map[string]interface{}{
				"id": "vehicle_status_chart", "type": "chart",
				"label": "车辆状态分布",
				"grid":  map[string]interface{}{"col_span": 2},
				"config": map[string]interface{}{
					"chart_type": "pie", "title": "车辆状态分布",
					"x_key": "status", "y_key": "count", "category_key": "status",
				},
				"data_source": map[string]interface{}{"table": "vehicles", "limit": 100},
			},
			map[string]interface{}{
				"id": "vehicle_type_chart", "type": "chart",
				"label": "车辆类型分布",
				"grid":  map[string]interface{}{"col_span": 2},
				"config": map[string]interface{}{
					"chart_type": "pie", "title": "车辆类型分布",
					"x_key": "vehicle_type", "y_key": "count", "category_key": "vehicle_type",
				},
				"data_source": map[string]interface{}{"table": "vehicles", "limit": 100},
			},
			map[string]interface{}{
				"id": "fuel_consumption_chart", "type": "chart",
				"label": "燃料消费分布",
				"grid":  map[string]interface{}{"col_span": 2},
				"config": map[string]interface{}{
					"chart_type": "pie", "title": "燃料消费分布",
					"x_key": "fuel_type", "y_key": "count", "category_key": "fuel_type",
				},
				"data_source": map[string]interface{}{"table": "fuel_records", "limit": 200},
			},
			map[string]interface{}{
				"id": "alert_type_chart", "type": "chart",
				"label": "告警类型分布",
				"grid":  map[string]interface{}{"col_span": 2},
				"config": map[string]interface{}{
					"chart_type": "pie", "title": "告警类型分布",
					"x_key": "alert_type", "y_key": "count", "category_key": "alert_type",
				},
				"data_source": map[string]interface{}{"table": "alerts", "limit": 100},
			},
			map[string]interface{}{
				"id": "recent_trips", "type": "data_table", "label": "最近行程",
				"config": map[string]interface{}{
					"table_name": "trips",
					"columns": []interface{}{
						map[string]interface{}{"key": "trip_no", "label": "行程编号", "type": "text"},
						map[string]interface{}{"key": "start_location", "label": "出发地", "type": "text"},
						map[string]interface{}{"key": "end_location", "label": "目的地", "type": "text"},
						map[string]interface{}{"key": "distance_km", "label": "距离(km)", "type": "number"},
						map[string]interface{}{"key": "status", "label": "状态", "type": "badge"},
						map[string]interface{}{"key": "start_time", "label": "出发时间", "type": "date"},
					},
					"page_size": 10, "pagination": true, "search_enabled": true, "search_key": "trip_no",
					"actions": []interface{}{"view"},
				},
				"data_source": map[string]interface{}{
					"table": "trips", "order_by": []interface{}{map[string]interface{}{"column": "start_time", "direction": "DESC"}},
				},
			},
			map[string]interface{}{
				"id": "recent_alerts", "type": "data_table", "label": "最新告警",
				"config": map[string]interface{}{
					"table_name": "alerts",
					"columns": []interface{}{
						map[string]interface{}{"key": "title", "label": "告警标题", "type": "text"},
						map[string]interface{}{"key": "alert_type", "label": "类型", "type": "badge"},
						map[string]interface{}{"key": "severity", "label": "等级", "type": "badge"},
						map[string]interface{}{"key": "status", "label": "状态", "type": "badge"},
						map[string]interface{}{"key": "alert_time", "label": "告警时间", "type": "date"},
					},
					"page_size": 5,
					"actions":   []interface{}{"view"},
				},
				"data_source": map[string]interface{}{
					"table": "alerts", "order_by": []interface{}{map[string]interface{}{"column": "alert_time", "direction": "DESC"}}, "limit": 5,
				},
			},
		},
	}
}

func buildVehiclesPage() map[string]interface{} {
	return map[string]interface{}{
		"id": "vehicles", "title": "车辆管理", "route": "/vehicles", "icon": "Truck",
		"blocks": []interface{}{
			map[string]interface{}{
				"id": "vehicles_table", "type": "data_table",
				"config": map[string]interface{}{
					"table_name": "vehicles",
					"columns": []interface{}{
						map[string]interface{}{"key": "plate_number", "label": "车牌号", "type": "text", "sortable": true},
						map[string]interface{}{"key": "brand", "label": "品牌", "type": "text"},
						map[string]interface{}{"key": "model", "label": "型号", "type": "text"},
						map[string]interface{}{"key": "vehicle_type", "label": "类型", "type": "badge"},
						map[string]interface{}{"key": "fuel_type", "label": "燃料", "type": "badge"},
						map[string]interface{}{"key": "mileage", "label": "里程(km)", "type": "number", "sortable": true},
						map[string]interface{}{"key": "department", "label": "部门", "type": "text"},
						map[string]interface{}{"key": "status", "label": "状态", "type": "badge"},
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
		"id": "drivers", "title": "驾驶员", "route": "/drivers", "icon": "Users",
		"blocks": []interface{}{
			map[string]interface{}{
				"id": "drivers_table", "type": "data_table",
				"config": map[string]interface{}{
					"table_name": "drivers",
					"columns": []interface{}{
						map[string]interface{}{"key": "name", "label": "姓名", "type": "text", "sortable": true},
						map[string]interface{}{"key": "phone", "label": "电话", "type": "text"},
						map[string]interface{}{"key": "license_type", "label": "驾照类型", "type": "badge"},
						map[string]interface{}{"key": "department", "label": "部门", "type": "text"},
						map[string]interface{}{"key": "driving_years", "label": "驾龄(年)", "type": "number"},
						map[string]interface{}{"key": "rating", "label": "评分", "type": "number"},
						map[string]interface{}{"key": "violation_count", "label": "违章次数", "type": "number"},
						map[string]interface{}{"key": "status", "label": "状态", "type": "badge"},
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
