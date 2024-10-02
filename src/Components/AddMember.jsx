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

function AddMember() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationalID, setNationalID] = useState("");
  const [householdSize, setHouseholdSize] = useState("");
  const [householdMembers, setHouseholdMembers] = useState([
    { name: "", age: "", gender: "", relationship: "" },
  ]);
  const [specialNeeds, setSpecialNeeds] = useState([]);
  const [currentAddress, setCurrentAddress] = useState("");
  const [needs, setNeeds] = useState([]);
  const [aidUrgency, setAidUrgency] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);

  const navigate = useNavigate();

  const handleAddMember = async () => {
    if (fullName && phoneNumber && householdSize) {
      await db.collection("members").add({
        fullName,
        phoneNumber,
        nationalID,
        householdSize,
        householdMembers,
        specialNeeds,
        currentAddress,
        needs,
        aidUrgency,
        consentGiven,
        registrationDate: Timestamp.fromDate(new Date()),
      });

      // Reset form
      setFullName("");
      setPhoneNumber("");
      setNationalID("");
      setHouseholdSize("");
      setHouseholdMembers([
        { name: "", age: "", gender: "", relationship: "" },
      ]);
      setSpecialNeeds([]);
      setCurrentAddress("");
      setNeeds([]);
      setAidUrgency("");
      setConsentGiven(false);

      toast("Member added successfully!", { type: "success" });
      navigate("/");
    } else {
      toast("Please fill in all required fields", { type: "error" });
    }
  };

  const handleHouseholdChange = (index, field, value) => {
    const updatedMembers = [...householdMembers];
    updatedMembers[index][field] = value;
    setHouseholdMembers(updatedMembers);
  };

  const addHouseholdMember = () => {
    setHouseholdMembers([
      ...householdMembers,
      { name: "", age: "", gender: "", relationship: "" },
    ]);
  };

  const specialNeedsOptions = [
    "Pregnancy",
    "Chronic Illness",
    "Disability",
    "Infants/Toddlers",
    "Elderly",
  ];
  const immediateNeedsOptions = [
    "Food",
    "Water",
    "Shelter Materials",
    "Hygiene Products",
    "Medical Supplies",
    "Clothing",
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        style={{
          marginTop: "40px",
        }}
      >
        Add Member Information
      </Typography>

      <TextField
        label="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        fullWidth
        margin="normal"
      />

      <TextField
        label="Phone Number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        fullWidth
        margin="normal"
        type="tel"
      />

      <TextField
        label="National ID (Optional)"
        value={nationalID}
        onChange={(e) => setNationalID(e.target.value)}
        fullWidth
        margin="normal"
      />

      <TextField
        label="Number of People in Household"
        value={householdSize}
        onChange={(e) => setHouseholdSize(e.target.value)}
        fullWidth
        margin="normal"
        type="number"
      />

      {householdMembers.map((member, index) => (
        <Box key={index} sx={{ marginBottom: "16px" }}>
          <TextField
            label={`Household Member ${index + 1} Name`}
            value={member.name}
            onChange={(e) =>
              handleHouseholdChange(index, "name", e.target.value)
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Age"
            value={member.age}
            onChange={(e) =>
              handleHouseholdChange(index, "age", e.target.value)
            }
            fullWidth
            margin="normal"
            type="number"
          />
          <TextField
            label="Relationship to Primary"
            value={member.relationship}
            onChange={(e) =>
              handleHouseholdChange(index, "relationship", e.target.value)
            }
            fullWidth
            margin="normal"
          />
          <TextField
            select
            label="Gender"
            value={member.gender}
            onChange={(e) =>
              handleHouseholdChange(index, "gender", e.target.value)
            }
            fullWidth
            margin="normal"
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other/Non-Binary</MenuItem>
          </TextField>
        </Box>
      ))}

      <Button onClick={addHouseholdMember} sx={{ marginBottom: "16px" }}>
        Add Another Household Member
      </Button>

      <TextField
        label="Current Address"
        value={currentAddress}
        onChange={(e) => setCurrentAddress(e.target.value)}
        fullWidth
        margin="normal"
      />

      <Typography variant="h6" sx={{ marginTop: "16px" }}>
        Special Needs
      </Typography>
      {specialNeedsOptions.map((need) => (
        <FormControlLabel
          key={need}
          control={
            <Checkbox
              checked={specialNeeds.includes(need)}
              onChange={(e) => {
                const updatedNeeds = e.target.checked
                  ? [...specialNeeds, need]
                  : specialNeeds.filter((n) => n !== need);
                setSpecialNeeds(updatedNeeds);
              }}
            />
          }
          label={need}
        />
      ))}

      <Typography variant="h6" sx={{ marginTop: "16px" }}>
        Immediate Needs
      </Typography>
      {immediateNeedsOptions.map((need) => (
        <FormControlLabel
          key={need}
          control={
            <Checkbox
              checked={needs.includes(need)}
              onChange={(e) => {
                const updatedNeeds = e.target.checked
                  ? [...needs, need]
                  : needs.filter((n) => n !== need);
                setNeeds(updatedNeeds);
              }}
            />
          }
          label={need}
        />
      ))}

      <TextField
        select
        label="Urgency of Aid"
        value={aidUrgency}
        onChange={(e) => setAidUrgency(e.target.value)}
        fullWidth
        margin="normal"
      >
        <MenuItem value="Immediate">Immediate</MenuItem>
        <MenuItem value="Within a few days">Within a few days</MenuItem>
        <MenuItem value="No urgent need">No urgent need</MenuItem>
      </TextField>

      <FormControlLabel
        control={
          <Checkbox
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
          />
        }
        label="I give consent to share my data with aid organizations"
      />

      <Box
        sx={{
          marginTop: "16px",
          width: "100%",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="contained"
          color="secondary"
          onClick={handleAddMember}
          fullWidth
          sx={{ padding: "12px 0" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddMember();
            }
          }}
        >
          Submit
        </Button>
      </Box>
    </Box>
  );
}

export default AddMember;
