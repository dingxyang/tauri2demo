<script setup lang="ts">
/**
 * DetailPage - 文章详情页组件
 * 
 * 功能概述：
 * 1. 从路由参数获取文章信息并展示
 * 2. 使用 Tauri HTTP 插件获取文章原始 HTML 内容
 * 3. 清理并美化 HTML（移除脚本、添加样式、处理资源路径）
 * 4. 通过 iframe srcdoc 安全地展示文章内容
 * 5. 提供在系统浏览器中打开文章的备用方案
 * 
 * 技术要点：
 * - 使用 srcdoc 而非 src 避免跨域限制
 * - 移除 script 标签防止 XSS 攻击
 * - 添加 base 标签确保相对路径资源正确加载
 * - 处理 iframe 加载失败的情况（X-Frame-Options 阻止）
 */
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openUrl } from "@tauri-apps/plugin-opener";
import { fetch } from "@tauri-apps/plugin-http";

const route = useRoute();
const router = useRouter();

// 状态管理
const iframeLoaded = ref(false); // iframe 是否加载完成
const iframeError = ref(false); // iframe 是否加载失败
const isFetching = ref(false); // 是否正在获取文章内容
const fetchError = ref<string | null>(null); // 获取文章内容的错误信息
const articleHtml = ref(""); // 处理后的文章 HTML 内容

// 正则表达式：用于清理 HTML 中的 script 标签和 CSP meta 标签
const scriptRegex = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi;
const metaCspRegex =
  /<meta\b[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi;

/**
 * 从路由参数中提取文章信息
 * 通过 URL 参数传递文章的详细信息，避免复杂的状态管理
 */
const selectedItem = computed(() => {
  const id = route.params.id;
  const title = route.query.title as string;
  const description = route.query.description as string;
  const url = route.query.url as string;
  const publishTime = route.query.publishTime as string;

  if (id && title) {
    return {
      id: parseInt(id as string),
      title,
      description,
      url,
      publishTime,
    };
  }
  return null;
});

/**
 * 计算加载状态
 * 当正在获取内容或有内容但 iframe 未加载完成时显示加载动画
 */
const isLoading = computed(() => {
  if (isFetching.value) {
    return true;
  }
  const hasContent = Boolean(articleHtml.value || selectedItem.value?.url);
  return (
    hasContent && !iframeLoaded.value && !iframeError.value && !fetchError.value
  );
});

/**
 * 重置所有状态
 * 在切换文章或重新加载时清空之前的状态
 */
function resetState() {
  iframeLoaded.value = false;
  iframeError.value = false;
  articleHtml.value = "";
  fetchError.value = null;
}

/**
 * 从 HTML 字符串中提取指定标签的内容和属性
 * @param html - 完整的 HTML 字符串
 * @param tag - 要提取的标签名（如 'body', 'head'）
 * @returns 返回包含开始标签和内部内容的对象，如果未找到则返回 null
 * 
 * 例如: extractSection('<body class="main">content</body>', 'body')
 * 返回: { tagOpen: '<body class="main">', inner: 'content' }
 */
function extractSection(
  html: string,
  tag: string
): { tagOpen: string; inner: string } | null {
  const lower = html.toLowerCase();
  const openMarker = `<${tag}`;
  const closeMarker = `</${tag}>`;
  const start = lower.indexOf(openMarker);

  if (start === -1) {
    return null;
  }

  // 从开始标签位置截取剩余部分
  const tail = html.slice(start);
  const openEndRel = tail.indexOf(">");

  if (openEndRel === -1) {
    return null;
  }

  // 计算开始标签结束的位置，并提取标签属性
  const openEnd = start + openEndRel + 1;
  const attrs = html
    .slice(start + openMarker.length, start + openEndRel)
    .trim();
  const tagOpen = attrs ? `<${tag} ${attrs}>` : `<${tag}>`;

  // 查找闭合标签
  const restLower = lower.slice(openEnd);
  const closeRel = restLower.indexOf(closeMarker);

  if (closeRel === -1) {
    return null;
  }

  // 提取标签内部的内容
  const innerEnd = openEnd + closeRel;
  const inner = html.slice(openEnd, innerEnd);

  return { tagOpen, inner };
}

/**
 * 清理和美化文章 HTML 内容
 * @param rawHtml - 原始的 HTML 内容
 * @param finalUrl - 文章的最终 URL（用于处理相对路径）
 * @returns 处理后的安全 HTML 内容
 * 
 * 主要处理：
 * 1. 添加 base 标签确保相对路径资源正确加载
 * 2. 注入自定义样式优化阅读体验
 * 3. 移除所有 script 标签防止 XSS 攻击
 * 4. 移除 CSP meta 标签避免内容安全策略冲突
 */
function sanitizeArticleHtml(rawHtml: string, finalUrl: string) {
  const origin = new URL(finalUrl).origin;
  // 添加 base 标签，让相对路径的资源（图片、CSS等）能正确加载
  const baseTag = `<base href="${origin}">`;
  // 自定义样式：优化文章阅读体验
  const customStyle = `<style>
html, body {
  background: #ffffff;
  color: #1a1a1a;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
}
body {
  margin: 0 auto;
  padding: 16px;
  max-width: 900px;
  line-height: 1.7;
}
img, video {
  max-width: 100%;
  height: auto;
}
table {
  max-width: 100%;
}
.rich_media_inner, #js_content {
  font-size: 16px;
}
</style>`;

  let finalHtml: string;
  const bodySection = extractSection(rawHtml, "body");

  // 情况1: HTML 包含完整的 body 标签
  if (bodySection) {
    const headSection = extractSection(rawHtml, "head");
    // 重构完整 HTML，在 head 中注入 base 和样式
    finalHtml = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">${baseTag}${customStyle}${
      headSection?.inner ?? ""
    }</head>${bodySection.tagOpen}${bodySection.inner}</body></html>`;
  } else {
    // 情况2: HTML 不包含完整 body 标签（可能是片段）
    const createTemplate = (content: string) =>
      `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">${baseTag}${customStyle}</head><body>${content}</body></html>`;

    const headPos = rawHtml.toLowerCase().indexOf("<head");

    if (headPos !== -1) {
      // 找到 head 标签，在其后面插入 base 和样式
      const sliceFromHead = rawHtml.slice(headPos);
      const insertRel = sliceFromHead.indexOf(">");

      if (insertRel !== -1) {
        const insertAt = headPos + insertRel + 1;
        finalHtml = `${rawHtml.slice(
          0,
          insertAt
        )}${baseTag}${customStyle}${rawHtml.slice(insertAt)}`;
      } else {
        // head 标签不完整，用模板包裹
        finalHtml = createTemplate(rawHtml);
      }
    } else {
      // 没有 head 标签，用模板包裹整个内容
      finalHtml = createTemplate(rawHtml);
    }
  }

  // 移除所有 script 标签（安全考虑）
  const withoutScripts = finalHtml.replace(scriptRegex, "");
  // 移除 CSP meta 标签（避免内容安全策略阻止嵌入）
  return withoutScripts.replace(metaCspRegex, "");
}

