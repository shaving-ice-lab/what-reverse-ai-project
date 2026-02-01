# AgentFlow 应用图标

本目录包含 AgentFlow 桌面应用的图标资源。

## 图标文件说明

| 文件名 | 用途 | 尺寸 |
|--------|------|------|
| `app-icon.svg` | 源图标文件 | 矢量 |
| `32x32.png` | Windows 小图标 | 32x32 |
| `128x128.png` | 通用图标 | 128x128 |
| `128x128@2x.png` | Retina 显示屏 | 256x256 |
| `icon.ico` | Windows 应用图标 | 多尺寸 |
| `icon.icns` | macOS 应用图标 | 多尺寸 |

## 生成图标

### 方法 1: 使用 Tauri CLI (推荐)

```bash
# 在项目根目录执行
cd apps/desktop
pnpm tauri icon src-tauri/icons/app-icon.svg
```

### 方法 2: 使用 npm 包

```bash
# 安装图标生成工具
npm install -g @aspect/icon-gen

# 生成所有尺寸
icon-gen -i app-icon.svg -o . --ico --icns
```

### 方法 3: 使用 ImageMagick

```bash
# 安装 ImageMagick 后执行
# Linux/macOS
magick app-icon.svg -resize 32x32 32x32.png
magick app-icon.svg -resize 128x128 128x128.png
magick app-icon.svg -resize 256x256 128x128@2x.png
magick app-icon.svg -resize 256x256 icon.ico
magick app-icon.svg -resize 512x512 icon.icns

# Windows (使用 magick 命令)
magick convert app-icon.svg -resize 32x32 32x32.png
magick convert app-icon.svg -resize 128x128 128x128.png
magick convert app-icon.svg -resize 256x256 128x128@2x.png
```

### 方法 4: 在线工具

1. 访问 [CloudConvert](https://cloudconvert.com/svg-to-png) 或 [Convertio](https://convertio.co/)
2. 上传 `app-icon.svg`
3. 转换为 PNG 并下载各种尺寸
4. 使用 [ICO Convert](https://icoconvert.com/) 生成 .ico 文件
5. 使用 [iConvert Icons](https://iconverticons.com/) 生成 .icns 文件

## 图标设计规范

- **主色调**: 深蓝 (#1a365d) → 青色 (#0d9488) → 紫色 (#7c3aed)
- **风格**: 现代、简约、科技感
- **元素**: 节点连接图，代表工作流自动化
- **背景**: 渐变圆形

## 注意事项

1. 修改图标后需要重新构建应用
2. Windows 需要 .ico 格式，macOS 需要 .icns 格式
3. 确保图标在小尺寸下仍然清晰可辨识
