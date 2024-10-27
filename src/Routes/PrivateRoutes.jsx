import React, { lazy } from "react";
import PrivateRoute from "../Components/PrivateRoute";
import Private from "../Layout/Private";

const Submissions = lazy(() => import("../Screens/Private/Submissions"));
const CreateSubmission = lazy(() =>
  import("../Screens/Private/CreateSubmission")
);

const NGORoutes = [
  {
    path: "/ngo/submissions",
    element: (
      <PrivateRoute>
        <Private>
          <Submissions />
        </Private>
      </PrivateRoute>
    ),
  },
  {
    path: "/agent/create",
    element: (
      <PrivateRoute>
        <CreateSubmission />
      </PrivateRoute>
    ),
  },
];

export default NGORoutes;
