# 每日一句 — 设计规格

## 概述

将现有"语音评测"页面改造为"每日一句"模式。内置 30 个西班牙语工作场景句子，每天随机展示一句，用户跟读后进行语音评测。界面采用白色极简风格，跟读按钮为绿色圆形+白色麦克风图标。

## 数据模型

### 内置句子

30 个句子硬编码在 `dailySentences.ts` 数据文件中：

```ts
interface DailySentence {
  date: string              // "01.abr" ~ "30.abr"
  sentence_original: string // 西班牙语原文
  sentence_translation: string // 中文翻译
}
```

### localStorage 持久化

两个 key：

- `daily_sentence_shown_indices`: `number[]` — 已展示过的句子索引列表
- `daily_sentence_today`: `{ date: string, index: number }` — 当天缓存（date 格式 "YYYY-MM-DD"）

## 每日随机逻辑

1. 页面加载时读取 `daily_sentence_today`
2. 如果 `date` 等于今天，直接使用缓存的 `index`
3. 否则：
   - 读取 `daily_sentence_shown_indices`
   - 从 0~29 中过滤掉已展示的，得到候选列表
   - 如果候选列表为空，清空 `shown_indices`，重新生成 0~29 为候选
   - 从候选列表中随机取一个 index
   - 写入 `daily_sentence_today` 和追加到 `shown_indices`
4. 用 index 从句子数组中取出当天句子

## 界面布局

从上到下：

### 1. 顶栏

- 左侧：标题文字"每日一句"，22px，bold
- 右侧：进度文字 "N/30"（N = 已展示数量），13px，灰色

### 2. 句子卡片

- 白色背景，12px 圆角，box-shadow
- 内部结构：
  - "ESPAÑOL" 标签：11px，大写，灰色，letter-spacing
  - 西语句子：18px，font-weight 500，#333
  - 分隔线：1px #f0f0f0
  - "中文翻译" 标签：11px，灰色
  - 中文翻译：15px，#666

### 3. 跟读按钮

- 圆形 60x60，绿色背景 #67c23a
- 白色麦克风 SVG 图标（stroke）
- box-shadow: 0 4px 14px rgba(103,194,58,0.35)
- 下方文字"点击跟读"，13px，灰色

**按钮状态：**

| 状态 | 外观 | 行为 |
|------|------|------|
| 待跟读 | 绿色 + 麦克风图标 + "点击跟读" | 点击开始录音 |
| 录音中 | 红色 #f56c6c + 白色方块图标 + "点击结束" | 点击停止录音并评测 |
| 评测中 | 灰色 + loading 图标 + "评测中..." | 禁用点击 |

- 录音中不显示波形、时长等信息
- 按钮本身状态变化即为录音反馈

### 4. 评测结果

- 录音结束评测完成后，在按钮下方展示
- 复用现有 `EvalResult` 组件，无需修改
- 展示：总分、发音、流利度、完整度 + 逐词反馈

### 5. 错误提示

- 评测失败时在按钮和结果之间显示红色错误条
- 复用现有样式

## 底部导航栏

- tab 文字从"评测"改为"每日一句"
- 路由路径 `/speech-eval` 保持不变

## 删除的功能

- 语言选择器（固定 `lang: 'sp'`）
- 类型选择器（固定 `category: 'sent'`）
- 参考文本输入框（使用内置句子）
- "测试 MP3 评测" 按钮
- 录音时长显示、录音状态文字

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `speech-eval/data/dailySentences.ts` | 新建 | 30 个句子数据 |
| `speech-eval/composables/useDailySentence.ts` | 新建 | 每日随机选句逻辑 |
| `speech-eval/index.vue` | 重写 | 整体页面改为每日一句布局 |
| `speech-eval/components/RecordButton.vue` | 重写 | 绿色圆形按钮，三态切换，无录音信息 |
| `speech-eval/components/EvalResult.vue` | 不变 | 复用现有组件 |
| `layouts/BottomNav.vue` | 修改 | tab 文字改为"每日一句" |
