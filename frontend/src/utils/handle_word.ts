import { WORD_PROMPT } from "./constant";

// 在本地单词库中查找匹配的单词
export const findWordInPrompt = (searchWord: string): string | null => {
  if (!searchWord.trim()) return null;
  
  // 将搜索词转换为小写，用于不区分大小写的匹配
  const normalizedSearchWord = searchWord.trim().toLowerCase();
  
  // 按照 ============================================ 分割内容
  const sections = WORD_PROMPT.split('============================================');
  
  for (const section of sections) {
    if (!section.trim()) continue;
    
    // 查找以 # 开头的行（单词原文）
    const lines = section.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('#')) {
        // 提取单词原文（去掉 # 和空格）
        const word = trimmedLine.substring(1).trim().toLowerCase();
        
        // 如果匹配到单词，返回完整的段落内容
        if (word === normalizedSearchWord) {
          return section.trim();
        }
      }
    }
  }
  
  return null;
};