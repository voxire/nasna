import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TextField, Button, Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useSnackBar } from "../../Components/NasnaSnackBar";
import { loginUser } from "../../redux/reducers/userSlice";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useSelector((state) => state.user);
  const { showSnackbar } = useSnackBar();

  useEffect(() => {
    if (user) {
      navigate(-1);
    }
  }, [user, navigate, location.state]);

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

  const handleSignIn = async () => {
    if (!email || !password) {
      showSnackbar("Email and password are required.", "error");
      return;
    }

    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      showSnackbar("Login successful!", "success");
      navigate("/ngo/submissions");
    } else {
      handleFirebaseError(result.payload);
    }
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
    </Box>
  );
}

export default Login;
