import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  FormControl,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { db } from "../../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useSnackBar } from "../../components/NasnaSnackBar"; // Use the snackbar hook

function Donate() {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackBar(); // Destructure the snackbar method

  const handleReasonChange = (event) => {
    setReason(event.target.value);
    if (event.target.value !== "Other") {
      setCustomReason("");
    }
  };

  const handleCustomReasonChange = (event) =>
    setCustomReason(event.target.value);
  const handlePhoneChange = (event) => setPhoneNumber(event.target.value);

  const handleSubmit = async () => {
    if (!reason || !phoneNumber) return;

    const donationReason = reason === "Other" ? customReason : reason;
    setLoading(true);

    try {
      await addDoc(collection(db, "donations"), {
        reason: donationReason,
        phone: phoneNumber,
        timestamp: new Date(),
      });

      // Reset the form state
      setReason("");
      setCustomReason("");
      setPhoneNumber("");

      // Show success snackbar
      showSnackbar("Thank you for your donation!", "success");
    } catch (error) {
      console.error("Error adding donation: ", error);

      // Show error snackbar
      showSnackbar(
        "There was an error processing your donation. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        textAlign: "center",
        maxWidth: "1200px",
        margin: "0 auto",
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Donate
      </Typography>
      <Typography variant="body1" paragraph>
        Your donations support our project and will help families in need. Some
        funds will be directly allocated to assist those in critical situations.
      </Typography>
      <Typography variant="body1" paragraph>
        To donate, send the amount via whish money to this number:{" "}
        <strong>+123 456 7890</strong>
      </Typography>

      <TextField
        label="Phone Number"
        value={phoneNumber}
        onChange={handlePhoneChange}
        fullWidth
        margin="normal"
        placeholder="+123 456 7890"
        required
      />

      <FormControl fullWidth sx={{ mt: 2 }}>
        <Select
          value={reason}
          onChange={handleReasonChange}
          displayEmpty
          inputProps={{ "aria-label": "Without reason" }}
        >
          <MenuItem value="" disabled>
            Select the reason for your donation
          </MenuItem>
          <MenuItem value="Support Project">Support Project</MenuItem>
          <MenuItem value="Help Families">Help Families</MenuItem>
          <MenuItem value="Emergency Assistance">Emergency Assistance</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </Select>
      </FormControl>

      {reason === "Other" && (
        <TextField
          label="Please specify"
          value={customReason}
          onChange={handleCustomReasonChange}
          fullWidth
          margin="normal"
          placeholder="Enter your reason"
          required
        />
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ mt: 3 }}
        disabled={
          !reason ||
          !phoneNumber ||
          (reason === "Other" && !customReason) ||
          loading
        }
      >
        {loading ? "Submitting..." : "Submit Donation"}
      </Button>
    </Box>
  );
}

export default Donate;
