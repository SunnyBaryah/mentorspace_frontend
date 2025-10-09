import { create } from "zustand";

export const useMessageStore = create((set) => ({
  messages: [],
  addMessage: (message: string) =>
    set((state: { messages: string[] }) => ({
      messages: [...state.messages, ...message],
    })),
  clearMessages: () => set(() => ({ messages: [] })),
}));

export const useVidSrcStore = create((set) => ({
  isDeviceLoaded: false,
  setDeviceLoaded: (val: boolean) => set({ isDeviceLoaded: val }),
}));

export default useVidSrcStore;
