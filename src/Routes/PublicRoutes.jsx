import React, { lazy } from "react";
import Public from "../Layout/Public";

// Routes
const Home = lazy(() => import("../Screens/Public/Home"));
const About = lazy(() => import("../Screens/Public/About"));
const Confirmation = lazy(() => import("../Screens/Public/Confirmation"));

const PublicRoutes = [
  {
    path: "/",
    element: (
      <Public>
        <Home />
      </Public>
    ),
  },
  {
    path: "/about",
    element: (
      <Public>
        <About />
      </Public>
    ),
  },
  {
    path: "/confirmation",
    element: (
      <Public>
        <Confirmation />
      </Public>
    ),
  },
];

export default PublicRoutes;
