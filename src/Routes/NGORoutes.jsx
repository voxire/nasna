import React, { lazy } from "react";
import PrivateRoute from "../Components/PrivateRoute";
import NGOContainer from "../Layout/NGO/NGOContainer";

const Submissions = lazy(() => import("../Screens/NGO/Submissions"));

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
];

export default NGORoutes;
