import teacherAuthService from "@/services/teacherAuth";
import teacherStore from "@/store/teacherStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import loadingIcon from "/loading-3-icon.svg";
import warningIcon from "/warning-1-icon.svg";
import { teacherSignInSchema } from "@/schemas/teacherSignInSchema";
import { z } from "zod";
import authStore from "@/store/authStore";

type SignInFormData = z.infer<typeof teacherSignInSchema>;

export default function TeacherLogin() {
  const { teacherLogin } = teacherStore();
  const { authData, saveLogin } = authStore();
  const [error, setError] = useState<string>("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({ resolver: zodResolver(teacherSignInSchema) });
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  if(authData.loggedIn){
    navigate("/");
  }

  const loginFunc: SubmitHandler<SignInFormData> = async (data) => {
    setError("");
    setLoading(true);
    try {
      const session = await teacherAuthService.login(data);
      // console.log(session);
      if (session && session.status === 200) {
        const userData = await teacherAuthService.getCurrentUser();
        // console.log("User Data : ", userData);
        if (userData) {
          const serializableUserData = {
            id: userData.data.data._id,
            email: userData.data.data.email,
            username: userData.data.data.username,
            upi_id: userData.data.data.upi_id,
          };
          // console.log("Data : ", serializableUserData);
          // dispatch(authLogin(serializableUserData));
          teacherLogin(serializableUserData);
          saveLogin({ loggedIn: true, role: "teacher" });
          toast.success("Logged in successfully", { position: "bottom-right" });
          navigate("/teacher/dashboard");
        }
      }
    } catch (error: any) {
      // console.log(error);
      switch (error.response.status) {
        case 401:
          setError("Incorrect Password");
          break;
        case 404:
          setError("User does not exist");
          break;
        case 400:
          setError("Email is required");
          break;
        default:
          setError(error.message);
      }
      // setError(error.message);
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
        Sign in to your account
      </h2>
      <div
        className={`mx-4 lg:mx-auto w-full max-w-lg bg-lighter shadow-lg rounded-xl px-10 py-5`}
      >
        {/* <div className="mb-2 flex justify-center">
          <span className="inline-block w-full max-w-[100px]">
            <Logo width="100%" />
          </span>
        </div> */}

        {error && (
          <p className="text-red-600 mb-2 text-center bg-darker w-fit mx-auto py-1 px-5 rounded-2xl flex justify-center items-center gap-2">
            <span>
              <img src={warningIcon} className="h-[20px]" />
            </span>
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit(loginFunc)} className="">
          <div className="space-y-5 text-white">
            <Input
              label="Email: "
              placeholder="Enter your email "
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
              label="Password: "
              type="password"
              err={
                errors.password && errors.password.message
                  ? { message: errors.password.message }
                  : { message: "" }
              }
              placeholder="Enter your password"
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
                Sign in
                {loading && (
                  <img src={loadingIcon} className="h-[35px] animate-spin" />
                )}
              </>
            </Button>
            <p className="mt-2 text-center text-base text-white/60">
              Don&apos;t have any account?&nbsp;
              <Link
                to="/teacher/signup"
                className="font-medium text-inputBG transition-all duration-200 hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
