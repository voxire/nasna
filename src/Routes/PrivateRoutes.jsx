import React, { lazy } from "react";
import PrivateRoute from "../Components/PrivateRoute";
import NGOContainer from "../Layout/NGO/NGOContainer";

const Submissions = lazy(() => import("../Screens/Private/Submissions"));
const CreateSubmission = lazy(() =>
  import("../Screens/Private/CreateSubmission")
);

const NGORoutes = [
  {
    path: "/ngo/submissions",
    element: (
      <PrivateRoute>
        <NGOContainer>
          <Submissions />
        </NGOContainer>
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
