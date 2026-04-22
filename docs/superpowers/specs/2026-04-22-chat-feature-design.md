# 对话功能设计文档

日期：2026-04-22

## 概述

新增"对话"功能页签，支持语音输入和手工输入与 AI 进行场景对话。语音输入自动转换为文字发送给 AI，支持按住录音松手发送、上移取消。AI 回复支持朗读。支持历史会话管理和会话级别的系统提示语配置。

**视觉风格策略**：混合方案——消息气泡配色和输入区风格参考聊天类 app 的现代设计（蓝色用户气泡、圆角内嵌按钮输入框），页面框架（头部、背景、间距）保持与现有 app 一致，确保整体视觉协调。不显示头像和时间戳，用气泡位置和配色区分角色。

---

## 1. 页面结构与路由

新增第 5 个 tab 页签"对话"：

- 路由路径：`/chat`
- 路由名：`Chat`
- 组件：`pages/chat/index.vue`
- `keepAlive: true`

底部导航栏新增项：图标使用 chat/message 类型 SVG，标签"对话"。Tab 顺序：首页、翻译、词典、对话、设置。

---

## 2. 对话页面组件拆分

```
pages/chat/
├── index.vue              # 主页面，组合各子组件
├── ChatHeader.vue         # 头部：左侧历史图标、右侧新建+设置图标
├── MessageList.vue        # 消息列表，显示对话内容
├── MessageItem.vue        # 单条消息（用户/AI），AI 消息含朗读按钮
├── InputArea.vue          # 输入区域：文本/语音切换
├── VoiceButton.vue        # 语音按钮及录音交互（声波动画、上移取消）
├── HistorySidebar.vue     # 侧滑面板：历史会话列表
└── PromptSettings.vue     # 弹窗：当前会话的系统提示语设置
```

---

## 3. 输入区域交互与视觉设计

### 输入区布局

- 白色背景条固定在底部，位于底部导航栏上方，`padding: 12px 16px`
- 输入区域与底部导航栏不重叠，DefaultLayout 的 `main-content` padding-bottom 需调整为 `calc(底部导航高度 + 输入区域高度 + safe-area-inset-bottom)`

### 文本模式

- 圆角输入框（`border-radius: 24px`，`border: 1px solid #dcdfe6`），参考聊天类 app 的现代设计风格
- 输入框内右侧区域（内嵌按钮）：
  - **有内容时**：发送按钮（蓝色 SVG 图标，点击发送）
  - **无内容时**：语音切换图标（麦克风 SVG，点击切换到语音模式）
- 默认高度 1 行（约 40px），最多扩展到 3 行
- Placeholder："发消息"
- Enter 发送，Shift+Enter 换行

### 语音模式

- 同样白色背景条
- 替换输入框为按钮区域：中间是"按住说话"按钮（圆角矩形样式），右侧是切换到文本模式的键盘图标
- **按住时**：
  - 按钮视觉变化（放大/变色）
  - 显示声波动画（多条竖线做波动效果，参考聊天类 app 的语音交互设计）
  - 显示提示文字："松开发送 上移取消"
  - 录音计时
- **松手**（手指未上移超过阈值）：结束录音 → 讯飞 ASR 转文字 → 自动作为用户消息发送给 AI
- **上移取消**：按住期间手指上移超过 80px（约屏幕高度 10%），判定为取消，放弃本次录音，播放取消提示音或显示取消动画
- **移出判定**：以语音按钮中心为起点，向上移动超过 80px 即为取消区域。左右水平偏移超过 100px 也视为移出（防止误触）

### 模式切换

- 文本模式右侧图标 → 点击切换到语音模式
- 语音模式右侧图标 → 点击切换到文本模式
- 切换时有文本内容时不丢失（文本→语音时暂存文本，语音→文本时恢复）

---

## 4. Rust 后端新增命令

### 新增文件：`speech_eval/asr.rs`

- Tauri 命令 `stop_recording_and_recognize`：停止当前录音 → 编码为 MP3 → 调用讯飞实时语音转写 WebSocket API → 返回识别文本
- 讯飞实时语音转写端点：`rtasr.xfyun.cn/v1/rtasr`
- 复用现有 `auth.rs` 的 HMAC 鉴权逻辑和 `audio.rs` 的录音/编码逻辑
- ASR WebSocket 协议：发送音频帧（与语音评测类似的分帧发送），接收识别结果，返回最终文本

