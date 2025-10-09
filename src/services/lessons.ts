import axios from "../axios.ts";
// import { toast } from "react-toastify";
import type { Lesson } from "@/interfaces/ILesson.ts";
export class LessonService {
  async getLesson(id: string) {
    const response = await axios.get(`/lesson/current?id=${id}`);
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while getting lesson");
    }
  }
  async addLesson(data: Lesson) {
    const response = await axios.post("/lesson/add", {
      data,
    });
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while adding lesson");
    }
  }
  async updateLesson(data: Lesson) {
    const response = await axios.put("/lesson/update", {
      data,
    });
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while updating lesson");
    }
  }
}
const lessonService = new LessonService();

export default lessonService;
