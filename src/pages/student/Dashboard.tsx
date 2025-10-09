import studentStore from "@/store/studentStore";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { userData } = studentStore();
  useEffect(() => {
    // console.log("Teacher data : ", userData);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 100 }}
      exit={{ opacity: 0 }}
      className="min-h-dvh flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-[#070F2B] to-[#535C91] pt-18 lg:pt-0"
    >
      <h1 className="text-white text-center text-4xl lg:text-5xl font-light">
        Welcome {userData.username}!
      </h1>
      <div className="flex flex-wrap justify-center items-center gap-5 lg:gap-10 w-4/5">
        <Link
          to="/student/new-batches"
          className="h-4/5 w-4/5 sm:h-2/5 sm:w-2/5 bg-lighter rounded-xl flex flex-col justify-center items-center gap-5 hover:scale-102 transition shadow-lg py-3"
        >
          <img
            src="/dashboard-search-batches-1.png"
            className="h-4/5 w-4/5 bg-lightest p-4 rounded-xl"
          />
          <p className="text-2xl lg:text-3xl font-light text-white">
            Search new batches
          </p>
        </Link>
        <Link
          to="/student/enrolled-batches"
          className="h-4/5 w-4/5 sm:h-2/5 sm:w-2/5 bg-lighter rounded-xl flex flex-col justify-center items-center gap-5 hover:scale-102 transition shadow-lg py-3"
        >
          <img
            src="/dashboard-batches-2.png"
            className="h-4/5 w-4/5 bg-lightest p-4 rounded-xl"
          />
          <p className="text-2xl lg:text-3xl font-light text-white">
            Your Batches
          </p>
        </Link>
      </div>
    </motion.div>
  );
}
