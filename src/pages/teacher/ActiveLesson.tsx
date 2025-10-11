import { AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Lesson } from "@/interfaces/ILesson";
import batchService from "@/services/batches";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
export default function ActiveLesson() {
  const { batch_id } = useParams();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null);

  const getLessonStatus = (start: string, end: string) => {
    const now = new Date();
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (now < startTime) return "Upcoming";
    if (now >= startTime && now <= endTime) return "Ongoing";
    return "Done";
  };

  const lessonsFetcher = async () => {
    setLoading(true);
    if (!batch_id) return;
    const serviceResponse = await batchService.getBatchLessons(batch_id);
    // console.log(serviceResponse);
    const activeLessons = serviceResponse?.data.data.batch.lessons.filter(
      (lesson: Lesson) =>
        getLessonStatus(lesson.start_time, lesson.end_time) === "Ongoing"
    );
    setLessons(activeLessons);
    // setLoading(false);
  };

  useEffect(() => {
    lessonsFetcher();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 100 }}
      exit={{ opacity: 0 }}
      className="min-h-dvh flex flex-col items-center gap-8 bg-gradient-to-br from-[#070F2B] to-[#535C91] pt-32"
    >
      <h1 className="text-white text-center text-4xl lg:text-5xl font-light">
        Active Lessons
      </h1>
      {!loading ? (
        <div className="w-full">
          {lessons && lessons.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-5 w-4/5 lg:w-3/5 xl:w-2/5 mx-auto bg-[#E5E7EB]/10 backdrop-blur-md rounded-2xl p-6 shadow-inner">
              <div className="w-5/6 lg:w-4/5 flex flex-row justify-between items-center flex-wrap text-inputBG text-xl lg:text-2xl md:px-4 rounded-lg">
                <h1 className="text-2xl">Name</h1>
                <h1 className="text-2xl">Status</h1>
              </div>

              {lessons.map((lesson: Lesson, ind) => {
                const status = getLessonStatus(
                  lesson.start_time,
                  lesson.end_time
                );

                const handleClick = (e: React.MouseEvent) => {
                  e.preventDefault(); // Prevent navigation
                  setOpenLesson(lesson);
                };

                return (
                  <button
                    key={ind}
                    onClick={handleClick}
                    className="w-full sm:w-5/6 lg:w-4/5 bg-[#9BA4B5]/70 hover:bg-[#B8C1D1] flex gap-5 justify-between hover:scale-105 transition text-[#070F2B] font-semibold px-4 py-4 rounded-lg"
                  >
                    <span>{lesson.name}</span>
                    <span
                      className={`font-semibold ${
                        status === "Ongoing"
                          ? "text-green-500"
                          : status === "Upcoming"
                          ? "text-yellow-500"
                          : "text-gray-400"
                      }`}
                    >
                      {status}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-5 w-full sm:w-4/5 lg:w-3/5 xl:w-2/5 mx-auto bg-[#E5E7EB]/10 backdrop-blur-md rounded-2xl p-6 shadow-inner">
              <h2 className="text-white text-center text-xl lg:text-2xl font-light">
                No active lesson found!
              </h2>
            </div>
          )}
          <Dialog open={!!openLesson} onOpenChange={() => setOpenLesson(null)}>
            <DialogContent className="bg-lighter">
              <AlertDialogHeader>
                <DialogTitle className="text-xl text-inputBG">
                  {openLesson?.name}
                </DialogTitle>
                <DialogDescription className="text-md text-inputBG font-light">
                  <p>
                    <strong>Description:</strong>{" "}
                    {openLesson?.description
                      ? openLesson.description
                      : "Not available"}
                  </p>
                  <p>
                    <strong>Start:</strong>{" "}
                    {openLesson?.start_time
                      ? new Date(openLesson.start_time).toLocaleString()
                      : "Not available"}
                  </p>
                  <p>
                    <strong>End:</strong>{" "}
                    {openLesson?.end_time
                      ? new Date(openLesson.end_time).toLocaleString()
                      : "Not available"}
                  </p>
                </DialogDescription>
              </AlertDialogHeader>

              <div className="flex flex-wrap gap-4 justify-between">
                {openLesson &&
                  (() => {
                    const status = getLessonStatus(
                      openLesson?.start_time,
                      openLesson?.end_time
                    );
                    const isDisabled = ["Upcoming", "Done"].includes(status);

                    return (
                      <Link
                        to={isDisabled ? "#" : `${openLesson._id}/room`}
                        onClick={(e) => {
                          if (isDisabled) {
                            e.preventDefault();
                            // Optional: open your dialog here for "Upcoming" lessons
                            // if (status === "Upcoming") {
                            //   setShowLessonDialog(true); // if you have dialog state
                            // }
                          }
                        }}
                        className={`text-lg flex-grow rounded-lg flex justify-center items-center font-semibold transition py-1 ${
                          isDisabled
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                            : "bg-darker hover:bg-darkest text-inputBG"
                        }`}
                      >
                        Take Lesson
                      </Link>
                    );
                  })()}
                <Button
                  disabled={!openLesson?.recording_url}
                  // onClick={() => setOpenLesson(null)}
                  className="flex-grow text-lg bg-lightest"
                >
                  View Recording
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="w-full">
          <div className="flex flex-wrap justify-center gap-5 w-4/5 lg:w-3/5 xl:w-2/5 mx-auto bg-[#E5E7EB]/10 backdrop-blur-md rounded-2xl p-6 shadow-inner">
            <Skeleton className="h-14 bg-[#9BA4B5]/90 w-4/5" />
            <Skeleton className="h-14 bg-[#9BA4B5]/90 w-4/5" />
          </div>
        </div>
      )}
    </motion.div>
  );
}
