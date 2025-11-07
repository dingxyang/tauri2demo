// 列表项类型定义
export interface ListItem {
  id: number;
  title: string;
  description: string;
  content?: string; // 文章完整内容
  url?: string; // 原文链接
  publishTime?: string; // 发布时间
}

