import React from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

import {
  About,
  CourseAssignments,
  CourseCertificate,
  Courses,
  CourseQuiz,
  EditProfile,
  Home,
  Login,
  MyCourses,
  PrivacyPolicy,
  Profile,
  Signup,
  Wishlist
} from "../pages/Index";
import { AddCourse, AddInstructors, AdminCourse, AdminDashboard, AdminInstructor, AdminStudent, EditCourse, EditInstructor, EditStudent } from "../components/Admin/Index";
import { CourseContentManager, InstructorCourses, InstructorDashboard, InstructorProfile, InstructorQuizChecks, InstructorStudents } from "../components/Instructor/Index";
import CoursePage from "../components/CoursePage";
import PayScannerPage from "../components/PayScannerPage";
import PaymentPage from "../components/PaymentPage";
import SyllabusPage from "../components/SyllabusPage";

const PublicLayout = ({ children }) => (
  <>
    {children}
    <Footer />
  </>
);

const AdminLayout = ({ children }) => <>{children}</>;
const InstructorLayout = ({ children }) => <>{children}</>;

const RequireAuth = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-white bg-black">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const RequireRole = ({ roles, children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-white bg-black">Loading...</div>;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/course" element={<PublicLayout><Courses /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
        <Route path="/privacy-policy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />

        <Route path="/profile" element={<RequireAuth><PublicLayout><Profile /></PublicLayout></RequireAuth>} />
        <Route path="/editprofile" element={<RequireAuth><PublicLayout><EditProfile /></PublicLayout></RequireAuth>} />
        <Route path="/my-courses" element={<RequireAuth><PublicLayout><MyCourses /></PublicLayout></RequireAuth>} />
        <Route path="/wishlist" element={<RequireAuth><PublicLayout><Wishlist /></PublicLayout></RequireAuth>} />

        <Route path="/courses/:courseId" element={<PublicLayout><CoursePage /></PublicLayout>} />
        <Route path="/courses/:courseId/syllabus" element={<PublicLayout><SyllabusPage /></PublicLayout>} />
        <Route path="/courses/:courseId/payment" element={<RequireAuth><PublicLayout><PaymentPage /></PublicLayout></RequireAuth>} />
        <Route path="/courses/:courseId/checkout" element={<RequireAuth><PublicLayout><PayScannerPage /></PublicLayout></RequireAuth>} />
        <Route path="/courses/:courseId/quizzes" element={<RequireAuth><PublicLayout><CourseQuiz /></PublicLayout></RequireAuth>} />
        <Route path="/courses/:courseId/assignments" element={<RequireAuth><PublicLayout><CourseAssignments /></PublicLayout></RequireAuth>} />
        <Route path="/courses/:courseId/certificate" element={<RequireAuth><PublicLayout><CourseCertificate /></PublicLayout></RequireAuth>} />

        <Route path="/admin/dashboard" element={<RequireAuth><RequireRole roles={["admin"]}><AdminLayout><AdminDashboard /></AdminLayout></RequireRole></RequireAuth>} />
        <Route path="/admin/courses" element={<RequireAuth><RequireRole roles={["admin"]}><AdminLayout><AdminCourse /></AdminLayout></RequireRole></RequireAuth>} />
        <Route path="/admin/students" element={<RequireAuth><RequireRole roles={["admin"]}><AdminLayout><AdminStudent /></AdminLayout></RequireRole></RequireAuth>} />
        <Route path="/admin/instructors" element={<RequireAuth><RequireRole roles={["admin"]}><AdminLayout><AdminInstructor /></AdminLayout></RequireRole></RequireAuth>} />
        <Route path="/admin/students/edit/:id" element={<RequireAuth><RequireRole roles={["admin"]}><AdminLayout><EditStudent /></AdminLayout></RequireRole></RequireAuth>} />
        <Route path="/admin/addcourses" element={<RequireAuth><RequireRole roles={["admin"]}><AdminLayout><AddCourse /></AdminLayout></RequireRole></RequireAuth>} />
        <Route path="/admin/addinstructors" element={<RequireAuth><RequireRole roles={["admin"]}><AdminLayout><AddInstructors /></AdminLayout></RequireRole></RequireAuth>} />
        <Route path="/admin/editcourse/:courseId" element={<RequireAuth><RequireRole roles={["admin"]}><AdminLayout><EditCourse /></AdminLayout></RequireRole></RequireAuth>} />
        <Route path="/admin/courses/:courseId/content" element={<RequireAuth><RequireRole roles={["admin"]}><AdminLayout><CourseContentManager panel="admin" /></AdminLayout></RequireRole></RequireAuth>} />
        <Route path="/admin/editinstructor/:id" element={<RequireAuth><RequireRole roles={["admin"]}><AdminLayout><EditInstructor /></AdminLayout></RequireRole></RequireAuth>} />

        <Route path="/instructor/dashboard" element={<RequireAuth><RequireRole roles={["instructor", "admin"]}><InstructorLayout><InstructorDashboard /></InstructorLayout></RequireRole></RequireAuth>} />
        <Route path="/instructor/courses" element={<RequireAuth><RequireRole roles={["instructor", "admin"]}><InstructorLayout><InstructorCourses /></InstructorLayout></RequireRole></RequireAuth>} />
        <Route path="/instructor/profile" element={<RequireAuth><RequireRole roles={["instructor", "admin"]}><InstructorLayout><InstructorProfile /></InstructorLayout></RequireRole></RequireAuth>} />
        <Route path="/instructor/students" element={<RequireAuth><RequireRole roles={["instructor", "admin"]}><InstructorLayout><InstructorStudents /></InstructorLayout></RequireRole></RequireAuth>} />
        <Route path="/instructor/quiz-checks" element={<RequireAuth><RequireRole roles={["instructor", "admin"]}><InstructorLayout><InstructorQuizChecks /></InstructorLayout></RequireRole></RequireAuth>} />
        <Route path="/instructor/courses/:courseId/content" element={<RequireAuth><RequireRole roles={["instructor", "admin"]}><InstructorLayout><CourseContentManager panel="instructor" /></InstructorLayout></RequireRole></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
