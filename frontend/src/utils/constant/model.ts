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
