import { lazy } from "react";
import Public from "../Layout/Public";

const Login = lazy(() => import("../Screens/Auth/Login"));
const Register = lazy(() => import("../Screens/Auth/Register"));

const AuthRoutes = [
  {
    path: "/auth/login",
    element: (
      <Public>
        <Login />
      </Public>
    ),
  },
  {
    path: "/auth/register",
    element: (
      <Public>
        <Register />
      </Public>
    ),
  },
];

export default AuthRoutes;
