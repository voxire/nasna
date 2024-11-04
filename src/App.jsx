import React, { useEffect, useState, Suspense } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import ScrollToTop from "./Components/ScrollToTop";
import PublicRoutes from "./Routes/PublicRoutes";
import AuthRoutes from "./Routes/AuthRoutes";
import AdminRoutes from "./Routes/AdminRoutes";
import NotFound from "./Components/NotFound/NotFound";
import PrivateRoutes from "./Routes/PrivateRoutes";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (location.pathname === "/index.html") {
      setIsRedirecting(true);
      navigate("/", { replace: true });
    } else {
      setIsRedirecting(false);
    }
  }, [location.pathname, navigate]);

  if (isRedirecting) {
    return null;
  }

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

          {PrivateRoutes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </React.Fragment>
  );
}
