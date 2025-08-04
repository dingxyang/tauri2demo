<script setup lang="ts">
// 说明页组件
</script>

<template>
  <div class="about-page">
    <header class="header">
      <h1>说明页</h1>
    </header>
    
    <main class="main-content">
      <div class="about-content">
        <h2>应用说明</h2>
        <div class="about-text">
          <p>这是一个使用 Tauri + Vue 3 构建的跨平台应用。</p>
          <p>主要功能包括：</p>
          <ul>
            <li>项目列表展示</li>
            <li>详情页面查看</li>
            <li>移动端适配</li>
            <li>深色模式支持</li>
          </ul>
          <p>技术栈：</p>
          <ul>
            <li>前端：Vue 3 + TypeScript</li>
            <li>后端：Rust + Tauri</li>
            <li>移动端：Tauri Mobile</li>
          </ul>
          <p>版本：1.0.0</p>
          <p>开发者：Tauri Demo Team</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.header {
  background-color: #007AFF;
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.main-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  padding-bottom: 80px;
}

.about-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.about-content h2 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.5rem;
}

.about-text {
  line-height: 1.6;
  color: #555;
}

.about-text p {
  margin-bottom: 1rem;
}

.about-text ul {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.about-text li {
  margin-bottom: 0.5rem;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header {
    padding: 0.75rem;
  }
  
  .header h1 {
    font-size: 1.25rem;
  }
  
  .main-content {
    padding: 0.75rem;
  }
  
  .about-content {
    padding: 1rem;
  }
}

</style> 