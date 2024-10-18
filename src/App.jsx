import React, { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import PrivateRoute from "./Components/PrivateRoute";
import Public from "./Layout/Public";
import ScrollToTop from "./Components/ScrollToTop";
import PublicRoutes from "./Routes/PublicRoutes";
import AuthRoutes from "./Routes/AuthRoutes";
import AdminRoutes from "./Routes/AdminRoutes";
import NotFound from "./Components/NotFound/NotFound";
import NGORoutes from "./Routes/NGORoutes";

function App() {
  const location = useLocation();

  return (
    <React.Fragment>
      <ScrollToTop />
      <Suspense
        fallback={
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "80vh",
            }}
          >
            <CircularProgress color="primary" />
          </Box>
        }
      >
        <Routes key={location.pathname} location={location}>
          {PublicRoutes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}

          {AuthRoutes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}

          {AdminRoutes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}

          {NGORoutes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </React.Fragment>
  );
}

export default App;
