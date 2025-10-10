import Button from "@/components/common/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Lesson } from "@/interfaces/ILesson";
import batchService from "@/services/batches";
import lessonService from "@/services/lessons";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageLessons() {
  const { batch_id } = useParams();
  // console.log(batch_id);
  const { register, handleSubmit, setValue, reset } = useForm<Lesson>();
  const [lessons, setLessons] = useState([]);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [editLoading, setEditLoading] = useState<boolean>(false);

  const lessonsFetcher = async () => {
    if (!batch_id) return;
    setLoading(true);
    const serviceResponse = await batchService.getBatchLessons(batch_id);
    // console.log(serviceResponse);
    setLessons(serviceResponse?.data.data.batch.lessons);
    setLoading(false);
  };

  const formatDateTimeLocal = (isoString?: string): string => {
    if (!isoString) return "";
    const d = new Date(isoString); // parsed as UTC
    const tzOffsetMs = d.getTimezoneOffset() * 60000; // minutes -> ms (may be negative)
    // shift the UTC time so that toISOString() shows the local time, then slice
    return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
  };

  const correctDateAndTime = (time: string) => {
    return new Date(time).toISOString(); // No manual offset subtraction
  };

  const correctDateAndTimeForDisplay = (time: string) => {
    let localDate = new Date(time);

    return localDate.toLocaleString("en-IN", {
      // weekday: "short", // e.g. Thu
      year: "numeric", // e.g. 2025
      month: "short", // e.g. Oct
      day: "numeric", // e.g. 2
      hour: "2-digit", // e.g. 08
      minute: "2-digit", // e.g. 30
      hour12: true, // AM/PM format
    });
  };

  const create = async (data: Lesson) => {
    data.start_time = correctDateAndTime(data.start_time);
    data.end_time = correctDateAndTime(data.end_time);

    let response;
    try {
      if (isEdit) {
        response = await lessonService.updateLesson(data);
        if (response)
          toast.success("Batch updated successfully", {
            position: "bottom-center",
          });
      } else {
        if (batch_id) {
          response = await batchService.addLessonToBatch(batch_id, data);
          if (response) toast.success("Lesson added to batch successfully");
        }
      }
      reset();
      setIsEdit(false);
      lessonsFetcher();
    } catch (error) {
      console.log(error);
    }
  };

  const handleEditClick = async (id: string) => {
    setEditLoading(true);
    if (isEdit === false) {
      setIsEdit(true);
    }
    const response = await lessonService.getLesson(id);
    if (!response) {
      return;
    }
    const foundLesson = response.data.data.foundLesson;
    // console.log("Found Batch", foundBatch);
    // const formatDateTimeLocal = (isoString: string): string => {
    //   return isoString.slice(0, 16); // Extracts 'YYYY-MM-DDTHH:MM'
    // };

    setValue("_id", foundLesson._id);
    setValue("name", foundLesson.name);
    setValue("description", foundLesson.description);
    setValue("start_time", formatDateTimeLocal(foundLesson.start_time));
    setValue("end_time", formatDateTimeLocal(foundLesson.end_time));
    setValue("recording_url", foundLesson.recording_url);
    setEditLoading(false);
  };

  useEffect(() => {
    lessonsFetcher();
  }, []);

  const clearDetails = () => {
    if (isEdit === true) {
      setIsEdit(false);
    }
    reset();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 100 }}
      exit={{ opacity: 0 }}
      className="min-h-dvh flex flex-col items-center gap-8 bg-gradient-to-br from-[#070F2B] to-[#535C91] pt-32"
    >
      <h1 className="text-white text-center text-4xl lg:text-5xl font-light">
        Manage your lessons
      </h1>
      <Dialog>
        <DialogTrigger
          onClick={clearDetails}
          className="bg-lighter hover:bg-darker w-3/5 lg:w-1/5 text-inputBG font-light py-4 rounded-lg lg:text-2xl hover:scale-95  transition"
        >
          + Add new Lesson
        </DialogTrigger>
        <DialogContent className="bg-darkest text-white border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle>Add a Lesson</DialogTitle>
          </DialogHeader>
          <div>
            <form onSubmit={handleSubmit(create)} className="w-full">
              <div className="my-2">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  {...register("name", {
                    required: true,
                  })}
                  className="bg-[#535C91] text-white border-0 mt-2"
                />
              </div>
              <div className="my-2">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  {...register("description")}
                  className="bg-[#535C91] text-white border-0 mt-2"
                />
              </div>
              <div className="my-2">
                <Label htmlFor="start_time">Start time</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  {...register("start_time", { required: true })}
                  className="bg-[#535C91] text-white border-0 mt-2"
                />
              </div>
              <div className="my-2">
                <Label htmlFor="end_time">End time</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  {...register("end_time", { required: true })}
                  className="bg-[#535C91] text-white border-0 mt-2"
                />
              </div>
              <div className="my-2">
                <Label htmlFor="recording_url">Recording URL</Label>
                <Input
                  id="recording_url"
                  type="text"
                  {...register("recording_url")}
                  className="bg-[#535C91] text-white border-0 mt-2"
                />
              </div>
              <Button
                className="mt-4 w-full bg-[#9BA4B5] hover:bg-[#B8C1D1] text-[#070F2B] hover:text-inputBG py-2 rounded-md font-medium shadow-md transition"
                type="submit"
              >
                <>Save changes</>
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      {!loading ? (
        <div className="w-full">
          {lessons && lessons.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-5 w-full sm:w-4/5 lg:w-3/5 xl:w-2/5 mx-auto bg-[#E5E7EB]/10 backdrop-blur-md rounded-2xl p-6 shadow-inner">
              <div className="w-5/6 lg:w-4/5 flex justify-between text-inputBG text-xl lg:text-2xl md:px-4 rounded-lg">
                <p>Name</p> <p>Start - End</p>
              </div>
              {lessons.map(
                (
                  lesson: {
                    _id: string;
                    name: string;
                    start_time: string;
                    end_time: string;
                  },
                  ind
                ) => {
                  return (
                    <Dialog key={ind}>
                      <DialogTrigger
                        className="w-full sm:w-5/6 lg:w-4/5 bg-[#9BA4B5]/90 hover:bg-[#B8C1D1] flex gap-5 justify-between hover:scale-105 transition text-[#070F2B] font-semibold px-4 py-4 rounded-lg"
                        onClick={() => handleEditClick(lesson._id)}
                      >
                        <p>{lesson.name}</p>{" "}
                        <p>
                          {correctDateAndTimeForDisplay(lesson.start_time)} -
                          {correctDateAndTimeForDisplay(lesson.end_time)}
                        </p>
                      </DialogTrigger>
                      {!editLoading ? (
                        <DialogContent className="bg-darkest text-white border-0 shadow-xl">
                          <DialogHeader>
                            <DialogTitle>Edit Lesson Details</DialogTitle>
                          </DialogHeader>
                          <div>
                            <form
                              onSubmit={handleSubmit(create)}
                              className="w-full"
                            >
                              <div className="my-2">
                                <Label htmlFor="name" className="text-right">
                                  Name
                                </Label>
                                <Input
                                  id="name"
                                  {...register("name", {
                                    required: true,
                                  })}
                                  className="bg-[#535C91] text-white border-0 mt-2"
                                />
                              </div>
                              <div className="my-2">
                                <Label
                                  htmlFor="description"
                                  className="text-right"
                                >
                                  Description
                                </Label>
                                <Input
                                  id="description"
                                  {...register("description")}
                                  className="bg-[#535C91] text-white border-0 mt-2"
                                />
                              </div>
                              <div className="my-2">
                                <Label htmlFor="start_time">Start time</Label>
                                <Input
                                  id="start_time"
                                  type="datetime-local"
                                  {...register("start_time", {
                                    required: true,
                                  })}
                                  className="bg-[#535C91] text-white border-0 mt-2"
                                />
                              </div>
                              <div className="my-2">
                                <Label htmlFor="end_time">End time</Label>
                                <Input
                                  id="end_time"
                                  type="datetime-local"
                                  {...register("end_time", { required: true })}
                                  className="bg-[#535C91] text-white border-0 mt-2"
                                />
                              </div>
                              <div className="my-2">
                                <Label htmlFor="recording_url">
                                  Recording URL
                                </Label>
                                <Input
                                  id="recording_url"
                                  type="text"
                                  {...register("recording_url")}
                                  className="bg-[#535C91] text-white border-0 mt-2"
                                />
                              </div>

                              <Button
                                className="mt-4 w-full bg-[#9BA4B5] hover:bg-[#B8C1D1] text-[#070F2B] hover:text-inputBG py-2 rounded-md font-medium shadow-md transition"
                                type="submit"
                              >
                                <>Save changes</>
                              </Button>
                            </form>
                          </div>
                        </DialogContent>
                      ) : (
                        <DialogContent className="bg-darkest border border-white/20 text-white">
                          <Skeleton className="bg-white/10 border-white/20 h-8 w-full mt-8" />
                          <Skeleton className="bg-white/10 border-white/20 h-8 w-full" />
                          <Skeleton className="bg-white/10 border-white/20 h-8 w-full" />
                          <Skeleton className="bg-white/10 border-white/20 h-8 w-full" />
                          <Skeleton className="bg-white/10 border-white/20 h-8 w-full" />
                        </DialogContent>
                      )}
                    </Dialog>
                  );
                }
              )}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-5 w-full sm:w-4/5 lg:w-3/5 xl:w-2/5 mx-auto bg-[#E5E7EB]/10 backdrop-blur-md rounded-2xl p-6 shadow-inner">
              <h2 className="text-white text-center text-xl lg:text-2xl font-light">
                No lessons found!
              </h2>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-5 w-full sm:w-4/5 lg:w-3/5 xl:w-2/5 mx-auto bg-[#E5E7EB]/10 backdrop-blur-md rounded-2xl p-6 shadow-inner">
          <Skeleton className="h-14 bg-[#9BA4B5]/90 w-4/5" />
          <Skeleton className="h-14 bg-[#9BA4B5]/90 w-4/5" />
        </div>
      )}
    </motion.div>
  );
}