### 新增文件：`speech_eval/types.rs` 扩展

- `AsrResult` 结构体：`text: String`（识别文本）
- ASR 相关的请求/响应结构体

### 修改文件

- `lib.rs`：在 `generate_handler!` 中注册 `stop_recording_and_recognize` 命令
- `speech_eval/mod.rs`：新增 `asr` 模块声明

---

## 5. AI 调用方式

复用现有前端 AI 客户端层：

- 使用 `aiClientManager.callStream()` 流式输出
- 调用时传入 `RequestType.CHAT`，系统提示语为当前会话的 `systemPrompt`
- 对话上下文：将当前会话的所有历史消息作为 `messages` 数组传入（role + content），实现多轮对话
- 流式输出逐字追加到当前 AI 回复消息中，完成后标记消息为完整状态

### AIClientManager 适配

- 新增 `RequestType.CHAT` 类型
- `callStream` 方法需要支持传入自定义 `messages` 数组（多轮对话历史）和 `systemPrompt`（会话级别提示语），而非只用固定的翻译提示语

---

## 6. AI 回复朗读

- AI 消息每条右侧有一个小喇叭图标
- 点击朗读：调用现有 `tts_synthesize` Tauri 命令，传入 AI 回复文本
- 使用中文语音：`vcn = 'x4_yezi'`
- 朗读时喇叭图标变为动画状态，再次点击停止
- 同一条消息正在朗读时，点击其他消息的朗读按钮会停止当前播放并开始新播放

---

## 7. 会话管理

### 新增 Pinia store：`stores/chat.ts`

```typescript
interface ChatSession {
  id: string          // UUID
  title: string       // 首条用户消息摘要（前20字）
  systemPrompt: string // 当前会话的系统提示语
  messages: Message[]
  createdAt: number
  updatedAt: number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}
```

状态：
- `sessions`: 所有会话列表，按 updatedAt 降序排列
- `activeSessionId`: 当前活跃会话 ID

操作：
- `createSession()`: 新建空会话，systemPrompt 取 settings store 中的 `chatDefaultPrompt`
- `switchSession(id)`: 切换到指定会话
- `deleteSession(id)`: 删除会话
- `addMessage(role, content)`: 向当前活跃会话追加消息
- `updateSystemPrompt(prompt)`: 更新当前会话的系统提示语
- 每次变更自动持久化到 localStorage（key: `chatSessions`）

### 首次启动

无会话时自动创建一个新会话。

---

## 8. 头部工具栏

ChatHeader 组件（延续现有 app 的 header 风格）：

- 白色背景，`border-bottom: 1px solid #ebeef5`，padding `14px 16px`
- **左侧**：历史图标（时钟类型 SVG），点击 → 打开 HistorySidebar
- **中间**：当前会话标题（或默认文案"对话")
- **右侧**：新建图标（+ 号 SVG，点击创建新会话）+ 设置图标（笔类型 SVG，点击打开 PromptSettings 弹窗）

### HistorySidebar

- 从左侧滑出，宽度约 70% 屏幕宽度
- 半透明遮罩层（`rgba(0,0,0,0.3)`）
- 面板样式：白色背景，与 app 卡片风格一致
- 顶部：标题"历史会话" + 关闭按钮
- 列出所有历史会话，显示标题和日期
- 点击某条 → 切换到该会话并关闭侧栏
- 每条会话右侧有删除按钮（点击确认后删除）
- 滑动动画：`transform: translateX(-100%) → translateX(0)`，`transition: 0.3s ease`
- 点击遮罩层关闭

### PromptSettings

- 使用 Element Plus `el-dialog` 弹窗形式
- 标题："系统提示语设置"
- 显示当前会话的系统提示语 textarea
- 保存按钮（蓝色主色）：更新当前会话的 systemPrompt
- 取消按钮：关闭弹窗不做修改

---

## 9. 系统设置 - 场景对话

在 Settings 页面的 menu-group 中新增一条：

- 图标：聊天/对话类型 SVG，放在 34px 方形彩色背景中，配色 `background: #e8f4fd; color: #2B5CE6`（与对话气泡蓝色呼应）
- 标签："场景对话"
- 点击进入二级表单页面

二级表单：

- `form-group-header`："默认系统提示语" 标题
- textarea 编辑默认提示语内容
- placeholder：空（用户自行填写）
- 默认值：空字符串
- 保存后存入 settings store 的 `chatDefaultPrompt` 字段
- 新建会话时自动使用此字段值作为 systemPrompt（空字符串则不注入系统提示语）

