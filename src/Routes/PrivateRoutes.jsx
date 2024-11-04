import React, { lazy } from "react";
import PrivateRoute from "../Components/PrivateRoute";
import Private from "../Layout/Private";

const Submissions = lazy(() => import("../Screens/Private/Submissions"));
const CreateSubmission = lazy(() =>
  import("../Screens/Private/CreateSubmission")
);
const AgentSubmissions = lazy(() =>
  import("../Screens/Private/AgentSubmissions")
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
        <Private>
          <CreateSubmission />
        </Private>
      </PrivateRoute>
    ),
  },
  {
    path: "/agent/submissions",
    element: (
      <PrivateRoute>
        <Private>
          <AgentSubmissions />
        </Private>
      </PrivateRoute>
    ),
  },
];

export default NGORoutes;
