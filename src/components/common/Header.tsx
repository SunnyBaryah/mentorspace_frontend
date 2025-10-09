import { Link } from "react-router-dom";
import Button from "./Button";
import authStore from "@/store/authStore";
import logoIcon from "/logo-4.svg";
import LogoutBtn from "./LogoutBtn";
import profileIcon from "/profile-3.svg";
import searchIcon from "/search-icon.svg";
import manageBatchesIcon from "/manage-batches-icon.svg";
export default function Header() {
  const { authData } = authStore();
  return (
    <div className="bg-inputBG/20 w-full fixed text-white py-3 px-4 md:px-8 flex justify-between items-center z-10">
      <div className="flex justify-center items-center gap-3 md:gap-4">
        <img src={logoIcon} className="h-[35px]" />
        <Link to="/" className="font-light text-xl md:text-2xl">
          MentorSpace
        </Link>
      </div>
      <div>
        {!authData.loggedIn ? (
          <Link to="/choose-role">
            <Button className="w-full bg-darkest px-3 py-1 rounded-md text-inputBG text-md md:text-md flex justify-center items-center gap-5 font-light">
              <>Login</>
            </Button>
          </Link>
        ) : (
          <div className="flex justify-between items-center gap-3 md:gap-6">
            {authData.role === "teacher" ? (
              <div className="flex justify-between items-center gap-3 md:gap-6">
                <Link to="/teacher/profile">
                  <img
                    src={profileIcon}
                    className="h-[25px] md:h-[36px] hover:scale-105 transition"
                  />
                </Link>
                <Link to="/teacher/manage-batches">
                  <img
                    src={manageBatchesIcon}
                    className="h-[30px] md:h-[43px] hover:scale-105 transition"
                  />
                </Link>
              </div>
            ) : (
              <div className="flex justify-between items-center gap-3 md:gap-6">
                <Link to="/student/new-batches">
                  <img
                    src={searchIcon}
                    className="h-[30px] md:h-[36px] hover:scale-105 transition"
                  />
                </Link>
                <Link to="/student/enrolled-batches">
                  <img
                    src={manageBatchesIcon}
                    className="h-[30px] md:h-[43px] hover:scale-105 transition"
                  />
                </Link>
              </div>
            )}
            <LogoutBtn />
          </div>
        )}
      </div>
    </div>
  );
}
