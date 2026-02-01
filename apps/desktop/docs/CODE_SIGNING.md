# AgentFlow 代码签名配置指南

本文档介绍如何为 AgentFlow 桌面应用配置代码签名。

## 概述

代码签名是确保应用完整性和来源可信的重要步骤：
- **Windows**: 防止"未知发布者"警告
- **macOS**: 满足 Gatekeeper 要求，允许用户安装非 App Store 应用
- **Linux**: 可选的 RPM 包签名

## 环境变量配置

### Windows 代码签名

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `TAURI_SIGNING_PRIVATE_KEY` | 签名私钥（Base64 或文件路径） | `file:///path/to/key.pfx` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 私钥密码 | `your-password` |
| `TAURI_WINDOWS_SIGNTOOL_PATH` | signtool.exe 路径（可选） | `C:\Program Files (x86)\Windows Kits\10\bin\...` |

**获取 Windows 代码签名证书：**
1. 从证书颁发机构（如 DigiCert、Sectigo）购买代码签名证书
2. 或使用 Azure SignTool 进行云签名
3. 导出为 .pfx 格式

### macOS 代码签名

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `APPLE_CERTIFICATE` | Base64 编码的 .p12 证书 | `base64 -i certificate.p12` |
| `APPLE_CERTIFICATE_PASSWORD` | 证书导出密码 | `your-password` |
| `APPLE_SIGNING_IDENTITY` | 签名身份（可选，自动推断） | `Developer ID Application: Your Name (TEAM_ID)` |

**macOS 公证（Notarization）：**

| 变量名 | 说明 |
|--------|------|
| `APPLE_ID` | Apple ID 邮箱 |
| `APPLE_PASSWORD` | App 专用密码 |
| `APPLE_TEAM_ID` | 开发者团队 ID |

或使用 API Key 方式：

| 变量名 | 说明 |
|--------|------|
| `APPLE_API_KEY` | App Store Connect API 密钥 ID |
| `APPLE_API_ISSUER` | API 密钥发行者 ID |
| `APPLE_API_KEY_PATH` | API 密钥文件路径 |

### Linux RPM 签名（可选）

| 变量名 | 说明 |
|--------|------|
| `TAURI_SIGNING_RPM_KEY` | GPG 私钥 |
| `TAURI_SIGNING_RPM_KEY_PASSPHRASE` | GPG 密码 |

## 本地开发配置

### 1. 创建 .env 文件

在 `apps/desktop/` 目录创建 `.env.local` 文件（不要提交到 Git）：

```env
# Windows 签名（可选）
# TAURI_SIGNING_PRIVATE_KEY=file:///path/to/certificate.pfx
# TAURI_SIGNING_PRIVATE_KEY_PASSWORD=your-password

# macOS 签名（可选）
# APPLE_CERTIFICATE=<base64-encoded-certificate>
# APPLE_CERTIFICATE_PASSWORD=your-password
# APPLE_ID=your-apple-id@example.com
# APPLE_PASSWORD=xxxx-xxxx-xxxx-xxxx
# APPLE_TEAM_ID=XXXXXXXXXX
```

### 2. 生成 macOS 证书 Base64

```bash
# 导出证书为 .p12 文件后
base64 -i Certificates.p12 | pbcopy
# 粘贴到 APPLE_CERTIFICATE 环境变量
```

### 3. 创建 App 专用密码

1. 访问 [appleid.apple.com](https://appleid.apple.com)
2. 登录并进入"安全性"
3. 生成"App 专用密码"
4. 用于 `APPLE_PASSWORD` 环境变量

## CI/CD 配置

### GitHub Actions 示例

```yaml
name: Build and Sign

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Rust
        uses: dtolnay/rust-action@stable
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build Tauri app
        env:
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.WINDOWS_CERTIFICATE }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
        run: pnpm tauri build
        working-directory: apps/desktop

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Rust
        uses: dtolnay/rust-action@stable
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build Tauri app
        env:
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: pnpm tauri build
        working-directory: apps/desktop
```

### GitHub Secrets 配置

在仓库的 Settings > Secrets and variables > Actions 中添加：

| Secret 名称 | 说明 |
|-------------|------|
| `WINDOWS_CERTIFICATE` | Base64 编码的 .pfx 证书 |
| `WINDOWS_CERTIFICATE_PASSWORD` | 证书密码 |
| `APPLE_CERTIFICATE` | Base64 编码的 .p12 证书 |
| `APPLE_CERTIFICATE_PASSWORD` | 证书密码 |
| `APPLE_ID` | Apple ID |
| `APPLE_PASSWORD` | App 专用密码 |
| `APPLE_TEAM_ID` | 团队 ID |

## tauri.conf.json 配置说明

```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": null,  // 可选：证书指纹
      "digestAlgorithm": "sha256",    // 签名算法
      "timestampUrl": "http://timestamp.digicert.com"  // 时间戳服务器
    },
    "macOS": {
      "entitlements": "entitlements.plist",  // 权限配置
      "signingIdentity": null,  // 自动从环境变量推断
      "hardenedRuntime": true   // 强化运行时
    }
  }
}
```

## 跳过签名（开发环境）

如果不需要签名，可以设置环境变量跳过：

```bash
# 跳过 Windows 签名
export TAURI_SKIP_SIDECAR_SIGNATURE_CHECK=true

# 或在 package.json scripts 中
"build:unsigned": "TAURI_SKIP_SIDECAR_SIGNATURE_CHECK=true tauri build"
```

## 常见问题

### Windows: "应用无法验证"

确保：
1. 证书未过期
2. 时间戳服务器可访问
3. 证书链完整

### macOS: "无法打开应用"

1. 检查公证是否成功
2. 运行 `spctl -a -t exec -vv /path/to/App.app` 检查状态
3. 确保 entitlements.plist 配置正确

### macOS: 公证失败

1. 确保使用 Developer ID 证书（非 Mac App Store 证书）
2. 检查 Apple ID 两步验证和 App 专用密码
3. 查看 Notarization 日志获取详细错误

## 参考链接

- [Tauri Windows Code Signing](https://v2.tauri.app/distribute/sign/windows)
- [Tauri macOS Code Signing](https://v2.tauri.app/distribute/sign/macos/)
- [Apple Notarization](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Windows Authenticode](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)
