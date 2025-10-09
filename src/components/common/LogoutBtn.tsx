import { useNavigate } from "react-router-dom";
import logoutIcon from "/logout-icon-2.svg";
import { toast } from "react-toastify";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import authStore from "@/store/authStore";
import teacherStore from "@/store/teacherStore";
import studentStore from "@/store/studentStore";
import teacherAuthService from "@/services/teacherAuth";
import studentAuthService from "@/services/studentAuth";

export default function LogoutBtn() {
  const { teacherLogout } = teacherStore();
  const { studentLogout } = studentStore();
  const { authData, logout } = authStore();
  const navigate = useNavigate();
  const logoutFunction = async () => {
    try {
      const response =
        authData.role === "teacher"
          ? await teacherAuthService.logout()
          : await studentAuthService.logout();
      if (response && response.status === 200) {
        authData.role === "teacher" ? teacherLogout() : studentLogout();
        logout();
        navigate("/");
        toast.success("Logged out successfully", {
          position: "bottom-right",
        });
      }
    } catch (e) {
      toast.error(`Error while logging out : ${e}`, {
        position: "bottom-right",
      });
      console.log("Error while logout process : ", e);
    }
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger className="hover:scale-105 transition duration-150">
        <img src={logoutIcon} className="h-[30px] md:h-[43px]" />
      </AlertDialogTrigger>
      <AlertDialogContent
        className="max-w-3xl bg-darkest rounded-2xl shadow-2xl p-8  border-none
    [&>button]:text-white [&>button:hover]:text-gray-300"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-semibold text-white">
            Are you sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300 font-light">
            You will be logged out from the app.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="font-display">
          <AlertDialogCancel className="bg-inputBG hover:bg-darker hover:text-white">
            No
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-lighter hover:bg-lightest"
            onClick={logoutFunction}
          >
            Yes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
