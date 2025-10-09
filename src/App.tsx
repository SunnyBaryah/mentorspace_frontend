import { Outlet } from "react-router-dom";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "./components/common/Header";

function App() {
  return (
    <div>
      <Header />
      <Outlet />
      <ToastContainer theme="dark" />
    </div>
  );
}

export default App;
