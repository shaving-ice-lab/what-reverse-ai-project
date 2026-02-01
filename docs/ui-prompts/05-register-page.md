# 05 - 注册页面

**目标文件**: `apps/web/src/app/(auth)/register/page.tsx`

---

```
/ui-ux-pro-max

请重构 AgentFlow 的注册页面，使用 Manus 风格的深色 AI 主题。

## 文件位置
- apps/web/src/app/(auth)/register/page.tsx

## 设计规范
参考：
- design-system/agentflow/MASTER.md
- design-system/agentflow/pages/auth.md

## 设计要求

### 布局
- 与登录页面保持一致的卡片样式
- max-width: 400px

### 组件结构

1. **Logo/品牌** (同登录页)

2. **标题**
   - 文字: "创建账户"
   - font-size: 20px, font-weight: 600

3. **副标题**
   - 文字: "开始构建你的 AI 工作流"
   - font-size: 14px, color: #A1A1AA

4. **社交注册按钮** (同登录页)

5. **分割线**
   - 文字: "或使用邮箱注册"

6. **用户名输入框**
   - Label: "用户名"
   - placeholder: "your-username"

7. **邮箱输入框**
   - Label: "邮箱"
   - placeholder: "name@example.com"

8. **密码输入框**
   - Label: "密码"
   - 下方显示密码强度指示器 (弱/中/强)
   - 弱: 红色, 中: 黄色, 强: 绿色

9. **确认密码输入框**
   - Label: "确认密码"

10. **服务条款复选框**
    - "我已阅读并同意 [服务条款] 和 [隐私政策]"
    - 链接颜色: #8B5CF6

11. **注册按钮**
    - 文字: "创建账户"
    - 紫色渐变背景

12. **底部登录链接**
    - 文字: "已有账户? 立即登录"

### 密码强度指示器

<div className="flex gap-1 mt-2">
  <div className={`h-1 flex-1 rounded ${strength >= 1 ? 'bg-red-500' : 'bg-zinc-700'}`} />
  <div className={`h-1 flex-1 rounded ${strength >= 2 ? 'bg-yellow-500' : 'bg-zinc-700'}`} />
  <div className={`h-1 flex-1 rounded ${strength >= 3 ? 'bg-green-500' : 'bg-zinc-700'}`} />
</div>
<p className="text-xs text-zinc-500 mt-1">
  {strength === 1 && '弱'}
  {strength === 2 && '中'}
  {strength === 3 && '强'}
</p>

### 表单验证
- 用户名: 3-20 字符，只能包含字母、数字、下划线
- 邮箱: 有效邮箱格式
- 密码: 至少 8 位，包含大小写和数字
- 确认密码: 与密码一致
- 服务条款: 必须勾选

保持原有的注册逻辑和 API 调用不变。
```
