import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.tsx";
import TeacherSignUp from "./pages/teacher/auth/TeacherSignUp.tsx";
import TeacherLogin from "./pages/teacher/auth/TeacherLogin.tsx";
import TeacherDashboard from "./pages/teacher/Dashboard.tsx";
import RoleChoose from "./pages/RoleChoose.tsx";
import StudentSignUp from "./pages/student/auth/StudentSignUp.tsx";
import StudentLogin from "./pages/student/auth/StudentLogin.tsx";
import StudentDashboard from "./pages/student/Dashboard.tsx";
import App from "./App.tsx";
import AuthLayout from "./components/common/AuthLayout.tsx";
import ManageBatches from "./pages/teacher/ManageBatches.tsx";
import TeacherProfile from "./pages/teacher/Profile.tsx";
import ManageLessons from "./pages/teacher/ManageLessons.tsx";
import Batches from "./pages/student/Batches.tsx";
import Lessons from "./pages/student/Lessons.tsx";
import NewBatches from "./pages/student/NewBatches.tsx";
import ActiveLesson from "./pages/teacher/ActiveLesson.tsx";
import StudentRoom from "./pages/student/Room.tsx";
import TeacherRoom from "./pages/teacher/Room.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        {/* Root routes */}
        <Route index element={<Home />} />
        <Route path="choose-role" element={<RoleChoose />} />

        {/* Teacher routes */}
        <Route path="teacher">
          <Route path="signup" element={<TeacherSignUp />} />
          <Route path="login" element={<TeacherLogin />} />
          <Route
            path="dashboard"
            element={
              <AuthLayout authentication={true}>
                <TeacherDashboard />
              </AuthLayout>
            }
          />
          <Route path="manage-batches">
            <Route
              index
              element={
                <AuthLayout authentication={true}>
                  <ManageBatches />
                </AuthLayout>
              }
            />
            <Route
              path=":batch_id/lessons"
              element={
                <AuthLayout authentication={true}>
                  <ManageLessons />
                </AuthLayout>
              }
            />
            <Route path=":batch_id/active-lesson">
              <Route
                index
                element={
                  <AuthLayout authentication={true}>
                    <ActiveLesson />
                  </AuthLayout>
                }
              />
              <Route
                path=":roomId/room"
                element={
                  <AuthLayout authentication={true}>
                    <TeacherRoom />
                  </AuthLayout>
                }
              />
            </Route>
          </Route>
          <Route
            path="profile"
            element={
              <AuthLayout authentication={true}>
                <TeacherProfile />
              </AuthLayout>
            }
          />
        </Route>

        {/* Student routes */}
        <Route path="student">
          <Route path="signup" element={<StudentSignUp />} />
          <Route path="login" element={<StudentLogin />} />
          <Route
            path="dashboard"
            element={
              <AuthLayout authentication={true}>
                <StudentDashboard />
              </AuthLayout>
            }
          />
          <Route
            path="new-batches"
            element={
              <AuthLayout authentication={true}>
                <NewBatches />
              </AuthLayout>
            }
          />
          <Route path="enrolled-batches">
            <Route
              index
              element={
                <AuthLayout authentication={true}>
                  <Batches />
                </AuthLayout>
              }
            />
            <Route path=":batch_id/lessons">
              <Route
                index
                element={
                  <AuthLayout authentication={true}>
                    <Lessons />
                  </AuthLayout>
                }
              />
              <Route
                path=":roomId/room"
                element={
                  <AuthLayout authentication={true}>
                    <StudentRoom />
                  </AuthLayout>
                }
              />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>
);
