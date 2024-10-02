import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CssBaseline, CircularProgress, Box } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import PrivateRoute from "./Components/PrivateRoute";
// import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "./Components/Header";

import { I18nextProvider } from "react-i18next";
import i18next from "./services/i18next";

// Lazy load components
const Members = lazy(() => import("./Components/Members"));
const AddMember = lazy(() => import("./Components/AddMember"));
const SignIn = lazy(() => import("./Components/SignIn"));

const theme = createTheme({
  palette: {
    primary: {
      main: "#4A90E2",
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
        <ToastContainer />
        <CssBaseline />
        {/* <AuthProvider> */}
        <Router>
          <Header />
          <div
            style={{
              backgroundColor: "#FAFAFA",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                maxWidth: "1200px",
                width: "100%",
              }}
            >
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
                    <CircularProgress color="secondary" />
                  </Box>
                }
              >
                <Routes>
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <AddMember />
                      </PrivateRoute>
                    }
                  />

                  {/* Ignore the two below */}
                  <Route path="/sign-in" element={<SignIn />} />
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <Members />
                      </PrivateRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </div>
          </div>
        </Router>
        {/* </AuthProvider> */}
      </I18nextProvider>
    </ThemeProvider>
  );
}

export default App;
