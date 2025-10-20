import { ref, computed } from 'vue';
import { bundledLanguages, bundledThemes, createHighlighter } from 'shiki';
import { i18nGlobal } from '@/utils/i18n';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settings';

let highlighterPromise = null;

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      langs: ['javascript', 'typescript', 'python', 'java', 'markdown'],
      themes: ['one-light', 'material-theme-darker'],
    });
  }
  return await highlighterPromise;
}

export function useShikiHighlighter() {
  const settingsStore = useSettingsStore();
  const isDark = computed(() => settingsStore.settingsState.isDark);

  const highlighterTheme = computed(() => {
    return isDark.value ? 'material-theme-darker' : 'one-light';
  });

  const codeCache = new Map();
  const generateCacheKey = (code, language, theme) => `${code}_${language}_${theme}`;

  const codeToHtml = async (_code, language, enableCache = true) => {
    if (!_code) return '';

    const key = generateCacheKey(_code, language, highlighterTheme.value);

    if (enableCache && codeCache.has(key)) {
      return codeCache.get(key);
    }

    const languageMap = {
      vab: 'vb',
    };

    const mappedLanguage = languageMap[language] || language;
    const code = _code.replace(/\r\n/g, '\n').trimEnd();
    const escapedCode = code.replace(
      /[<>&]/g,
      (char) =>
        ({
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
        })[char] || char,
    );

    try {
      const highlighter = await getHighlighter();

      if (!highlighter.getLoadedThemes().includes(highlighterTheme.value)) {
        const themeImportFn = bundledThemes[highlighterTheme.value];
        if (themeImportFn) {
          await highlighter.loadTheme(await themeImportFn());
        }
      }

      if (!highlighter.getLoadedLanguages().includes(mappedLanguage)) {
        const languageImportFn = bundledLanguages[mappedLanguage];
        if (languageImportFn) {
          await highlighter.loadLanguage(await languageImportFn());
        }
      }

      const html = highlighter.codeToHtml(code, {
        lang: mappedLanguage,
        theme: highlighterTheme.value,
      });

      // 移除外层 pre 标签
      let processedHtml = html.replace(/^<pre[^>]*>(.*)<\/pre>$/s, '$1').trim();
      processedHtml = `<div class="code-block-wrapper"><div class="code-block-header"><span class="code-block-header__lang">${mappedLanguage.toUpperCase()}</span><span class="code-block-header__copy">${i18nGlobal.t('chat.copy_code')}</span></div><div class="code-block-content">${processedHtml}</div></div>`;
      // 如果是暗色主题，修改注释颜色（和个人笔记一致，后续如果修改请注意是否需要同步）
      // if (isDark.value) {
      //   processedHtml = processedHtml.replace(
      //     /<span style="color:#545454;font-style:italic">(.*?)<\/span>/g,
      //     '<span style="color:#586e75;font-style:italic">$1</span>',
      //   );
      // }

      if (enableCache) {
        codeCache.set(key, processedHtml);
      }

      return processedHtml;
    } catch (error) {
      console.debug(`Error highlighting code for language '${mappedLanguage}':`, error);
      return `<code>${escapedCode}</code>`;
    }
  };

  return {
    highlighterTheme,
    codeToHtml,
  };
}

export const codeThemes = ['auto', ...Object.keys(bundledThemes)];
