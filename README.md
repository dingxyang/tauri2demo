# 西语桌面助手

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


## TODO
- [ ] 移动端布局样式兼容问题
- [ ] 移动端选中文本失效
- [ ] 使用 openai 的 api
