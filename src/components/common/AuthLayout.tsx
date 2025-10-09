import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ReactElement } from "react";
import authStore from "@/store/authStore";

interface ProtectedProps {
  children?: ReactElement;
  authentication: boolean;
}
export default function Protected({
  children,
  authentication = true,
}: ProtectedProps) {
  const navigate = useNavigate();
  const [loader, setLoader] = useState(true);
  const { authData } = authStore();
  useEffect(() => {
    if (authentication && authData.loggedIn !== authentication) {
      navigate("/choose-role");
    } else if (!authentication && authData.loggedIn !== authentication) {
      if (authData.role === "teacher") navigate("/teacher/dashboard");
      else if (authData.role === "student") navigate("/student/dashboard");
    }
    setLoader(false);
  }, [authData.loggedIn, navigate, authentication]);
  return loader ? <h1>Loading...</h1> : <>{children}</>;
}
