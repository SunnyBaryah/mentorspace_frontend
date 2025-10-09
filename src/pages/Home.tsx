import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Video, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import authStore from "@/store/authStore";

export default function Home() {
  const { authData } = authStore();
  const features = [
    {
      icon: <BookOpen className="w-8 h-8 text-indigo-400" />,
      title: "Interactive Learning",
      desc: "Join live and recorded lessons designed by expert mentors.",
    },
    {
      icon: <Users className="w-8 h-8 text-indigo-400" />,
      title: "Expert Teachers",
      desc: "Learn from top educators with proven teaching experience.",
    },
    {
      icon: <Video className="w-8 h-8 text-indigo-400" />,
      title: "Live & Recorded Classes",
      desc: "Attend live sessions or watch recordings anytime, anywhere.",
    },
    {
      icon: <Wallet className="w-8 h-8 text-indigo-400" />,
      title: "Secure Payments",
      desc: "Fast, secure Razorpay-powered payments with instant enrollment.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-dvh flex flex-col items-center justify-center gap-12 bg-gradient-to-br from-[#070F2B] to-[#535C91] text-white px-6 py-20"
    >
      {/* 🌟 Hero Section */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="text-center max-w-3xl"
      >
        <h1 className="text-4xl md:text-6xl h-12 md:h-20 font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          MentorSpace
        </h1>
        <p className="text-lg md:text-xl font-light text-gray-200">
          Learn from mentors who care. Explore courses, join live sessions, and
          master new skills from anywhere.
        </p>
        <Link
          to={`${
            authData.loggedIn
              ? authData.role === "teacher"
                ? "/teacher/dashboard"
                : "/student/dashboard"
              : "/choose-role"
          }`}
        >
          <Button
            size="lg"
            className="text-lg mt-6 bg-lighter hover:bg-darker text-white rounded-full shadow-lg"
          >
            {authData.loggedIn ? "Go to dashboard" : "Signup today"}
          </Button>
        </Link>
      </motion.div>

      {/* 🚀 Features Section */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full"
      >
        {features.map((feature, i) => (
          <Card
            key={i}
            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-transform hover:-translate-y-2"
          >
            <CardContent className="flex flex-col items-center text-center gap-4 py-8">
              {feature.icon}
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-gray-300 text-sm">{feature.desc}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* 🧠 Footer Quote */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-gray-300 text-center text-sm md:text-base italic"
      >
        “Empowering students through technology and mentorship.”
      </motion.p>
    </motion.div>
  );
}
