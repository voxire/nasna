import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { TextField, Button, Box } from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import NasnaSnackBar from "../../Components/NasnaSnackBar";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const navigate = useNavigate();

  const handleSignIn = async () => {
    if (!email || !password) {
      showSnackbar("Email and password are required.", "error");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/ngo/dashboard");
    } catch (error) {
      handleFirebaseError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseError = (error) => {
    switch (error.code) {
      case "auth/user-not-found":
        showSnackbar("No user found with this email.", "error");
        break;
      case "auth/wrong-password":
        showSnackbar("Incorrect password. Please try again.", "error");
        break;
      case "auth/invalid-email":
        showSnackbar("Invalid email format.", "error");
        break;
      case "auth/invalid-credential":
        showSnackbar("Invalid credentials. Please try again.", "error");
        break;
      default:
        showSnackbar("An error occurred. Please try again.", "error");
        break;
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        padding: "0 20px",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
          padding: "20px",
          borderRadius: "8px",
        }}
      >
        <img
          src="/Nasna Logo.png"
          alt="Logo"
          style={{ width: "230px", marginBottom: 20 }}
        />
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSignIn}
          fullWidth
          sx={{ mt: 2 }}
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </Box>

      <NasnaSnackBar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={handleSnackbarClose}
      />
    </Box>
  );
}

export default Login;
