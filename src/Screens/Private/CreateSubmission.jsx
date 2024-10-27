import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import {
  Box,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  MenuItem,
} from "@mui/material";
import { Timestamp } from "firebase/firestore";
import { useSnackBar } from "../../Components/NasnaSnackBar";
import { useNavigate } from "react-router-dom";

function CreateSubmission() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackBar();
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    nationalID: "",
    emailAddress: "",
    gender: "",
    currentGovernorate: "",
    previousGovernorate: "",
    street: "",
    building: "",
    floor: "",
    city: "",
    ageRanges: {
      "0-3": 0,
      "4-12": 0,
      "13-18": 0,
      "19-60": 0,
      "60+": 0,
    },
    specialNeeds: [],
    needs: [],
    aidUrgency: "",
    consentGiven: false,
    comments: "",
    numberOfPeopleInHousehold: 0,
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

  useEffect(() => {
    const checkRole = () => {
      const role = localStorage.getItem("userRole");
      if (role !== "agent") {
        if (role === "member") {
          navigate("/ngo/submissions");
          return;
        }
        navigate("/");
      }
    };

    checkRole();
  }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      await db.collection("submissions").add({
        ...formData,
        registrationDate: Timestamp.fromDate(new Date()),
        createdAt: new Date(),
        updatedAt: new Date(),
        agent: auth.currentUser?.uid,
      });

      // Reset the form after successful submission
      setFormData({
        fullName: "",
        phoneNumber: "",
        nationalID: "",
        emailAddress: "",
        gender: "",
        currentGovernorate: "",
        previousGovernorate: "",
        street: "",
        building: "",
        floor: "",
        city: "",
        ageRanges: {
          "0-3": 0,
          "4-12": 0,
          "13-18": 0,
          "19-60": 0,
          "60+": 0,
        },
        specialNeeds: [],
        needs: [],
        aidUrgency: "",
        consentGiven: true,
        comments: "",
        numberOfPeopleInHousehold: 0,
      });

      showSnackbar("Submission successful!", "success");
    } catch (error) {
      showSnackbar("Error creating submission. Please try again.", "error");
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
        Create Submission
      </Typography>
      <form onSubmit={handleAddMember}>
        <TextField
          label="Full Name"
          name="fullName"
          value={formData.fullName}
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
          label="National ID"
          name="nationalID"
          value={formData.nationalID}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Email Address"
          name="emailAddress"
          type="email"
          value={formData.emailAddress}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          select
          label="Gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        >
          <MenuItem value="Male">Male</MenuItem>
          <MenuItem value="Female">Female</MenuItem>
        </TextField>
        <TextField
          label="Current Governorate"
          name="currentGovernorate"
          value={formData.currentGovernorate}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Previous Governorate"
          name="previousGovernorate"
          value={formData.previousGovernorate}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Street"
          name="street"
          value={formData.street}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Building"
          name="building"
          value={formData.building}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Floor"
          name="floor"
          value={formData.floor}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="City"
          name="city"
          value={formData.city}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Number of People in Household"
          name="numberOfPeopleInHousehold"
          type="number"
          value={formData.numberOfPeopleInHousehold}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        {Object.keys(formData.ageRanges).map((range) => (
          <TextField
            key={range}
            label={`${range} (Number of Members)`}
            name={`ageRanges.${range}`}
            value={formData.ageRanges[range]}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                ageRanges: { ...prev.ageRanges, [range]: e.target.value },
              }))
            }
            fullWidth
            type="number"
            sx={{ mb: 2 }}
          />
        ))}
        <TextField
          select
          label="Aid Urgency"
          name="aidUrgency"
          value={formData.aidUrgency}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        >
          <MenuItem value="High">High</MenuItem>
          <MenuItem value="Medium">Medium</MenuItem>
          <MenuItem value="Low">Low</MenuItem>
        </TextField>
        <TextField
          label="Comments"
          name="comments"
          value={formData.comments}
          onChange={handleChange}
          fullWidth
          multiline
          rows={4}
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
          label="I give my consent for this submission."
          sx={{ mb: 2 }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Box>
  );
}

export default CreateSubmission;
