# 智慧车队管理系统 — Prompt 测试文档

## 测试目标

验证 Agent 在收到用户 prompt 后，能否通过现有工具链生成与 seed 数据一致的智慧车队管理系统，包括：

- 11 张数据库表（含索引）
- 10+ 页面（含 Dashboard、日历视图、详情页、表单弹窗）
- 高级 block 功能（lookup 列、status_actions 工作流、动态选项）
- 示例数据填充

---

## 测试 Prompt（用户输入）

```
帮我构建一个新加坡智慧车队管理系统（SG Fleet Management），要求如下：

核心模块：
1. 用车预定（主模块）：日历视图 + 预定列表 + 新建预定弹窗 + 审批/驳回/开始/完成工作流 + 预定详情页
2. 仪表盘：车辆总数/在线车辆/司机总数/待处理告警/待审批预定 KPI + 车辆状态/类型/油耗/告警类型饼图 + 最近行程/告警/预定表格
3. 车辆管理：车辆列表（车牌号/品牌/型号/类型/油种/里程/部门/状态）+ CRUD + 搜索 + 筛选
4. 驾驶员管理：司机列表（姓名/电话/驾照类型/部门/驾龄/评分/违章次数/状态）+ CRUD
5. 行程记录：行程列表（关联车辆和司机 lookup 列）+ CRUD
6. 路线管理：路线列表 + CRUD
7. 维修保养：待处理/进行中/已完成/总数 KPI + 类型分布饼图 + 维修工单表（关联车辆 lookup）
8. 加油记录：油费类型饼图 + 加油表（关联车辆 lookup）
9. 违章记录：违章表（关联车辆和司机 lookup）
10. 保险管理：保单表（关联车辆 lookup）
11. 告警中心：未处理/处理中/已处理/已忽略 KPI + 严重程度分布饼图 + 告警表

数据表要求：
- vehicles: 车牌号/VIN/品牌/型号/类型/颜色/发动机号/购入日期/价格/里程/油种/油箱容量/座位数/状态/部门/GPS设备/年检日期/保险到期日
- drivers: 姓名/性别/电话/身份证/驾照号/驾照类型/驾照到期/入职日期/部门/状态/分配车辆/紧急联系人/地址/驾龄/违章次数/事故次数/评分
- routes: 路线名称/编码/起点/终点/途经点/距离/预计时间/类型/状态
- trips: 行程号/车辆ID/司机ID/路线ID/出发时间/到达时间/起点/终点/起始里程/结束里程/距离/油耗/用途/状态/乘客数/货物重量/最高速度/平均速度
- maintenance_records: 工单号/车辆ID/维修类型/描述/服务商/维修时里程/费用/配件费/人工费/开始日期/结束日期/下次维修日期/下次维修里程/状态/质量评分
- fuel_records: 车辆ID/司机ID/加油日期/油种/数量/单价/总费用/加油时里程/加油站/支付方式/发票号/是否满箱
- violations: 车辆ID/司机ID/违章日期/地点/类型/代码/罚款/扣分/状态/处理人/处理日期/证据URL
- insurance_policies: 车辆ID/保单号/保险公司/类型/保费/保额/开始日期/到期日期/状态/理赔次数/理赔总额/代理人/代理电话
- reservations: 预定号/申请人/部门/电话/车辆ID/司机ID/用途/乘客数/开始时间/结束时间/起点/终点/路线ID/状态/优先级/审批人/审批时间/驳回原因/实际开始/实际结束/实际里程
- alerts: 车辆ID/司机ID/类型/严重程度/标题/描述/位置/经纬度/速度/阈值/实际值/状态/处理人/处理时间/处理结果/告警时间
- vehicle_capabilities: 车辆ID/能力标签/描述（用于智能匹配可用车辆）

用车预定特殊要求：
- 日历视图：显示预定时间范围，按状态着色（Pending=琥珀色, Approved=绿色, In Progress=蓝色, Completed=灰色, Rejected=红色, Cancelled=灰色），点击跳转详情页
- 新建预定弹窗：带动态选项（需求标签从 API 获取，车辆根据需求+时间自动匹配）
- 审批工作流：Pending→Approve/Reject(需填驳回原因)→Start Trip→Complete / Cancel

每个表至少插入 5-10 条示例数据，使用新加坡真实地名（Raffles Place, Marina Bay, Orchard Road 等）和车牌格式（SBA1234A）。
```

---

## 预期 Tool Call 序列

### Phase 0 — Assessment

```
Step 1: get_workspace_info → 了解当前数据库状态
Step 2: create_plan → 创建执行计划（约 15 步）
```

### Phase 1 — Plan

```
Plan:
  step_1: Create core tables (vehicles, drivers, routes) — batch
  step_2: Create trip & maintenance tables (trips, maintenance_records, fuel_records) — batch
  step_3: Create remaining tables (violations, insurance_policies, reservations, alerts, vehicle_capabilities) — batch
  step_4: Insert seed data for vehicles (8-10 rows)
  step_5: Insert seed data for drivers (6-8 rows)
  step_6: Insert seed data for routes, trips, maintenance_records — batch
  step_7: Insert seed data for fuel_records, violations, insurance_policies — batch
  step_8: Insert seed data for reservations, alerts, vehicle_capabilities — batch
  step_9: get_block_spec for data_table, calendar, form_dialog, stats_card, chart, detail_view
  step_10: generate_ui_schema — full AppSchema v2.0
  step_11: get_ui_schema → verify schema
  step_12: attempt_completion → validate
```

