import React from "react";
import Admin from "../Layout/Admin/Admin";

// Routes
const Dashboard = React.lazy(() => import("../Screens/Admin/Dashboard"));
const AdminSubmissions = React.lazy(() =>
  import("../Screens/Admin/AdminSubmissions")
);
const Members = React.lazy(() => import("../Screens/Admin/Members"));
const Agents = React.lazy(() => import("../Screens/Admin/Agents"));

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
  {
    path: "/manage/ngo",
    element: (
      <Admin>
        <Members />
      </Admin>
    ),
  },
  {
    path: "/manage/agents",
    element: (
      <Admin>
        <Agents />
      </Admin>
    ),
  },
];

export default AdminRoutes;
