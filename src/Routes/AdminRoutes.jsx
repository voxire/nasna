import React from "react";
import Admin from "../Layout/Admin/Admin";

// Routes
const Dashboard = React.lazy(() => import("../Screens/Admin/Dashboard"));
const AdminSubmissions = React.lazy(() =>
  import("../Screens/Admin/AdminSubmissions")
);

const AdminRoutes = [
  {
    path: "/manage",
    element: (
      <Admin>
        <Dashboard />
      </Admin>
    ),
  },
  {
    path: "/manage/submissions",
    element: (
      <Admin>
        <AdminSubmissions />
      </Admin>
    ),
  },
];

export default AdminRoutes;
