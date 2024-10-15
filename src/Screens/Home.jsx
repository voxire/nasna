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
  const { t, i18n } = useTranslation();
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
  const [city, setCity] = useState("");
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

  const [numberOfPeopleInHousehold, setNumberOfPeopleInHousehold] = useState(0);

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
      ageRanges["0-3"] !== undefined &&
      ageRanges["4-12"] !== undefined &&
      ageRanges["13-18"] !== undefined &&
      ageRanges["19-60"] !== undefined &&
      ageRanges["60+"] !== undefined &&
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
          city,
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

        toast(t("home.toast.memberAddedSuccess"), { type: "success" });
        navigate("/confirmation");
      } else {
        toast(t("home.toast.consentRequired"), { type: "error" });
      }
    } else {
      toast(t("home.toast.fillRequiredFields"), { type: "error" });
    }
  };

  const pageOne = () => (
    <Box>
      {/* Disclaimer */}
      <Box
        sx={{
          backgroundColor: "#fff3cd",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "16px",
          border: "1px solid #ffeeba",
        }}
      >
        <Typography variant="body1" color="textSecondary">
          {t("home.disclaimer")}
        </Typography>
      </Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t("home.addressDetails")}
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
        <Typography variant="h6">{t("home.personalInformation")}</Typography>

        <TextField
          label={t("home.fullName")}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label={t("home.phoneNumber")}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          fullWidth
          margin="normal"
          type="tel"
          placeholder="eg. 78874095"
        />

        <TextField
          label={t("home.nationalID")}
          value={nationalID}
          onChange={(e) => setNationalID(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label={t("home.emailAddress")}
          value={emailAddress}
          onChange={(e) => setEmailAddress(e.target.value)}
          fullWidth
          margin="normal"
          type="email"
        />

        <TextField
          select
          label={t("home.gender")}
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="Male">{t("home.male")}</MenuItem>
          <MenuItem value="Female">{t("home.female")}</MenuItem>
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
        <Typography variant="h6">{t("home.locationDetails")}</Typography>

        <TextField
          select
          label={t("home.previousGovernorate")}
          value={previousGovernorate}
          onChange={(e) => setPreviousGovernorate(e.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="Beirut">{t("home.governorate1")}</MenuItem>
          <MenuItem value="Mount Lebanon">{t("home.governorate2")}</MenuItem>
          <MenuItem value="Baabdat">{t("home.governorate3")}</MenuItem>
          <MenuItem value="North Lebanon">{t("home.governorate4")}</MenuItem>
          <MenuItem value="Akkar">{t("home.governorate5")}</MenuItem>
          <MenuItem value="Baalbek">{t("home.governorate6")}</MenuItem>
          <MenuItem value="Beqaa">{t("home.governorate7")}</MenuItem>
          <MenuItem value="Tyre">{t("home.governorate8")}</MenuItem>
          <MenuItem value="Saida">{t("home.governorate9")}</MenuItem>
          <MenuItem value="Nabatiyeh">{t("home.governorate10")}</MenuItem>
        </TextField>

        <TextField
          select
          label={t("home.currentGovernorate")}
          value={currentGovernorate}
          onChange={(e) => setCurrentGovernorate(e.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="Beirut">{t("home.governorate1")}</MenuItem>
          <MenuItem value="Mount Lebanon">{t("home.governorate2")}</MenuItem>
          <MenuItem value="Baabdat">{t("home.governorate3")}</MenuItem>
          <MenuItem value="North Lebanon">{t("home.governorate4")}</MenuItem>
          <MenuItem value="Akkar">{t("home.governorate5")}</MenuItem>
          <MenuItem value="Baalbek">{t("home.governorate6")}</MenuItem>
          <MenuItem value="Beqaa">{t("home.governorate7")}</MenuItem>
          <MenuItem value="Tyre">{t("home.governorate8")}</MenuItem>
          <MenuItem value="Saida">{t("home.governorate9")}</MenuItem>
          <MenuItem value="Nabatiyeh">{t("home.governorate10")}</MenuItem>
        </TextField>
        <TextField
          label={t("home.city")}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label={t("home.street")}
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label={t("home.building")}
          value={building}
          onChange={(e) => setBuilding(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label={t("home.floor")}
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
              toast(t("home.toast.fillRequiredFields"), { type: "error" });
            }
          }}
          variant="contained"
        >
          {t("home.continue")}
        </Button>
      </Box>
    </Box>
  );

  const pageTwo = () => (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t("home.householdAndNeedsDetails")}
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
        <Typography variant="h6">{t("home.householdInformation")}</Typography>

        <TextField
          label={t("home.numberOfPeopleInHousehold")}
          value={numberOfPeopleInHousehold}
          onChange={(e) => setNumberOfPeopleInHousehold(e.target.value)}
          fullWidth
          margin="normal"
          type="number"
        />

        <Typography variant="body1">{t("home.ageRanges")}</Typography>
        {Object.keys(ageRanges).map((range) => (
          <TextField
            key={range}
            label={`${range} (${t("home.numberOfMembers")})`}
            value={ageRanges[range]}
            onChange={(e) =>
              setAgeRanges({ ...ageRanges, [range]: e.target.value })
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
        <Typography variant="h6">{t("home.needs.special.title")}</Typography>
        {[
          t("home.needs.special.need1"),
          t("home.needs.special.need2"),
          t("home.needs.special.need3"),
          t("home.needs.special.need4"),
          t("home.needs.special.need5"),
          t("home.needs.special.need6"),
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

        <Typography variant="h6">{t("home.needs.immediate.title")}</Typography>
        {[
          t("home.needs.immediate.need1"),
          t("home.needs.immediate.need2"),
          t("home.needs.immediate.need3"),
          t("home.needs.immediate.need4"),
          t("home.needs.immediate.need5"),
          t("home.needs.immediate.need6"),
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
          label={t("home.aidUrgency")}
          value={aidUrgency}
          onChange={(e) => setAidUrgency(e.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="High">{t("home.high")}</MenuItem>
          <MenuItem value="Medium">{t("home.medium")}</MenuItem>
          <MenuItem value="Low">{t("home.low")}</MenuItem>
        </TextField>

        <TextField
          label={t("home.comments")}
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
          label={t("home.consent")}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button onClick={() => setPage(1)} variant="outlined">
          {t("home.back")}
        </Button>
        <Button onClick={handleAddMember} variant="contained">
          {t("home.submit")}
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
        direction: i18n.language === "ar" ? "rtl" : "ltr",
      }}
    >
      {/* Progress Bar */}
      <Box
        sx={{
          width: "100%",
          backgroundColor: "#e0e0e0",
          borderRadius: "4px",
          overflow: "hidden",
          marginBottom: "16px",
        }}
      >
        <Box
          sx={{
            width: page === 1 ? "50%" : "100%",
            backgroundColor: "#12a89d",
            height: "8px",
            transition: "width 0.3s ease",
          }}
        />
      </Box>
      {page === 1 ? pageOne() : pageTwo()}
    </Box>
  );
}

export default Home;
