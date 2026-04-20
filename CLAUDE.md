# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**西语助手** — 基于 Tauri 2 + Vue 3 + Rust 的跨平台西班牙语学习应用，支持桌面端（macOS/Windows/Linux）和移动端（Android/iOS）。

## 常用命令

```bash
# 开发（同时启动前端开发服务器和 Tauri 后端）
pnpm dev

# 仅前端
pnpm start          # Vite 开发服务器，端口 31420
pnpm build          # vue-tsc 类型检查 + vite 构建

# Tauri
pnpm tauri dev      # Tauri 开发模式
pnpm tauri build    # 生产构建

# 移动端
pnpm tauri android dev / build
pnpm tauri ios dev / build
```

包管理器：**pnpm**（v10.19.0）。当前未配置测试框架。

## 架构

```
tauri2demo/
├── frontend/          # Vue 3 + TypeScript + Vite
│   └── src/
│       ├── pages/     # 4 个主页面：首页、词典、语音评测、设置
│       ├── layouts/   # DefaultLayout，包含底部导航栏
│       ├── stores/    # Pinia 状态管理（settings, translation）
│       ├── services/  # AI 客户端层（aiClientManager.ts）
│       ├── utils/     # 常量、i18n、localStorage 工具
│       └── langs/     # vue-i18n 多语言文件
└── backend/           # Rust（src-tauri/）
    └── src/
        ├── lib.rs     # Tauri 入口，插件注册，命令处理
        └── speech_eval/  # 音频录制 + 讯飞 WebSocket 语音评测
            ├── audio.rs    # 基于 cpal 录音，mp3lame 编码
            ├── client.rs   # 讯飞 WebSocket 客户端
            ├── auth.rs     # 讯飞 API HMAC 鉴权
            └── commands.rs # Tauri 命令：start_recording, stop_recording_and_evaluate, evaluate_mp3_file
```

### 前后端通信

- **Tauri 命令**（`#[tauri::command]`）：语音录制和评测，前端通过 `invoke()` 调用
- **AI 翻译**：前端通过 Vercel AI SDK（`ai` 包）直接调用 AI 服务商 —— 支持 OpenAI、DeepSeek、豆包及 OpenAI 兼容接口。配置按服务商存储在 localStorage 中。

### 关键模式

- **AI 客户端**：`services/aiClientManager.ts` 中的 `AIClientManager` 单例 —— 按需初始化服务商 SDK 客户端并缓存，通过 `"providerId/modelId"` 格式路由到对应服务商
- **状态管理**：Pinia stores（`stores/settings.ts`、`stores/translation.ts`），settings 包含各服务商的 API Key 和模型选择
- **路由**：Vue Router，`DefaultLayout` 包裹底部导航页面，所有 tab 页 `keepAlive: true`，`DetailPage` 为独立全屏路由
- **国际化**：vue-i18n，语言文件在 `langs/` 目录
- **UI 组件库**：Element Plus
- **自动导入**：已配置 `unplugin-auto-import`，可用自动导入见 `auto-imports.d.ts`

### Rust 后端

`speech_eval` 模块通过 `cpal` 采集音频 + `mp3lame-encoder` 编码为 MP3，然后通过 WebSocket 流式发送到讯飞语音评测 API。`RecordingState` 通过 Tauri 的 `.manage()` 进行状态管理。
