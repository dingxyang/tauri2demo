export type Model = {
  id: string;
  provider: string;
  name: string;
  group: string;
};

export enum SystemProvider {
  openai = "openai",
  doubao = "doubao",
  defaultprovider = "defaultprovider",
}

export const SYSTEM_MODELS: Record<SystemProvider, Model[]> = {
  [SystemProvider.defaultprovider]: [
    {
      id: 'DeepSeek-V3',
      provider: 'deepseek',
      name: 'DeepSeek-V3',
      group: 'deepseek',
    }
  ],
  [SystemProvider.openai]: [
    {
      id: "gpt-3.5-turbo",
      provider: SystemProvider.openai,
      name: "GPT-3.5-Turbo",
      group: "openai",
    },
  ],
  [SystemProvider.doubao]: [
    {
      id: "deepseek-v3-250324",
      provider: SystemProvider.doubao,
      name: "DeepSeek-V3",
      group: "deepseek",
    },
  ],
};


export const DEF_DOUBAO_MODEL = "deepseek-v3-250324";
export const DEF_OPENAI_MODEL = "gpt-3.5-turbo";

export const SystemModels: Record<string, Model[]> = {
  [SystemProvider.doubao]: [
      {
        id: 'doubao-1-5-vision-pro-32k-250115',
        provider: 'doubao',
        name: 'doubao-1.5-vision-pro',
        group: 'Doubao-1.5-vision-pro'
      },
      {
        id: 'doubao-1-5-pro-32k-250115',
        provider: 'doubao',
        name: 'doubao-1.5-pro-32k',
        group: 'Doubao-1.5-pro'
      },
      {
        id: 'doubao-1-5-pro-32k-character-250228',
        provider: 'doubao',
        name: 'doubao-1.5-pro-32k-character',
        group: 'Doubao-1.5-pro'
      },
      {
        id: 'doubao-1-5-pro-256k-250115',
        provider: 'doubao',
        name: 'Doubao-1.5-pro-256k',
        group: 'Doubao-1.5-pro'
      },
      {
        id: 'deepseek-r1-250120',
        provider: 'doubao',
        name: 'DeepSeek-R1',
        group: 'DeepSeek'
      },
      {
        id: 'deepseek-r1-distill-qwen-32b-250120',
        provider: 'doubao',
        name: 'DeepSeek-R1-Distill-Qwen-32B',
        group: 'DeepSeek'
      },
      {
        id: 'deepseek-r1-distill-qwen-7b-250120',
        provider: 'doubao',
        name: 'DeepSeek-R1-Distill-Qwen-7B',
        group: 'DeepSeek'
      },
      {
        id: 'deepseek-v3-250324',
        provider: 'doubao',
        name: 'DeepSeek-V3',
        group: 'DeepSeek'
      },
      {
        id: 'doubao-pro-32k-241215',
        provider: 'doubao',
        name: 'Doubao-pro-32k',
        group: 'Doubao-pro'
      },
      {
        id: 'doubao-pro-32k-functioncall-241028',
        provider: 'doubao',
        name: 'Doubao-pro-32k-functioncall-241028',
        group: 'Doubao-pro'
      },
      {
        id: 'doubao-pro-32k-character-241215',
        provider: 'doubao',
        name: 'Doubao-pro-32k-character-241215',
        group: 'Doubao-pro'
      },
      {
        id: 'doubao-pro-256k-241115',
        provider: 'doubao',
        name: 'Doubao-pro-256k',
        group: 'Doubao-pro'
      },
      {
        id: 'doubao-lite-4k-character-240828',
        provider: 'doubao',
        name: 'Doubao-lite-4k-character-240828',
        group: 'Doubao-lite'
      },
      {
        id: 'doubao-lite-32k-240828',
        provider: 'doubao',
        name: 'Doubao-lite-32k',
        group: 'Doubao-lite'
      },
      {
        id: 'doubao-lite-32k-character-241015',
        provider: 'doubao',
        name: 'Doubao-lite-32k-character-241015',
        group: 'Doubao-lite'
      },
      {
        id: 'doubao-lite-128k-240828',
        provider: 'doubao',
        name: 'Doubao-lite-128k',
        group: 'Doubao-lite'
      },
      {
        id: 'doubao-1-5-lite-32k-250115',
        provider: 'doubao',
        name: 'Doubao-1.5-lite-32k',
        group: 'Doubao-lite'
      },
      {
        id: 'doubao-embedding-large-text-240915',
        provider: 'doubao',
        name: 'Doubao-embedding-large',
        group: 'Doubao-embedding'
      },
      {
        id: 'doubao-embedding-text-240715',
        provider: 'doubao',
        name: 'Doubao-embedding',
        group: 'Doubao-embedding'
      },
      {
        id: 'doubao-embedding-vision-241215',
        provider: 'doubao',
        name: 'Doubao-embedding-vision',
        group: 'Doubao-embedding'
      },
      {
        id: 'doubao-vision-lite-32k-241015',
        provider: 'doubao',
        name: 'Doubao-vision-lite-32k',
        group: 'Doubao-vision-lite-32k'
      }
    ],
};