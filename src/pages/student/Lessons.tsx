import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import batchService from "@/services/batches";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Lesson } from "@/interfaces/ILesson";
import type { Batch } from "@/interfaces/IBatch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
export default function Lessons() {
  const { batch_id } = useParams();
  const [batch, setBatch] = useState<Batch>();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null);

  const correctDateAndTimeForDisplay = (time: string) => {
    let localDate = new Date(time);
    return localDate.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Utility function to get lesson status
  const getLessonStatus = (start: string, end: string) => {
    const now = new Date();
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (now < startTime) return "Upcoming";
    if (now >= startTime && now <= endTime) return "Ongoing";
    return "Done";
  };

  const lessonsFetcher = async () => {
    if (!batch_id) return;
    setLoading(true);
    const serviceResponse = await batchService.getBatchLessons(batch_id);
    // console.log(serviceResponse);
    setBatch(serviceResponse?.data.data.batch);
    setLessons(serviceResponse?.data.data.batch.lessons);
    setLoading(false);
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
      <Dialog>
        <DialogTrigger
          disabled={loading}
          className={`${
            loading
              ? "bg-gray-500 text-gray-300"
              : "bg-lighter hover:bg-darker text-inputBG"
          } w-3/5 sm:w-2/5 lg:w-1/5  font-light py-4 rounded-lg text-xl lg:text-2xl hover:scale-95  transition`}
        >
          Batch Details
        </DialogTrigger>

        <DialogContent
          className="max-w-3xl bg-darkest rounded-2xl shadow-2xl p-8  border-none
    [&>button]:text-white [&>button:hover]:text-gray-300"
        >
          <DialogHeader>
            <DialogTitle className="text-3xl font-semibold text-center text-white mb-4">
              Batch Details
            </DialogTitle>
          </DialogHeader>

          {batch ? (
            <div className="text-inputBG">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono font-semibold text-xl md:text-2xl">
                    Name:
                  </p>
                  <p className="text-lg md:text-xl font-light">{batch.name}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono font-semibold text-xl md:text-2xl">
                    Teacher:
                  </p>
                  <p className="text-lg md:text-xl font-light">
                    {typeof batch.teacher === "object"
                      ? batch.teacher.username
                      : "Unknown Teacher"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono font-semibold text-xl md:text-2xl">
                    Price:
                  </p>
                  <p className="text-lg md:text-xl font-light">
                    ₹{batch.price}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono font-semibold text-xl md:text-2xl">
                    Start Date:
                  </p>
                  <p className="text-md md:text-xl font-light">
                    {correctDateAndTimeForDisplay(batch.start_date)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono font-semibold text-xl md:text-2xl">
                    End Date:
                  </p>
                  <p className="text-md md:text-xl font-light">
                    {correctDateAndTimeForDisplay(batch.end_date)}
                  </p>
                </div>
              </div>

              <Accordion
                type="single"
                collapsible
                className="border-b-2 border-lightest my-0"
                defaultValue="desc"
              >
                <AccordionItem value="desc">
                  <AccordionTrigger className="font-mono font-semibold text-xl md:text-2xl">
                    Description
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-lg md:text-xl font-light">
                      {batch.description ? batch.description : "Not available"}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Accordion
                type="single"
                collapsible
                className="border-b-2 border-lightest"
                defaultValue="topics"
              >
                <AccordionItem value="topics">
                  <AccordionTrigger className="font-mono font-semibold text-xl md:text-2xl">
                    Topics
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col">
                    {batch.topics && batch.topics.length > 0 ? (
                      batch.topics.map((topic: any, index: number) => (
                        <p
                          key={index}
                          className="text-lg md:text-xl font-light"
                        >
                          {" • "}
                          {topic.name}
                        </p>
                      ))
                    ) : (
                      <p className="text-lg md:text-xl font-light">
                        No topics available
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ) : (
            <p className="text-center text-gray-300">
              No batch data available.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <h1 className="text-white text-center text-4xl lg:text-5xl font-light mt-4">
        Batch Lessons
      </h1>
      {!loading ? (
        <div className="w-full">
          {lessons && lessons.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center py-5 lg:py-10 gap-4 lg:gap-5 w-5/6 lg:w-3/5 mx-auto bg-lightest rounded-lg mb-10">
              <div className="w-5/6 lg:w-4/5 flex flex-row justify-between items-center flex-wrap text-black text-xl lg:text-2xl px-4 rounded-lg">
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
                    className="w-5/6 lg:w-4/5 bg-lighter hover:bg-darker flex justify-between hover:scale-105 transition text-inputBG px-4 py-4 rounded-lg"
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
            <div className="flex flex-wrap flex-col items-center justify-center py-10 gap-5 lg:gap-5 w-4/5 mx-auto bg-lightest rounded-lg min-h-80">
              <h2 className="text-white text-center text-xl lg:text-2xl font-light">
                No lesson found!
              </h2>
            </div>
          )}

          {/* ShadCN Dialog for upcoming lesson details */}
          <Dialog open={!!openLesson} onOpenChange={() => setOpenLesson(null)}>
            <DialogContent
              className="max-w-3xl bg-darkest rounded-2xl shadow-2xl px-8 py-6 border-none
               [&>button]:text-white [&>button:hover]:text-gray-300"
            >
              <DialogHeader>
                <DialogTitle className="text-xl text-inputBG">
                  {openLesson?.name}
                </DialogTitle>
                <DialogDescription className="text-md text-inputBG font-light space-y-2 flex flex-col gap-0 mt-2">
                  <div>
                    <strong>Description:</strong>{" "}
                    {openLesson?.description || "Not available"}
                  </div>
                  <div>
                    <strong>Start:</strong>{" "}
                    {openLesson?.start_time
                      ? new Date(openLesson.start_time).toLocaleString()
                      : "Not available"}
                  </div>
                  <div>
                    <strong>End:</strong>{" "}
                    {openLesson?.end_time
                      ? new Date(openLesson.end_time).toLocaleString()
                      : "Not available"}
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-4 justify-between mt-4">
                {openLesson &&
                  (() => {
                    const status = getLessonStatus(
                      openLesson.start_time,
                      openLesson.end_time
                    );
                    const isDisabled = ["Upcoming", "Done"].includes(status);

                    return (
                      <Link
                        to={isDisabled ? "#" : `${openLesson._id}/room`}
                        onClick={(e) => {
                          if (isDisabled) e.preventDefault();
                        }}
                        className={`text-lg flex-grow rounded-lg flex justify-center items-center font-semibold transition py-1 ${
                          isDisabled
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                            : "bg-lighter hover:bg-darker text-inputBG"
                        }`}
                      >
                        Take Lesson
                      </Link>
                    );
                  })()}

                <Button
                  disabled={!openLesson?.recording_url}
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
          <div className="flex flex-wrap items-center justify-center py-5 lg:py-10 gap-4 lg:gap-5 w-5/6 lg:w-3/5 mx-auto bg-lightest rounded-lg mb-10">
            <Skeleton className="h-14 bg-lighter w-4/5" />
            <Skeleton className="h-14 bg-lighter w-4/5" />
          </div>
        </div>
      )}
    </motion.div>
  );
}
