import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CssBaseline, CircularProgress, Box } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import PrivateRoute from "./Components/PrivateRoute";
// import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { I18nextProvider } from "react-i18next";
import i18next from "./services/i18next";
import Public from "./Layout/Public";

// Lazy load components
const Submissions = lazy(() => import("./Screens/Submissions"));
const Home = lazy(() => import("./Screens/Home"));
const SignIn = lazy(() => import("./Components/SignIn"));
const Confirmation = lazy(() => import("./Screens/Confirmation"));
const About = lazy(() => import("./Screens/About"));

const theme = createTheme({
  palette: {
    primary: {
      main: "#12a89d",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#AEDFF7",
    },
  },
  components: {
    // MuiOutlinedInput: {
    //   styleOverrides: {
    //     root: {
    //       "& fieldset": {
    //         borderColor: "white",
    //       },
    //       "&:hover fieldset": {
    //         borderColor: "#F9E400 !important",
    //       },
    //       "&.Mui-focused fieldset": {
    //         borderColor: "FAFAFA !important",
    //       },
    //     },
    //     input: {
    //       color: "white",
    //     },
    //   },
    // },
    // MuiInputLabel: {
    //   styleOverrides: {
    //     root: {
    //       color: "white",
    //       "&.Mui-focused": {
    //         color: "white",
    //       },
    //     },
    //   },
    // },
    // MuiInputAdornment: {
    //   styleOverrides: {
    //     root: {
    //       color: "#F9E400",
    //     },
    //   },
    // },
    // MuiSvgIcon: {
    //   styleOverrides: {
    //     root: {
    //       color: "#F9E400 !important",
    //     },
    //   },
    // },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #424242",
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18next}>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          limit={1}
          style={{ maxWidth: "400px", left: "6%", top: "10px", margin: "0" }}
        />
        <CssBaseline />
        {/* <AuthProvider> */}
        <Router>
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
            <Routes>
              <Route
                path="/"
                element={
                  <Public>
                    <Home />
                  </Public>
                }
              />
              <Route
                path="/confirmation"
                element={
                  <Public>
                    <Confirmation />
                  </Public>
                }
              />
              <Route
                path="/submissions"
                element={
                  <PrivateRoute>
                    <Submissions />
                  </PrivateRoute>
                }
              />
              <Route
                path="/about"
                element={
                  <Public>
                    <About />
                  </Public>
                }
              />

              {/* Ignore the two below */}
              <Route path="/sign-in" element={<SignIn />} />

              <Route
                path="*"
                element={
                  <Public>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "87.8vh",
                      }}
                    >
                      <h1>Page Not Found</h1>
                    </div>
                  </Public>
                }
              />
            </Routes>
          </Suspense>
        </Router>
        {/* </AuthProvider> */}
      </I18nextProvider>
    </ThemeProvider>
  );
}

export default App;
