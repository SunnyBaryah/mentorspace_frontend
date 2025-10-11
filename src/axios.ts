import axios from "axios";
import { backend_url } from "./constants";

const API = axios.create({
  baseURL: backend_url,
  withCredentials: true,
  timeout: 25000,
});
export default API;
