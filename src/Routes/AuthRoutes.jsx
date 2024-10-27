import { lazy } from "react";
import Public from "../Layout/Public";

const Login = lazy(() => import("../Screens/Auth/Login"));
const Register = lazy(() => import("../Screens/Auth/Register"));
const AgentRegister = lazy(() => import("../Screens/Auth/AgentRegister"));

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
  {
    path: "/auth/agent",
    element: (
      <Public>
        <AgentRegister />
      </Public>
    ),
  },
];

export default AuthRoutes;
