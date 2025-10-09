import { create } from "zustand";

type StudentData = {
  id: string;
  username: string;
  email: string;
  enrolled_batches?: string[];
};

type Store = {
  userData: StudentData;

  studentLogin: (userData: StudentData) => void;
  studentLogout: () => void;
  addBatch: (batch: string) => void;
};

const studentStore = create<Store>()((set) => ({
  userData: {
    username: "",
    email: "",
    id: "",
    enrolled_batches: [],
  },
  studentLogin: (newUserData) =>
    set(() => ({
      userData: newUserData,
    })),
  addBatch: (batch_id) =>
    set((state) => ({
      userData: {
        ...state.userData,
        enrolled_batches: state.userData.enrolled_batches
          ? [...state.userData.enrolled_batches, batch_id]
          : [batch_id],
      },
    })),
  studentLogout: () =>
    set(() => ({
      userData: {
        username: "",
        email: "",
        id: "",
        enrolled_batches: [],
      },
    })),
}));

export default studentStore;
