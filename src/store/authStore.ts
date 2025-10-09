import { create } from "zustand";

type authData = {
  loggedIn: boolean;
  role: string;
};

type Store = {
  authData: authData;

  saveLogin: (authData: authData) => void;
  logout: () => void;
};

const authStore = create<Store>()((set) => ({
  authData: {
    loggedIn: false,
    role: "none",
  },
  saveLogin: (newUserData) =>
    set(() => ({
      authData: newUserData,
    })),
  logout: () =>
    set(() => ({
      authData: {
        loggedIn: false,
        role: "none",
      },
    })),
}));

export default authStore;