---

## 10. 消息列表显示与视觉风格

### 页面骨架（保持现有 app 风格）

- 全高 flex 列布局，`background: #f5f5f5`
- 白色头部条，`border-bottom: 1px solid #ebeef5`
- 中间可滚动消息区域：`flex: 1; overflow-y: auto; padding: 0 16px`
- 底部固定输入区，位于底部导航栏上方

### 用户消息

- 右对齐，`max-width: 75%` 屏幕宽度
- 背景：深蓝色系（`#2B5CE6`）
- 文字：白色，`font-size: 15px`
- 圆角：`12px`（app 标准圆角），左下角 `4px`（不对称圆角暗示消息来源方向）
- 无头像，无时间戳
- 如果是语音输入的消息，文字前显示小麦克风 SVG 图标标识

### AI 消息

- 左对齐，`max-width: 80%` 屏幕宽度
- 背景：白色 `#fff`
- 文字：`#1a1a1a`，`font-size: 15px`
- 圆角：`12px`，右下角 `4px`（不对称圆角）
- 轻微阴影：`0 1px 4px rgba(0,0,0,0.06)`（与 app 标准卡片阴影一致）
- 右侧小喇叭图标，点击朗读
- 流式输出时：逐字追加显示（打字动画效果）

### 气泡间距

- 左右与屏幕边缘 `16px`
- 同一方连续消息上下间距 `4px`
- 不同方消息上下间距 `12px`

### 空会话

- 居中显示引导文案："开始一段西班牙语对话吧"
- 配以简单图标/插画

---

## 11. 依赖与复用

- **录音**：复用现有 `start_recording` Tauri 命令开始录音
- **ASR**：新增 `stop_recording_and_recognize` 命令（新代码）
- **TTS**：复用现有 `tts_synthesize` 命令，vcn 改为 `x4_yezi`
- **AI**：复用 `aiClientManager.callStream()`，适配多轮对话参数
- **鉴权**：复用 `auth.rs` HMAC 鉴权
- **编码**：复用 `audio.rs` MP3 编码逻辑

---

## 12. 不做的事（YAGNI）

- 不做多语言 i18n（当前 UI 全中文硬编码，与现有风格一致）
- 不做对话导出/分享功能
- 不做消息编辑/删除
- 不做语音消息的原始音频保存和回放（只保留识别后的文字）
- 不做 AI 响应的重新生成
- 不做会话搜索功能
- 不做消息头像显示（只靠气泡位置和配色区分角色）
- 不做消息时间戳显示（保持消息区域简洁）

---

## 13. 视觉风格汇总

### 配色体系

| 元素 | 颜色 | 用途 |
|------|------|------|
| 用户消息气泡 | `#2B5CE6` | 深蓝色背景，白色文字 |
| AI 消息气泡 | `#fff` | 白色背景，深色文字 |
| 页面背景 | `#f5f5f5` | 与现有 app 一致 |
| 头部背景 | `#fff` | 白色，`border-bottom: #ebeef5` |
| 输入区背景 | `#fff` | 白色固定条 |
| 发送按钮 | `#2B5CE6` SVG | 蓝色与气泡色呼应 |
| 朗读喇叭 | 灰色→蓝色动画 | 朗读中变色 |

### 圆角体系

| 元素 | 圆角 | 说明 |
|------|------|------|
| 用户消息气泡 | `12px 12px 4px 12px` | 左下角小圆角暗示方向 |
| AI 消息气泡 | `12px 12px 12px 4px` | 右下角小圆角暗示方向 |
| 输入框 | `24px` | 大圆角，内嵌按钮风格 |
| 卡片/面板 | `12px` | 与 app 标准一致 |

### 间距体系

| 元素 | 间距 | 说明 |
|------|------|------|
| 消息与屏幕边缘 | `16px` | 左右 |
| 同方连续消息 | `4px` | 紧密 |
| 不同方消息 | `12px` | 分隔 |
| 输入区 padding | `12px 16px` | 上下左右 |
| 头部 padding | `14px 16px` | 与现有 app 一致 |

### 字体

- 消息文字：`15px`，用户气泡白色，AI 气泡 `#1a1a1a`
- 头部标题：`1.25rem; font-weight: 600`（与现有 `.page-title` 一致）
- 输入框 placeholder："发消息"