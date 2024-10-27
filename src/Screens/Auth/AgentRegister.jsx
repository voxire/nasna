import React, { useState } from "react";
import { db, auth } from "../../firebase";
import { Box, TextField, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useSnackBar } from "../../Components/NasnaSnackBar";
import { useTranslation } from "react-i18next";

function AgentRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackBar();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    areaOfOperation: "",
    role: "agent",
  });

  const [loading, setLoading] = useState(false);

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

  const handleSocialMediaChange = (index, value) => {
    const updatedLinks = [...formData.socialMediaLinks];
    updatedLinks[index] = value;
    setFormData((prev) => ({
      ...prev,
      socialMediaLinks: updatedLinks,
    }));
  };

  const addSocialMediaLink = () => {
    setFormData((prev) => ({
      ...prev,
      socialMediaLinks: [...prev.socialMediaLinks, ""],
    }));
  };

  const removeSocialMediaLink = (index) => {
    const updatedLinks = formData.socialMediaLinks.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      socialMediaLinks: updatedLinks,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showSnackbar("Passwords do not match.", "error");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(
        formData.email,
        formData.password
      );

      await db
        .collection("members")
        .doc(userCredential.user.uid)
        .set({
          uid: userCredential.user.uid,
          ...formData,
          isAdmin: false,
          validated: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          consentGiven: true,
        });

      await auth.signOut();

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
        areaOfOperation: "",
        role: "agent",
      });

      showSnackbar("Registration successful! Please log in.", "success");
      navigate("/auth/login");
    } catch (error) {
      console.error("Error registering NGO: ", error);
      showSnackbar("Error registering NGO. Please try again.", "error");
    } finally {
      setLoading(false);
    }
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
        Become An Agent
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
          label="Area of Operation"
          name="areaOfOperation"
          value={formData.areaOfOperation}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <Typography variant="body2" color="textSecondary">
          {t("home.consent")}
        </Typography>
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
    </Box>
  );
}

export default AgentRegister;
