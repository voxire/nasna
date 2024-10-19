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
import NasnaSnackBar from "../../components/NasnaSnackBar";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    contactPersonName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    areaOfOperation: "",
    kindOfHelp: "",
    initiativeOrNgo: "",
    numberOfVolunteers: "",
    isOfficiallyRegistered: false,
    consentGiven: false,
    socialMediaLinks: [""],
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
        .collection("members")
        .doc(userCredential.user.uid)
        .set({
          uid: userCredential.user.uid,
          ...formData,
          isAdmin: false,
          validated: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      setSnackbar({
        open: true,
        message: "Registration successful!",
        severity: "success",
      });

      // Reset the form after successful registration
      setFormData({
        name: "",
        contactPersonName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
        areaOfOperation: "",
        kindOfHelp: "",
        initiativeOrNgo: "",
        numberOfVolunteers: "",
        isOfficiallyRegistered: false,
        consentGiven: false,
        socialMediaLinks: [""],
      });

      navigate("/ngo/submissions");
    } catch (error) {
      console.error("Error registering NGO: ", error);
      setSnackbar({
        open: true,
        message: "Error registering NGO. Please try again.",
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
        Register as an NGO/Initiative
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Organization Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Contact Person Name"
          name="contactPersonName"
          value={formData.contactPersonName}
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
        <TextField
          label="Type of Help Offered"
          name="kindOfHelp"
          value={formData.kindOfHelp}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Initiative or NGO"
          name="initiativeOrNgo"
          value={formData.initiativeOrNgo}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Number of Volunteers"
          name="numberOfVolunteers"
          type="number"
          value={formData.numberOfVolunteers}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              name="isOfficiallyRegistered"
              checked={formData.isOfficiallyRegistered}
              onChange={handleCheckboxChange}
            />
          }
          label="Is Officially Registered"
          sx={{ mb: 2 }}
        />
        <Typography variant="h6" gutterBottom>
          Social Media Links
        </Typography>
        {formData.socialMediaLinks.map((link, index) => (
          <Box
            key={index}
            sx={{ display: "flex", alignItems: "center", mb: 1 }}
          >
            <TextField
              label={`Link ${index + 1}`}
              value={link}
              onChange={(e) => handleSocialMediaChange(index, e.target.value)}
              fullWidth
              sx={{ mr: 1 }}
            />
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => removeSocialMediaLink(index)}
            >
              Remove
            </Button>
          </Box>
        ))}
        <Button onClick={addSocialMediaLink} variant="contained" sx={{ mb: 2 }}>
          Add Another Link
        </Button>
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

export default Register;