/**
 * 加载文章内容
 * @param url - 文章的 URL 地址
 * 
 * 流程：
 * 1. 使用 Tauri 的 fetch 插件获取文章 HTML
 * 2. 处理重定向和跨域问题
 * 3. 清理和美化 HTML 内容
 * 4. 将处理后的内容赋值给 articleHtml 用于 iframe 显示
 */
async function loadArticle(url: string) {
  isFetching.value = true;
  try {
    // 使用 Tauri HTTP 插件获取文章内容（支持跨域）
    const response = await fetch(url, {
      redirect: "follow", // 自动跟随重定向
      credentials: "omit", // 不发送凭证
    });

    if (!response.ok) {
      throw new Error(`请求文章内容失败，状态码: ${response.status}`);
    }

    const rawHtml = await response.text();
    const finalUrl = response.url || url; // 获取最终 URL（可能经过重定向）
    articleHtml.value = sanitizeArticleHtml(rawHtml, finalUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fetchError.value = message;
    console.error("文章内容加载失败:", message);
  } finally {
    isFetching.value = false;
  }
}

/**
 * 监听选中的文章变化
 * 当路由参数变化时（即选中不同文章），重置状态并加载新文章
 * immediate: true 表示组件挂载时立即执行
 */
watch(
  selectedItem,
  (item) => {
    resetState();
    isFetching.value = false;

    if (!item?.url) {
      return;
    }

    void loadArticle(item.url);
  },
  { immediate: true }
);

/**
 * 监听文章 HTML 内容变化
 * 当新内容加载时，重置 iframe 加载状态
 */
watch(articleHtml, (value) => {
  if (value) {
    iframeLoaded.value = false;
  }
});

/**
 * 返回到文章列表页
 */
function goBack() {
  router.push("/");
}

/**
 * iframe 加载成功回调
 * 标记加载完成，隐藏加载动画
 */
function onIframeLoad() {
  iframeLoaded.value = true;
  iframeError.value = false;
}

/**
 * iframe 加载失败回调
 * 当文章无法通过 iframe 嵌入时触发（如被 X-Frame-Options 阻止）
 */
function onIframeError(event: Event) {
  iframeError.value = true;
  if (!fetchError.value) {
    fetchError.value = "嵌入文章内容失败，请尝试在浏览器中打开。";
  }
  console.error("iframe 加载失败:", event);
  console.error("URL:", selectedItem.value?.url);
}

/**
 * 在系统默认浏览器中打开文章链接
 * 优先使用 Tauri 的 opener 插件，失败则回退到 window.open
 */
async function openInBrowser(event?: Event) {
  event?.preventDefault();
  const url = selectedItem.value?.url;

  if (!url) {
    return;
  }

  try {
    // 使用 Tauri 插件打开系统浏览器
    await openUrl(url);
  } catch (error) {
    console.error("使用系统浏览器打开失败:", error);
    // 回退方案：使用 Web API
    window.open(url, "_blank");
  }
}
</script>

<template>
  <div class="detail-page">
    <header class="header">
      <button class="back-button" @click="goBack">← 返回</button>
      <h1>文章详情</h1>
    </header>

    <div v-if="selectedItem" class="detail-content">
      <div class="article-header">
        <h2>{{ selectedItem.title }}</h2>
        <div class="article-meta">
          <span v-if="selectedItem.publishTime" class="publish-time">
            发布时间：{{ selectedItem.publishTime }}
          </span>
        </div>
      </div>

      <div
        class="iframe-container"
        v-loading="isLoading"
        element-loading-text="正在加载文章内容..."
      >
        <template v-if="articleHtml">
          <iframe
            :srcdoc="articleHtml"
            class="article-iframe"
            frameborder="0"
            scrolling="auto"
            allowfullscreen
            @load="onIframeLoad"
            @error="onIframeError"
          ></iframe>
        </template>

        <template v-else-if="selectedItem.url && !fetchError">
          <iframe
            :src="selectedItem.url"
            class="article-iframe"
            frameborder="0"
            scrolling="auto"
            allowfullscreen
            @load="onIframeLoad"
            @error="onIframeError"
          ></iframe>
        </template>

        <template v-else-if="fetchError">
          <div class="fallback-content">
            <div class="fallback-icon">😢</div>
            <h3>文章加载失败</h3>
            <p>{{ fetchError }}</p>
            <div v-if="selectedItem.url" class="fallback-actions">
              <button class="open-button primary" @click="openInBrowser">
                在系统浏览器打开
              </button>
              <p class="fallback-tip">
                如果内容无法嵌入显示，可以手动打开链接查看。
              </p>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="no-url">
            <p>暂无文章链接</p>
          </div>
        </template>
      </div>
    </div>
    <div v-else class="no-data">
      <p>未找到文章信息</p>
    </div>
  </div>
</template>

<style scoped>
.detail-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.header {
  background-color: #007aff;
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.back-button {
  background: none;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.detail-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.article-header {
  border-bottom: 1px solid #eee;
  padding: 1rem 1.5rem;
  flex-shrink: 0;
}

.article-header h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.3rem;
  font-weight: 600;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.publish-time {
  color: #999;
}

.original-link {
  color: #007aff;
  text-decoration: none;
  padding: 0.25rem 0.5rem;
  border: 1px solid #007aff;
  border-radius: 4px;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.original-link:hover {
  background-color: #007aff;
  color: white;
}

.article-description {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

.iframe-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.article-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background-color: #fff;
  flex: 1;
  min-height: 400px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 备用方案样式 */
.fallback-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 2rem;
  color: #666;
}

.fallback-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.fallback-content h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.5rem;
}

.fallback-content p {
  margin: 0 0 2rem 0;
  line-height: 1.6;
  max-width: 400px;
}

.fallback-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.open-button {
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 200px;
}

.open-button.primary {
  background-color: #007aff;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.open-button.primary:hover {
  background-color: #0056cc;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
}

.open-button.secondary {
  background-color: #f8f9fa;
  color: #333;
  border: 2px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.open-button.secondary:hover {
  background-color: #e9ecef;
  border-color: #007aff;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.open-button:active {
  transform: translateY(0);
}

.fallback-tip {
  font-size: 0.9rem;
  color: #999;
  margin: 0;
}

.article-preview {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #007aff;
  max-width: 500px;
  text-align: left;
}

.article-preview h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.article-preview p {
  margin: 0;
  color: #666;
  line-height: 1.6;
  font-size: 0.95rem;
}

.no-url,
.no-data {
  text-align: center;
  color: #999;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.no-url p,
.no-data p {
  margin: 0;
  font-size: 1rem;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header {
    padding: 0.75rem;
  }

  .header h1 {
    font-size: 1.25rem;
  }

  .detail-content {
    margin: 0.5rem;
  }

  .article-header {
    padding: 1rem;
  }

  .article-header h2 {
    font-size: 1.2rem;
  }

  .article-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .iframe-container {
    padding: 0 1rem 1rem 1rem;
  }

  .article-iframe {
    min-height: 300px;
  }
}
</style>
