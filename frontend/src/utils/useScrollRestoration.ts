import { Ref, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted } from 'vue';
import { onBeforeRouteLeave, useRoute } from 'vue-router';

interface ScrollRestorationOptions {
  key?: string;
  el?: Ref<HTMLElement | null>;
  selector?: string;
}

const scrollCache = new Map<string, number>();

export function useScrollRestoration(options: ScrollRestorationOptions = {}) {
  const route = useRoute();
  const cacheKey = options.key ?? (typeof route.name === 'string' ? route.name : route.fullPath);

  const resolveElement = (): HTMLElement | null => {
    if (options.el?.value) {
      return options.el.value;
    }
    if (options.selector) {
      return document.querySelector(options.selector) as HTMLElement | null;
    }
    return null;
  };

  const applyScroll = () => {
    const el = resolveElement();
    if (!el) return;
    const top = scrollCache.get(cacheKey) ?? 0;
    requestAnimationFrame(() => {
      el.scrollTop = top;
    });
  };

  const saveScroll = () => {
    const el = resolveElement();
    if (!el) return;
    scrollCache.set(cacheKey, el.scrollTop);
  };

  const restoreScroll = () => {
    nextTick(applyScroll);
  };

  onMounted(restoreScroll);
  onActivated(restoreScroll);

  onDeactivated(saveScroll);
  onBeforeUnmount(saveScroll);
  onBeforeRouteLeave(() => {
    saveScroll();
  });

  return {
    cacheKey,
    restoreScroll,
    saveScroll,
  };
}
