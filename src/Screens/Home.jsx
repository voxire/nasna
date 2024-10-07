import { useState } from "react";
import { db } from "../firebase";
import {
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Timestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Home() {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationalID, setNationalID] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [gender, setGender] = useState("");
  const [currentGovernorate, setCurrentGovernorate] = useState("");
  const [previousGovernorate, setPreviousGovernorate] = useState("");
  const [street, setStreet] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [ageRanges, setAgeRanges] = useState({
    "0-3": 0,
    "4-12": 0,
    "13-18": 0,
    "19-60": 0,
    "60+": 0,
  });
  const [specialNeeds, setSpecialNeeds] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [aidUrgency, setAidUrgency] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [comments, setComments] = useState("");
  const [page, setPage] = useState(1);

  const navigate = useNavigate();

  const handleAddMember = async () => {
    if (
      fullName &&
      phoneNumber &&
      nationalID &&
      currentGovernorate &&
      previousGovernorate &&
      street &&
      building &&
      floor &&
      ageRanges["0-3"] &&
      ageRanges["4-12"] &&
      ageRanges["13-18"] &&
      ageRanges["19-60"] &&
      ageRanges["60+"] &&
      specialNeeds.length &&
      needs.length &&
      aidUrgency
    ) {
      if (consentGiven) {
        await db.collection("members").add({
          fullName,
          phoneNumber,
          nationalID,
          emailAddress,
          gender,
          currentGovernorate,
          previousGovernorate,
          street,
          building,
          floor,
          ageRanges,
          specialNeeds,
          needs,
          aidUrgency,
          consentGiven,
          comments,
          registrationDate: Timestamp.fromDate(new Date()),
        });

        toast(t("toast.memberAddedSuccess"), { type: "success" });
        navigate("/confirmation");
      } else {
        toast(t("toast.consentRequired"), { type: "error" });
      }
    } else {
      toast(t("toast.fillRequiredFields"), { type: "error" });
    }
  };

  const pageOne = () => (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t("Address Details")}
      </Typography>

      {/* Section 1: Personal Information */}
      <Box
        sx={{
          backgroundColor: "#f5f5f5",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "16px",
        }}
      >
        <Typography variant="h6">{t("Personal Information")}</Typography>

        <TextField
          label={t("Full Name")}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label={t("Phone Number")}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          fullWidth
          margin="normal"
          type="tel"
        />

        <TextField
          label={t("National ID")}
          value={nationalID}
          onChange={(e) => setNationalID(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label={t("Email Address")}
          value={emailAddress}
          onChange={(e) => setEmailAddress(e.target.value)}
          fullWidth
          margin="normal"
          type="email"
        />

        <TextField
          select
          label={t("Gender")}
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="Male">{t("Male")}</MenuItem>
          <MenuItem value="Female">{t("Female")}</MenuItem>
          <MenuItem value="Other">{t("Other")}</MenuItem>
        </TextField>
      </Box>

      {/* Section 2: Location Details */}
      <Box
        sx={{
          backgroundColor: "#f5f5f5",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "16px",
        }}
      >
        <Typography variant="h6">{t("Location Details")}</Typography>

        <TextField
          select
          label={t("Current Governorate")}
          value={currentGovernorate}
          onChange={(e) => setCurrentGovernorate(e.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="Governorate 1">{t("Governorate 1")}</MenuItem>
          <MenuItem value="Governorate 2">{t("Governorate 2")}</MenuItem>
        </TextField>

        <TextField
          select
          label={t("Previous Governorate")}
          value={previousGovernorate}
          onChange={(e) => setPreviousGovernorate(e.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="Governorate 1">{t("Governorate 1")}</MenuItem>
          <MenuItem value="Governorate 2">{t("Governorate 2")}</MenuItem>
        </TextField>

        <TextField
          label={t("Street")}
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label={t("Building")}
          value={building}
          onChange={(e) => setBuilding(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label={t("Floor")}
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
          fullWidth
          margin="normal"
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          marginTop: "16px",
          gap: 2,
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <Button
          onClick={() => {
            if (
              fullName &&
              phoneNumber &&
              nationalID &&
              currentGovernorate &&
              previousGovernorate &&
              street &&
              building &&
              floor
            ) {
              setPage(2);
            } else {
              toast(t("toast.fillRequiredFields"), { type: "error" });
            }
          }}
          variant="contained"
        >
          {t("Continue")}
        </Button>
      </Box>
    </Box>
  );

  const pageTwo = () => (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t("Household and Needs Details")}
      </Typography>

      {/* Section 3: Household Details */}
      <Box
        sx={{
          backgroundColor: "#f5f5f5",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "16px",
        }}
      >
        <Typography variant="h6">{t("Household Information")}</Typography>

        {Object.keys(ageRanges).map((range) => (
          <TextField
            key={range}
            label={`${range} ${t("Years")}`}
            value={ageRanges[range]}
            onChange={(e) =>
              setAgeRanges({ ...ageRanges, [range]: Number(e.target.value) })
            }
            fullWidth
            margin="normal"
            type="number"
          />
        ))}
      </Box>

      {/* Section 4: Needs and Aid */}
      <Box
        sx={{
          backgroundColor: "#f5f5f5",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "16px",
        }}
      >
        <Typography variant="h6">{t("Special Needs")}</Typography>
        {[
          "Pregnancy",
          "Chronic Illness",
          "Disability",
          "Infants/Toddlers",
          "Elderly",
        ].map((need) => (
          <FormControlLabel
            key={need}
            control={
              <Checkbox
                checked={specialNeeds.includes(need)}
                onChange={(e) =>
                  setSpecialNeeds(
                    e.target.checked
                      ? [...specialNeeds, need]
                      : specialNeeds.filter((n) => n !== need)
                  )
                }
              />
            }
            label={t(need)}
          />
        ))}

        <Typography variant="h6">{t("Immediate Needs")}</Typography>
        {[
          "Food",
          "Water",
          "Shelter Materials",
          "Hygiene Products",
          "Medical Supplies",
          "Clothing",
        ].map((need) => (
          <FormControlLabel
            key={need}
            control={
              <Checkbox
                checked={needs.includes(need)}
                onChange={(e) =>
                  setNeeds(
                    e.target.checked
                      ? [...needs, need]
                      : needs.filter((n) => n !== need)
                  )
                }
              />
            }
            label={t(need)}
          />
        ))}

        <TextField
          select
          label={t("Urgency of Aid")}
          value={aidUrgency}
          onChange={(e) => setAidUrgency(e.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="High">{t("High")}</MenuItem>
          <MenuItem value="Medium">{t("Medium")}</MenuItem>
          <MenuItem value="Low">{t("Low")}</MenuItem>
        </TextField>

        <TextField
          label={t("Comments")}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          rows={4}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
            />
          }
          label={t("I give consent for my data to be processed")}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          marginTop: "16px",
          gap: 2,
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <Button onClick={() => setPage(1)} variant="outlined">
          {t("Back")}
        </Button>
        <Button onClick={handleAddMember} variant="contained">
          {t("Submit")}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        padding: "24px",
        paddingTop: "30px",
        paddingBottom: "150px",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {page === 1 ? pageOne() : pageTwo()}
    </Box>
  );
}

export default Home;
