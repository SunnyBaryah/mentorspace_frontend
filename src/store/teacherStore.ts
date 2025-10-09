import { create } from "zustand";

type TeacherData = {
  id: string;
  username: string;
  email: string;
  upi_id: string;
};

type Store = {
  userData: TeacherData;

  teacherLogin: (userData: TeacherData) => void;
  teacherLogout: () => void;
};

const teacherStore = create<Store>()((set) => ({
  userData: {
    username: "",
    email: "",
    upi_id: "",
    id: "",
  },
  teacherLogin: (newUserData) =>
    set(() => ({
      userData: newUserData,
    })),
  teacherLogout: () =>
    set(() => ({
      userData: {
        username: "",
        email: "",
        upi_id: "",
        id: "",
      },
    })),
}));

export default teacherStore;
