import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import { CssBaseline } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import App from "./App";
import i18next from "./services/i18next";
import "./styles/index.scss";
import { BrowserRouter as Router } from "react-router-dom";

// Create theme and RTL cache
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
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #424242",
        },
      },
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18next}>
        <ToastContainer
          position="top-left"
          autoClose={100000}
          limit={1}
          style={{
            maxWidth: "400px",
            right: "20px",
            top: "10px",
            margin: "0",
          }}
        />
        <CssBaseline />
        <Router>
          <App />
        </Router>
      </I18nextProvider>
    </ThemeProvider>
  </StrictMode>
);