### Phase 2A — Data Layer

```
Step 3:  update_plan(step_1, in_progress)
Step 4:  batch([create_table(vehicles), create_table(drivers), create_table(routes)])
Step 5:  update_plan(step_1, completed)
Step 6:  update_plan(step_2, in_progress)
Step 7:  batch([create_table(trips), create_table(maintenance_records), create_table(fuel_records)])
Step 8:  update_plan(step_2, completed)
Step 9:  update_plan(step_3, in_progress)
Step 10: batch([create_table(violations), create_table(insurance_policies), create_table(reservations), create_table(alerts), create_table(vehicle_capabilities)])
Step 11: update_plan(step_3, completed)
Step 12: get_workspace_info → verify all 11 tables exist
Step 13-20: insert_data calls (batched where possible)
```

### Phase 2B — UI Layer

```
Step 21: update_plan(step_9, in_progress)
Step 22: batch([get_block_spec(data_table), get_block_spec(calendar), get_block_spec(form_dialog), get_block_spec(stats_card), get_block_spec(chart), get_block_spec(detail_view)])
Step 23: update_plan(step_9, completed)
Step 24: update_plan(step_10, in_progress)
Step 25: generate_ui_schema → full AppSchema with all 10+ pages
Step 26: update_plan(step_10, completed)
```

### Phase 2C — Verification

```
Step 27: get_ui_schema → read back schema
Step 28: attempt_completion → validate (table refs, navigation, data presence)
Step 29: If validation fails → fix specific issues → re-attempt
```

---

## 关键验证点（Checklist）

### 数据库层

- [ ] 11 张表全部创建成功
- [ ] vehicles 表包含 20+ 列（plate_number UNIQUE, status DEFAULT 'Online'）
- [ ] reservations 表包含 22+ 列（status DEFAULT 'Pending'）
- [ ] 每张表至少 5 条示例数据
- [ ] 使用新加坡地名和车牌格式

### UI Schema 结构

- [ ] app_schema_version = "2.0.0"
- [ ] navigation.type = "sidebar"
- [ ] default_page 设为 "reservations" 或 "dashboard"
- [ ] 至少 10 个页面

### 页面功能

- [ ] **Reservations 页**: 4 个 stats_card + calendar + 2 个 chart + form_dialog + data_table
- [ ] **Calendar**: start_key/end_key 支持时间范围, status_colors 按状态着色, click_action 跳转详情
- [ ] **Form Dialog**: dynamic_options 动态选项, depends_on 依赖刷新
- [ ] **Data Table**: status_actions 审批工作流 (Approve/Reject/Start/Complete/Cancel)
- [ ] **Data Table**: lookup 列显示关联表数据（vehicle_id → plate_number）
- [ ] **Data Table**: row_click_action 行点击跳转详情页
- [ ] **Reservation Detail**: hidden page + detail_view + record_id_param
- [ ] **Dashboard**: 5 个 stats_card + 4 个 chart + 3 个 mini data_table
- [ ] **Maintenance**: 4 个 stats_card + pie chart + data_table
- [ ] **Alerts**: 4 个 stats_card + pie chart + data_table

### 高级功能

- [ ] stats_card 使用 aggregation + where 过滤（如 status = 'Pending'）
- [ ] chart 使用 category_key 做自动分组聚合
- [ ] form_dialog 字段使用 options as {label, value} 对象格式
- [ ] form_dialog 字段使用 dynamic_options.depends_on
- [ ] data_table status_actions 包含 extra_fields（Reject 需填原因）
- [ ] data_source.order_by 使用数组格式 [{"column":"x","direction":"DESC"}]
- [ ] hidden: true 用于详情页

---

## 修复前 vs 修复后对比

| 功能                        | 修复前（LLM 无法生成）                         | 修复后（LLM 可生成）                                                                  |
| --------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| lookup 列                   | block_spec 只有 text/number/date/boolean/badge | ✅ 新增 lookup 类型 + lookup_table/lookup_key/display_key                             |
| status_actions              | block_spec 完全没有                            | ✅ 新增完整工作流规范 + 示例                                                          |
| calendar 完整功能           | 只有 date_key/title_key/color_key              | ✅ start_key/end_key/status_key/detail_fields/status_colors/click_action/default_view |
| form_dialog dynamic_options | 只有静态 options 字符串数组                    | ✅ dynamic_options.api/label_key/value_key/depends_on + options as {label,value}      |
| form_dialog dialog_size     | 没有                                           | ✅ 新增                                                                               |
| hidden pages                | prompt 未提及                                  | ✅ AppSchema spec 新增说明                                                            |
| order_by 格式               | 只有字符串格式                                 | ✅ 数组格式 [{"column","direction"}]                                                  |

---

## 结论

修复后，Agent 的 block_spec 工具和 system prompt 已包含生成完整智慧车队管理系统所需的所有信息。LLM 只需：

1. 调用 `get_block_spec` 获取 `data_table`、`calendar`、`form_dialog` 的完整规范
2. 按规范生成包含 lookup 列、status_actions、dynamic_options 等高级功能的 UI Schema
3. 使用 `hidden: true` 创建详情页
4. 使用数组格式的 `order_by`

预计生成质量：**90%+ 功能覆盖率**（剩余 10% 为 UI 微调，如具体的 status_colors CSS 类名、图标选择等，属于美化而非功能缺失）。
