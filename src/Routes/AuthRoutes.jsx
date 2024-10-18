import { lazy } from "react";
import Public from "../Layout/Public";

const Login = lazy(() => import("../Screens/Auth/Login"));

const AuthRoutes = [
  {
    path: "/auth/login",
    element: (
      <Public>
        <Login />
      </Public>
    ),
  },
];

export default AuthRoutes;
