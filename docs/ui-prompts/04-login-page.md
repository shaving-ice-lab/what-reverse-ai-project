# 04 - 登录页面

**目标文件**: `apps/web/src/app/(auth)/login/page.tsx`

---

```
/ui-ux-pro-max

请重构 AgentFlow 的登录页面，使用 Manus 风格的深色 AI 主题。

## 文件位置
- apps/web/src/app/(auth)/login/page.tsx

## 设计规范
参考：
- design-system/agentflow/MASTER.md
- design-system/agentflow/pages/auth.md

## 设计要求

### 卡片容器
- max-width: 400px
- 背景: rgba(24, 24, 27, 0.9)
- backdrop-filter: blur(16px)
- 边框: 1px solid #27272A
- 圆角: 16px
- padding: 32px
- 入场动画: fadeInUp 300ms

### 组件结构

1. **Logo/品牌**
   - 图标或文字 Logo
   - font-size: 24px, font-weight: 700
   - margin-bottom: 24px

2. **标题**
   - 文字: "欢迎回来"
   - font-size: 20px, font-weight: 600
   - color: #FAFAFA

3. **副标题**
   - 文字: "登录以继续使用 AgentFlow"
   - font-size: 14px
   - color: #A1A1AA
   - margin-bottom: 24px

4. **社交登录按钮** (并排)
   - GitHub 按钮 + Google 按钮
   - 背景: #18181B
   - 边框: 1px solid #3F3F46
   - hover: 背景 #27272A
   - 图标 + 文字

5. **分割线**
   - 文字: "或使用邮箱登录"
   - 两侧横线 (#3F3F46)
   - color: #71717A
   - font-size: 12px
   - margin: 24px 0

6. **邮箱输入框**
   - Label: "邮箱"
   - placeholder: "name@example.com"

7. **密码输入框**
   - Label: "密码" + 右侧 "忘记密码?" 链接
   - type: password
   - 忘记密码链接: color #8B5CF6

8. **登录按钮**
   - 文字: "登录"
   - 全宽
   - 紫色渐变背景
   - hover: 发光效果 + translateY(-1px)

9. **底部注册链接**
   - 文字: "还没有账户? 立即注册"
   - "立即注册" 链接: color #8B5CF6
   - margin-top: 24px, text-align: center

### 交互效果
- 输入框 focus: 紫色边框 + 发光阴影
- 按钮 hover: box-shadow: 0 0 20px rgba(139, 92, 246, 0.4)
- 链接 hover: color #A78BFA
- 表单提交时按钮显示 loading 状态

### 表单验证
- 邮箱格式验证
- 密码不能为空
- 错误提示使用红色文字

保持原有的登录逻辑和 API 调用不变。
```
