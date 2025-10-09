// import { User } from "@/interfaces/User.ts";
import axios from "../axios.ts";
import { toast } from "react-toastify";
import type { Teacher } from "@/interfaces/ITeacher.ts";
export class AuthService {
  async createAccount(props: {
    username: string;
    email: string;
    password: string;
    upi_id: string;
  }) {
    const response = await axios.post("/teacher/register", props);
    if (response.status === 201) {
      toast.success("Account created successfully", {
        position: "bottom-right",
      });
      const obj: { email: string; password: string } = {
        email: props.email,
        password: props.password,
      };
      return this.login(obj);
    } else return null;
  }
  async login(props: { email: string; password: string }) {
    const response = await axios.post("/teacher/login", props);
    if (response.status === 200) {
      localStorage.setItem("accessToken", response.data.data.accessToken);
      return response;
    }
    return null;
  }
  async getCurrentUser() {
    let token = localStorage.getItem("accessToken");

    if (!token) {
      // Try to refresh token if accessToken is missing
      try {
        const res = await axios.get("/teacher/refresh-access-token");
        token = res.data.accessToken;
        localStorage.setItem("accessToken", token!);
      } catch (err) {
        // console.log("Session expired, please log in again.");
        return null;
      }
    }

    return axios.get("/teacher/get-current-user", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  async logout() {
    localStorage.removeItem("accessToken");
    const response = await axios.post("/teacher/logout");
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while logging out");
    }
  }
  async editData(data: Teacher) {
    const response = await axios.post("/teacher/update-user", {
      data,
    });
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while updating teacher");
    }
  }
  async getBatches() {
    const response = await axios.get("/teacher/get-user-batches");
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while getting teacher batches");
    }
  }
  async addBatch(data: { batch_id: string }) {
    const response = await axios.post("/teacher/add-user-batch", {
      data,
    });
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while adding teacher batches");
    }
  }
  async editBatch(data: { name: string; batch_id: string }) {
    const response = await axios.post("/teacher/update-user-batches", {
      data,
    });
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while updating teacher batches");
    }
  }
}

const teacherAuthService = new AuthService();

export default teacherAuthService;
