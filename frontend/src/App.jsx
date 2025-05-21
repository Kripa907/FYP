import { Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Appointment from "./pages/Appointment";
import Option from "./pages/Option";
import Myprofile from "./pages/MyProfile";
import MyAppointment from "./pages/MyAppointment";
import DoctorForm from "./pages/DoctorForm";
import SubmissionPage from "./pages/SubmissionPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Chat from "./pages/chat";
import MyRecords from "./pages/MyRecords";
import NotificationContextProvider from "./context/NotificationContext";
import Verify from "./Components/verify";
import Unsuccessful from "./Components/Unsuccessful";
import Successful from "./Components/Successful";

const App = () => {
  const location = useLocation();
  const hideNavFooter =
    location.pathname === "/patient-login" ||
    location.pathname === "/" ||
    location.pathname === "/doctor-apply" ||
    location.pathname === "/submission" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password/:token" ||
    location.pathname === "/unsuccessfull/user" ||
    location.pathname === "/successfull/user" ||
    location.pathname === "/verify";

  // Only hide the footer on /chat and the above routes
  const hideFooter = hideNavFooter || location.pathname === "/chat";

  return (
    <NotificationContextProvider>
      <div className="mx-4 sm:mx-[10%]">
        <ToastContainer />
        {!hideNavFooter && <Navbar />}
        <Routes>
          <Route
            path="/"
            element={
              <div className="w-full mx-0">
                <Option />
              </div>
            }
          />
          <Route path="/patient-login" element={<Login />} />
          <Route path="home" element={<Home />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="doctors/:speciality" element={<Doctors />} />
          <Route path="/appointment/:docId" element={<Appointment />} />
          <Route path="/appointments" element={<MyAppointment />} />
          <Route path="/my-records" element={<MyRecords />} />
          <Route path="/my-profile" element={<Myprofile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/doctor-apply" element={<DoctorForm />} />
          <Route path="/submission" element={<SubmissionPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unsuccessfull/user" element={<Unsuccessful />} />
          <Route path="/successfull/user" element={<Successful />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          {/* Handle unknown routes */}
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Routes>
        {!hideFooter && <Footer />}
      </div>
    </NotificationContextProvider>
  );
};

export default App;
