import type { Lesson } from "@/interfaces/ILesson.ts";
import axios from "../axios.ts";
// import { toast } from "react-toastify";
import type { Batch } from "@/interfaces/IBatch.ts";
export class BatchService {
  async getBatchLessons(id: string) {
    const response = await axios.get(`/batch/all-lessons?batchId=${id}`);
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while getting batch lessons");
    }
  }
  async addLessonToBatch(id: string, data: Lesson) {
    const response = await axios.post(`/batch/add-lesson?batch_id=${id}`, {
      data,
    });
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while getting batch lessons");
    }
  }
  async getBatch(id: string) {
    const response = await axios.get(`/batch/current?id=${id}`);
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while getting batch");
    }
  }
  async addBatch(data: Batch) {
    const response = await axios.post("/batch/add", {
      data,
    });
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while adding batch");
    }
  }
  async updateBatch(data: Batch) {
    const response = await axios.put("/batch/update", {
      data,
    });
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while updating batch");
    }
  }

  async searchBatches(query: string) {
    const response = await axios.get(`/batch/search?query=${query}`);
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while searching batches");
    }
  }
}

const batchService = new BatchService();

export default batchService;
