import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import {
  Box,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  MenuItem,
} from "@mui/material";
import { Timestamp, collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useSnackBar } from "../../Components/NasnaSnackBar";

function CreateSubmission() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackBar();
  const { user } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
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

  const userUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!userUid) {
      navigate("/auth/login");
    }
  }, [userUid, navigate]);

  if (!user?.validated) {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          textAlign: "center",
        }}
      >
        <Typography variant="h5">
          {t("submission.accountBeingVerified")}
        </Typography>
      </Box>
    );
  }

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

  const handleAddMember = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "submissions"), {
        ...formData,
        registrationDate: Timestamp.fromDate(new Date()),
        createdAt: new Date(),
        updatedAt: new Date(),
        agent: auth.currentUser?.uid,
      });

      showSnackbar(t("submission.success"), "success");

      setFormData({
        fullName: "",
        phoneNumber: "",
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
    } catch (error) {
      console.error("Error creating submission:", error);
      showSnackbar(t("submission.error"), "error");
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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          {t("submission.title")}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/agent/submissions")}
        >
          My Submissions
        </Button>
      </Box>

      <form onSubmit={handleAddMember}>
        <TextField
          label={t("submission.fullName")}
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label={t("submission.phoneNumber")}
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label={t("submission.emailAddress")}
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
          label={t("submission.gender")}
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        >
          <MenuItem value="Male">{t("submission.male")}</MenuItem>
          <MenuItem value="Female">{t("submission.female")}</MenuItem>
        </TextField>
        <TextField
          label={t("submission.currentGovernorate")}
          name="currentGovernorate"
          value={formData.currentGovernorate}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label={t("submission.previousGovernorate")}
          name="previousGovernorate"
          value={formData.previousGovernorate}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label={t("submission.street")}
          name="street"
          value={formData.street}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label={t("submission.building")}
          name="building"
          value={formData.building}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label={t("submission.floor")}
          name="floor"
          value={formData.floor}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label={t("submission.city")}
          name="city"
          value={formData.city}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label={t("submission.numberOfPeopleInHousehold")}
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
            label={`${range} (${t("submission.numberOfMembers")})`}
            name={`ageRanges.${range}`}
            type="number"
            value={formData.ageRanges[range]}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                ageRanges: { ...prev.ageRanges, [range]: e.target.value },
              }))
            }
            fullWidth
            sx={{ mb: 2 }}
          />
        ))}
        <TextField
          select
          label={t("submission.aidUrgency")}
          name="aidUrgency"
          value={formData.aidUrgency}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        >
          <MenuItem value="High">{t("submission.high")}</MenuItem>
          <MenuItem value="Medium">{t("submission.medium")}</MenuItem>
          <MenuItem value="Low">{t("submission.low")}</MenuItem>
        </TextField>
        <TextField
          label={t("submission.comments")}
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
          label={t("submission.consent")}
          sx={{ mb: 2 }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
        >
          {loading ? t("submission.submitting") : t("submission.submit")}
        </Button>
      </form>
    </Box>
  );
}

export default CreateSubmission;
