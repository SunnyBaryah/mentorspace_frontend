import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import studentAuthService from "@/services/studentAuth";
export default function Batches() {
  const [batches, setBatches] = useState([]);

  const batchesFetcher = async () => {
    const serviceResponse = await studentAuthService.getEnrolledBatches();
    // console.log(serviceResponse);
    setBatches(serviceResponse?.data.data);
  };

  const getBatchStatus = (start: string, end: string) => {
    const now = new Date();
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (now < startTime) return "Starting soon";
    if (now >= startTime && now <= endTime) return "Active";
    return "Complete";
  };

  useEffect(() => {
    batchesFetcher();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 100 }}
      exit={{ opacity: 0 }}
      className="min-h-dvh flex flex-col items-center gap-8 bg-gradient-to-br from-[#070F2B] to-[#535C91] pt-32"
    >
      <h1 className="text-white text-center text-4xl lg:text-5xl font-light">
        Your Batches
      </h1>
      <div className="w-full">
        {batches && batches.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center py-5 lg:py-10 gap-2 lg:gap-5 w-5/6 lg:w-3/5 mx-auto bg-lightest rounded-lg">
            <div className="w-5/6 lg:w-4/5 flex flex-row justify-between items-center flex-wrap text-black text-xl lg:text-2xl px-4 rounded-lg">
              <h1 className="text-2xl">Name</h1>
              <h1 className="text-2xl">Status</h1>
            </div>
            {batches.map(
              (
                batch: {
                  _id: string;
                  name: string;
                  start_date: string;
                  end_date: string;
                },
                ind
              ) => {
                const status = getBatchStatus(batch.start_date, batch.end_date);
                return (
                  <Link
                    className="w-5/6 lg:w-4/5 bg-lighter hover:bg-darker flex justify-between hover:scale-105 transition text-inputBG px-4 py-4 rounded-lg"
                    key={ind}
                    to={`${batch._id}/lessons`}
                  >
                    <span>{batch.name}</span>
                    <span
                      className={`font-semibold ${
                        status === "Active"
                          ? "text-green-500"
                          : status === "Starting soon"
                          ? "text-yellow-500"
                          : "text-gray-400"
                      }`}
                    >
                      {status}
                    </span>
                  </Link>
                );
              }
            )}
          </div>
        ) : (
          <div className="flex flex-wrap flex-col items-center justify-center py-10 gap-5 lg:gap-5 w-4/5 mx-auto bg-lightest rounded-lg min-h-80">
            <h2 className="text-white text-center text-xl lg:text-2xl font-light">
              No batch found!
            </h2>
          </div>
        )}
      </div>
    </motion.div>
  );
}
