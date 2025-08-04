# -tauridemo

这是一个使用 Tauri + Vue 3 构建的跨平台应用，支持桌面端、Android 和 iOS。

## 功能特性

- 🏠 **主页**: 显示项目列表，支持点击查看详情
- 📱 **详情页**: 显示选中项目的详细文字描述
- 📱 **移动端支持**: 适配 Android 和 iOS 设备
- 🌙 **深色模式**: 自动适配系统深色模式
- 🎨 **现代化UI**: 美观的用户界面设计

## 开发环境要求

### 桌面端开发
- Node.js 18+
- Rust 1.70+
- pnpm

### 移动端开发

#### Android
- Android Studio
- Android SDK (API 21+)
- Java Development Kit (JDK) 11+

#### iOS
- macOS
- Xcode 14+
- iOS SDK 13.0+

## 安装依赖

```bash
pnpm install
```

## 开发运行

### 桌面端
```bash
pnpm tauri dev
```


### Android:
```
pnpm tauri android init
pnpm tauri android dev
# or if you want to dev on a real device
pnpm tauri android dev --host
```

### IOS
```bash
pnpm tauri ios init

pnpm tauri ios dev
```

## 构建应用

### 桌面端
```bash
pnpm tauri build
```

### 移动端
```bash
# Android APK
pnpm tauri android build

# iOS
pnpm tauri ios build
```

## 项目结构

```
tauri2demo/
├── src/                    # Vue 前端代码
│   ├── components/        # Vue 组件目录
│   │   ├── HomePage.vue   # 首页组件
│   │   ├── DetailPage.vue # 详情页组件
│   │   ├── AboutPage.vue  # 说明页组件
│   │   ├── BottomNav.vue  # 底部导航组件
│   │   └── index.ts       # 组件导出索引
│   ├── types/             # TypeScript 类型定义
│   │   └── index.ts       # 类型定义文件
│   ├── App.vue           # 主应用组件
│   ├── main.ts           # 应用入口
│   └── assets/           # 静态资源
├── src-tauri/            # Rust 后端代码
│   ├── src/              # Rust 源代码
│   ├── tauri.conf.json   # Tauri 配置
│   └── Cargo.toml        # Rust 依赖配置
└── package.json          # Node.js 依赖配置
```

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **后端**: Rust + Tauri
- **移动端**: Tauri Mobile (基于 WebView)
- **UI**: 原生 CSS + 响应式设计
- **架构**: 组件化设计 + 类型安全

## 许可证

MIT
