import { useState } from "react";
import { auth } from "../firebase";
import { TextField, Button, Typography, Box } from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      alert("Error signing in: " + error.message);
    }
  };

  if (currentUser) {
    return <Navigate to="/" />;
  }

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
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          style={{
            color: "white",
          }}
        >
          Sign In
        </Typography>
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
          color="secondary"
          onClick={handleSignIn}
          fullWidth
          sx={{ mt: 2 }}
        >
          Sign In
        </Button>
      </Box>
    </Box>
  );
}

export default SignIn;
