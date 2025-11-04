export interface ModelLimit {
  context: number;
  output: number;
}

export interface ModelModalities {
  input: string[];
  output: string[];
}
interface ModelCost {
  input: number;
  output: number;
  cache_read?: number;
  cache_write?: number;
}

export interface Model {
  id: string;
  name: string;
  shortName?: string;
  attachment: boolean;
  reasoning: boolean;
  temperature: boolean;
  tool_call: boolean;
  knowledge: string;
  release_date: string;
  last_updated: string;
  modalities: ModelModalities;
  open_weights: boolean;
  cost: ModelCost;
  limit: ModelLimit;
}

export type ModelMap = Record<string, Omit<Model, "id" | "cost">>;

export const models: ModelMap = {
  'deepseek-v3-0324': {
    name: 'DeepSeek-V3-0324',
    shortName: 'DeepSeek V3',
    attachment: false,
    reasoning: true,
    temperature: true,
    tool_call: true,
    knowledge: '2024-06',
    release_date: '2025-03-24',
    last_updated: '2025-03-24',
    modalities: { input: ['text'], output: ['text'] },
    open_weights: true,
    limit: { context: 128000, output: 8192 },
  },
  "deepseek-v3-1": {
    name: "DeepSeek V3.1",
    shortName: "DeepSeek V3.1",
    attachment: false,
    reasoning: true,
    temperature: true,
    tool_call: true,
    knowledge: "2025-07",
    release_date: "2025-08-21",
    last_updated: "2025-08-21",
    modalities: { input: ["text"], output: ["text"] },
    open_weights: true,
    limit: { context: 163840, output: 163840 },
  },
  "deepseek-v3-1-terminus": {
    name: "DeepSeek V3.1 Terminus",
    attachment: false,
    reasoning: true,
    temperature: true,
    tool_call: true,
    knowledge: "2025-07",
    release_date: "2025-09-22",
    last_updated: "2025-09-22",
    modalities: { input: ["text"], output: ["text"] },
    open_weights: true,
    limit: { context: 131072, output: 65536 },
  },
  "deepseek-v3-2-exp": {
    name: "DeepSeek V3.2 Exp",
    attachment: false,
    reasoning: true,
    temperature: true,
    tool_call: true,
    knowledge: "2025-09",
    release_date: "2025-09-29",
    last_updated: "2025-09-29",
    modalities: { input: ["text"], output: ["text"] },
    open_weights: true,
    limit: { context: 131072, output: 65536 },
  },
  "deepseek-r1-0528": {
    name: "DeepSeek-R1-0528",
    shortName: "DeepSeek R1",
    attachment: false,
    reasoning: true,
    temperature: true,
    tool_call: true,
    knowledge: "2024-06",
    release_date: "2025-05-28",
    last_updated: "2025-05-28",
    modalities: { input: ["text"], output: ["text"] },
    open_weights: true,
    limit: { context: 65536, output: 8192 },
  },
  "gpt-4.1": {
    name: "GPT-4.1",
    attachment: true,
    reasoning: false,
    temperature: true,
    tool_call: true,
    knowledge: "2024-04",
    release_date: "2025-04-14",
    last_updated: "2025-04-14",
    modalities: { input: ["text", "image"], output: ["text"] },
    open_weights: false,
    limit: { context: 1047576, output: 32768 },
  },
  "gpt-4": {
    name: "GPT-4",
    attachment: true,
    reasoning: false,
    temperature: true,
    tool_call: true,
    knowledge: "2023-11",
    release_date: "2023-11-06",
    last_updated: "2024-04-09",
    modalities: { input: ["text"], output: ["text"] },
    open_weights: false,
    limit: { context: 8192, output: 8192 },
  },
  "gpt-4o": {
    name: "GPT-4o",
    attachment: true,
    reasoning: false,
    temperature: true,
    tool_call: true,
    knowledge: "2023-09",
    release_date: "2024-05-13",
    last_updated: "2024-05-13",
    modalities: { input: ["text", "image"], output: ["text"] },
    open_weights: false,
    limit: { context: 128000, output: 16384 },
  },
  o3: {
    name: "o3",
    attachment: true,
    reasoning: true,
    temperature: false,
    tool_call: true,
    knowledge: "2024-05",
    release_date: "2025-04-16",
    last_updated: "2025-04-16",
    modalities: { input: ["text", "image"], output: ["text"] },
    open_weights: false,
    limit: { context: 200000, output: 100000 },
  },
  "o3-mini": {
    name: "o3-mini",
    attachment: false,
    reasoning: true,
    temperature: false,
    tool_call: true,
    knowledge: "2024-05",
    release_date: "2024-12-20",
    last_updated: "2025-01-29",
    modalities: { input: ["text"], output: ["text"] },
    open_weights: false,
    limit: { context: 200000, output: 100000 },
  },
  "o4-mini": {
    name: "o4-mini",
    attachment: true,
    reasoning: true,
    temperature: false,
    tool_call: true,
    knowledge: "2024-05",
    release_date: "2025-04-16",
    last_updated: "2025-04-16",
    modalities: { input: ["text", "image"], output: ["text"] },
    open_weights: false,
    limit: { context: 200000, output: 100000 },
  },
  "gpt-5": {
    name: "GPT-5",
    attachment: true,
    reasoning: true,
    temperature: false,
    tool_call: true,
    knowledge: "2024-09-30",
    release_date: "2025-08-07",
    last_updated: "2025-08-07",
    modalities: {
      input: ["text", "audio", "image", "video"],
      output: ["text", "audio", "image"],
    },
    open_weights: false,
    limit: { context: 400000, output: 128000 },
  },
  "gpt-5-mini": {
    name: "GPT-5 Mini",
    attachment: true,
    reasoning: true,
    temperature: false,
    tool_call: true,
    knowledge: "2024-05-30",
    release_date: "2025-08-07",
    last_updated: "2025-08-07",
    modalities: { input: ["text", "image"], output: ["text"] },
    open_weights: false,
    limit: { context: 272000, output: 128000 },
  },
  'doubao-seed-1.6': {
    name: 'Doubao Seed 1.6',
    attachment: false,
    reasoning: true,
    temperature: true,
    tool_call: true,
    knowledge: '2025-01',
    release_date: '2025-06-11',
    last_updated: '2025-09-23',
    modalities: { input: ['text', 'image'], output: ['text'] },
    open_weights: true,
    limit: { context: 163840, output: 163840 },
  },
  'kimi-k2-0905': {
    name: 'Kimi K2 Instruct 0905',
    shortName: 'Kimi K2 0905',
    attachment: false,
    reasoning: false,
    temperature: true,
    tool_call: true,
    knowledge: '2024-10',
    release_date: '2025-09-05',
    last_updated: '2025-09-05',
    modalities: { input: ['text'], output: ['text'] },
    open_weights: true,
    limit: { context: 262144, output: 16384 },
  },
};


