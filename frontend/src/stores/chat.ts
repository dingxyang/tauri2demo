import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Scenario } from "@/pages/chat/data/scenarios";
import { generateScenarioSystemPrompt } from "@/pages/chat/utils/scenarioPrompt";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isVoice?: boolean;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  systemPrompt: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  scenarioId?: string;
}

const STORAGE_KEY = "chatSessions";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export const useChatStore = defineStore("chat", () => {
  const sessions = ref<ChatSession[]>([]);
  const activeSessionId = ref<string | null>(null);

  const activeSession = computed<ChatSession | undefined>(() =>
    sessions.value.find((s) => s.id === activeSessionId.value)
  );

  const sortedSessions = computed<ChatSession[]>(() =>
    [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt)
  );

  function loadSessions(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        sessions.value = JSON.parse(raw) as ChatSession[];
      }
    } catch (e) {
      console.warn("Failed to load chat sessions:", e);
      sessions.value = [];
    }
  }

  function saveSessions(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.value));
    } catch (e) {
      console.warn("Failed to save chat sessions:", e);
    }
  }

  function createSession(defaultPrompt = ""): ChatSession {
    const now = Date.now();
    const session: ChatSession = {
      id: generateId(),
      title: "新对话",
      systemPrompt: defaultPrompt,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    sessions.value.push(session);
    activeSessionId.value = session.id;
    saveSessions();
    return session;
  }

  function switchSession(id: string): void {
    if (sessions.value.some((s) => s.id === id)) {
      activeSessionId.value = id;
    }
  }

  function deleteSession(id: string): void {
    const idx = sessions.value.findIndex((s) => s.id === id);
    if (idx === -1) return;
    sessions.value.splice(idx, 1);
    if (activeSessionId.value === id) {
      activeSessionId.value =
        sessions.value.length > 0
          ? sortedSessions.value[0]?.id ?? null
          : null;
    }
    saveSessions();
  }

  function addMessage(
    role: "user" | "assistant",
    content: string,
    isVoice = false
  ): Message | null {
    const session = activeSession.value;
    if (!session) return null;

    const msg: Message = {
      id: generateId(),
      role,
      content,
      isVoice,
      createdAt: Date.now(),
    };
    session.messages.push(msg);
    session.updatedAt = Date.now();

    // Update title from first user message (skip for scenario sessions)
    if (
      role === "user" &&
      !session.scenarioId &&
      session.messages.filter((m) => m.role === "user").length === 1
    ) {
      session.title = content.slice(0, 30) || "新对话";
    }

    saveSessions();
    return msg;
  }

  function updateLastAssistantMessage(content: string): void {
    const session = activeSession.value;
    if (!session) return;
    for (let i = session.messages.length - 1; i >= 0; i--) {
      if (session.messages[i].role === "assistant") {
        session.messages[i].content = content;
        session.updatedAt = Date.now();
        saveSessions();
        return;
      }
    }
  }

  function updateSystemPrompt(prompt: string): void {
    const session = activeSession.value;
    if (!session) return;
    session.systemPrompt = prompt;
    session.updatedAt = Date.now();
    saveSessions();
  }

  function createScenarioSession(scenario: Scenario): ChatSession {
    const systemPrompt = generateScenarioSystemPrompt(scenario);
    const session = createSession(systemPrompt);
    session.scenarioId = scenario.id;
    session.title = scenario.titleEs || scenario.title;

    // Inject the AI opening message directly (no API call)
    const openingMsg: Message = {
      id: generateId(),
      role: "assistant",
      content: scenario.openingMessage,
      createdAt: Date.now(),
    };
    session.messages.push(openingMsg);
    session.updatedAt = Date.now();
    saveSessions();
    return session;
  }

  function ensureActiveSession(defaultPrompt = ""): ChatSession {
    if (activeSession.value) return activeSession.value;
    // Try to restore from sorted sessions
    if (sessions.value.length > 0) {
      activeSessionId.value = sortedSessions.value[0].id;
      return activeSession.value!;
    }
    return createSession(defaultPrompt);
  }

  // Load on store initialization
  loadSessions();

  return {
    sessions,
    activeSessionId,
    activeSession,
    sortedSessions,
    createSession,
    switchSession,
    deleteSession,
    addMessage,
    updateLastAssistantMessage,
    updateSystemPrompt,
    createScenarioSession,
    ensureActiveSession,
    saveSessions,
  };
});
