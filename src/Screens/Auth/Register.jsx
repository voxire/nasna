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
import { useSnackBar } from "../../Components/NasnaSnackBar";

function Register() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackBar();

  const [formData, setFormData] = useState({
    name: "",
    contactPersonName: "",
    email: "",
    phoneNumber: "",
    areaOfOperation: "",
    kindOfHelp: "",
    initiativeOrNgo: "",
    role: "member",
    numberOfVolunteers: "",
    isOfficiallyRegistered: false,
    consentGiven: false,
    socialMediaLinks: [""],
  });

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (!formData.consentGiven) {
      showSnackbar("You must give consent to register.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showSnackbar("Passwords do not match.", "error");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(
        formData.email,
        password
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

      await auth.signOut();

      setFormData({
        name: "",
        contactPersonName: "",
        email: "",
        phoneNumber: "",
        areaOfOperation: "",
        kindOfHelp: "",
        initiativeOrNgo: "",
        role: "member",
        numberOfVolunteers: "",
        isOfficiallyRegistered: false,
        consentGiven: false,
        socialMediaLinks: [""],
      });
      setPassword("");
      setConfirmPassword("");

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
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
        {/* Other form fields remain unchanged */}

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
    </Box>
  );
}

export default Register;
