import React, { useState } from "react";
import { db, auth } from "../../firebase";
import {
  Box,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import NasnaSnackBar from "../../Components/NasnaSnackBar";

function AgentRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    agency: "",
    role: "agent",
    consentGiven: false,
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.consentGiven) {
      setSnackbar({
        open: true,
        message: "You must give consent to register.",
        severity: "error",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setSnackbar({
        open: true,
        message: "Passwords do not match.",
        severity: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(
        formData.email,
        formData.password
      );

      await db
        .collection("agents")
        .doc(userCredential.user.uid)
        .set({
          uid: userCredential.user.uid,
          ...formData,
          role: "agent",
          validated: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      setSnackbar({
        open: true,
        message: "Agent registration successful!",
        severity: "success",
      });

      // Reset the form after successful registration
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
        agency: "",
        role: "agent",
        consentGiven: false,
      });

      navigate("/agent/dashboard");
    } catch (error) {
      console.error("Error registering agent: ", error);
      setSnackbar({
        open: true,
        message: "Error registering agent. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box
      sx={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        backgroundColor: "#f5f5f5",
        borderRadius: "8px",
        marginTop: "20px",
        marginBottom: "20px",
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Register as an Agent
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Phone Number"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Agency/Organization"
          name="agency"
          value={formData.agency}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              name="consentGiven"
              checked={formData.consentGiven}
              onChange={handleCheckboxChange}
              required
            />
          }
          label="I give my consent for this registration."
          sx={{ mb: 2 }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </Button>
      </form>
      <NasnaSnackBar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </Box>
  );
}

export default AgentRegister;
