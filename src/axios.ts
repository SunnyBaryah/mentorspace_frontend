import axios from "axios";
const API = axios.create({
  // baseURL: "https://code-geek-server-seven.vercel.app/api/v1",
  baseURL: "http://localhost:9000/api/v1",
  withCredentials: true,
  timeout: 25000,
});
export default API;
