// import { User } from "@/interfaces/User.ts";
import axios from "../axios.ts";
import { toast } from "react-toastify";
export class AuthService {
  async createAccount(props: {
    username: string;
    email: string;
    password: string;
  }) {
    const response = await axios.post("/student/register", props);
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
    const response = await axios.post("/student/login", props);
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
        const res = await axios.get("/student/refresh-access-token");
        token = res.data.accessToken;
        localStorage.setItem("accessToken", token!);
      } catch (err) {
        // console.log("Session expired, please log in again.");
        return null;
      }
    }

    return axios.get("/student/get-current-user", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  async logout() {
    localStorage.removeItem("accessToken");
    const response = await axios.post("/student/logout");
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while logging out");
    }
  }

  async getEnrolledBatches() {
    const response = await axios.get("/student/get-enrolled-batches");
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while getting enrolled batches");
    }
  }
}

const studentAuthService = new AuthService();

export default studentAuthService;
