import { z } from "zod";
import { studentSignUpSchema } from "@/schemas/studentSignUpSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";

import { motion } from "framer-motion";
import Input from "@/components/common/Input";
import loadingIcon from "/loading-3-icon.svg";
import warningIcon from "/warning-1-icon.svg";
import Button from "@/components/common/Button";
import studentStore from "@/store/studentStore";
import studentAuthService from "@/services/studentAuth";
import authStore from "@/store/authStore";

type StudentSignUpFormData = z.infer<typeof studentSignUpSchema>;

export default function StudentSignUp() {
  const { studentLogin } = studentStore();
  const { authData, saveLogin } = authStore();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<boolean>(false);

  if (authData.loggedIn) {
    navigate("/");
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentSignUpFormData>({
    resolver: zodResolver(studentSignUpSchema),
  });

  const create: SubmitHandler<StudentSignUpFormData> = async (data) => {
    setLoading(true);
    try {
      const userData = await studentAuthService.createAccount(data);
      if (userData) {
        const userData = await studentAuthService.getCurrentUser();
        if (userData) {
          const serializableUserData = {
            id: userData.data.data._id,
            email: userData.data.data.email,
            username: userData.data.data.username,
          };
          studentLogin(serializableUserData);
          saveLogin({ loggedIn: true, role: "student" });
          toast.success("Signed Up successfully", { position: "bottom-right" });
          navigate("/student/dashboard");
        }
      }
    } catch (error: any) {
      switch (error.response.status) {
        case 400:
          setError("All fields are required");
          break;
        case 409:
          setError("User already exists");
          break;
        default:
          setError(error.message);
      }
    }
    setLoading(false);
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 100 }}
      exit={{ opacity: 0 }}
      className="min-h-dvh flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-[#070F2B] to-[#535C91]"
    >
      <h2 className="text-white text-center text-3xl font-light">
        Sign up to create account
      </h2>
      <div
        className={`mx-4 lg:mx-auto w-full max-w-lg bg-lighter shadow-lg rounded-xl px-10 py-5`}
      >
        {error && (
          <p className="text-red-600 mb-2 text-center bg-darker w-fit mx-auto py-1 px-5 rounded-2xl flex justify-center items-center gap-2">
            <span>
              <img src={warningIcon} className="h-[20px]" />
            </span>
            {error}
          </p>
        )}
        <form className="" onSubmit={handleSubmit(create)}>
          <div className="space-y-5 text-white">
            <Input
              label="Username: "
              placeholder="Enter your username"
              err={
                errors.username && errors.username.message
                  ? { message: errors.username.message }
                  : { message: "" }
              }
              {...register("username", {
                required: true,
              })}
            />
            <Input
              label="Email: "
              placeholder="Enter your email"
              type="email"
              err={
                errors.email && errors.email.message
                  ? { message: errors.email.message }
                  : { message: "" }
              }
              {...register("email", {
                required: true,
              })}
            />
            <Input
              label="Password :"
              placeholder="Enter your password"
              type="password"
              err={
                errors.password && errors.password.message
                  ? { message: errors.password.message }
                  : { message: "" }
              }
              {...register("password", {
                required: true,
              })}
            />
            <Button
              disabled={loading}
              type="submit"
              className="w-full bg-darkest py-2 rounded-md text-inputBG text-lg flex justify-center items-center gap-5"
            >
              <>
                Create Account
                {loading && (
                  <img src={loadingIcon} className="h-[35px] animate-spin" />
                )}
              </>
            </Button>
            <p className="mt-2 text-center text-base text-white/60">
              Already have an account?&nbsp;
              <Link
                to="/student/login"
                className="font-medium text-inputBG transition-all duration-200 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
