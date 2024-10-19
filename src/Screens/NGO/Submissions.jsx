import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Button,
} from "@mui/material";
import { auth } from "../../firebase"; // Import Firebase auth

function Submissions() {
  const [members, setMembers] = useState([]);
  const [isVerified, setIsVerified] = useState(true);
  const userUid = auth.currentUser?.uid;

  useEffect(() => {
    const fetchMembers = async () => {
      if (!userUid) {
        return; // Exit if user is not logged in
      }

      // Check if the NGO is validated
      const memberDoc = await db.collection("members").doc(userUid).get();
      if (memberDoc.exists) {
        const memberData = memberDoc.data();
        console.log(memberDoc.data());
        setIsVerified(memberData.validated);

        if (memberData.validated) {
          const membersCollection = await db.collection("submissions").get();
          const membersData = membersCollection.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMembers(membersData);
        }
      }
    };

    fetchMembers();
  }, [userUid]);

  const downloadCSV = () => {
    const csvRows = [];
    const headers = [
      "Full Name",
      "Phone Number",
      "National ID",
      "Email Address",
      "Gender",
      "Current Governorate",
      "Previous Governorate",
      "Street",
      "Building",
      "Floor",
      "Age Ranges",
      "Special Needs",
      "Immediate Needs",
      "Aid Urgency",
      "Comments",
      "Registration Date",
    ];
    csvRows.push(headers.join(","));

    members.forEach((member) => {
      const row = [
        member.fullName,
        member.phoneNumber,
        member.nationalID,
        member.emailAddress,
        member.gender,
        member.currentGovernorate,
        member.previousGovernorate,
        member.street,
        member.building,
        member.floor,
        JSON.stringify(member.ageRanges),
        member.specialNeeds.join(", "),
        member.needs.join(", "),
        member.aidUrgency,
        member.comments,
        member.registrationDate?.toDate().toLocaleDateString(),
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "members_data.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Members List
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={downloadCSV}
        sx={{ mb: 2 }}
      >
        Download CSV
      </Button>
      <TableContainer component={Paper} sx={{ marginTop: "20px" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Full Name</TableCell>
              <TableCell>Phone Number</TableCell>
              <TableCell>National ID</TableCell>
              <TableCell>Email Address</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Current Governorate</TableCell>
              <TableCell>Previous Governorate</TableCell>
              <TableCell>Street</TableCell>
              <TableCell>Building</TableCell>
              <TableCell>Floor</TableCell>
              <TableCell>Age Ranges</TableCell>
              <TableCell>Special Needs</TableCell>
              <TableCell>Immediate Needs</TableCell>
              <TableCell>Aid Urgency</TableCell>
              <TableCell>Comments</TableCell>
              <TableCell>Registration Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isVerified ? (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.fullName}</TableCell>
                  <TableCell>{member.phoneNumber}</TableCell>
                  <TableCell>{member.nationalID}</TableCell>
                  <TableCell>{member.emailAddress}</TableCell>
                  <TableCell>{member.gender}</TableCell>
                  <TableCell>{member.currentGovernorate}</TableCell>
                  <TableCell>{member.previousGovernorate}</TableCell>
                  <TableCell>{member.street}</TableCell>
                  <TableCell>{member.building}</TableCell>
                  <TableCell>{member.floor}</TableCell>
                  <TableCell>{JSON.stringify(member.ageRanges)}</TableCell>
                  <TableCell>{member.specialNeeds.join(", ")}</TableCell>
                  <TableCell>{member.needs.join(", ")}</TableCell>
                  <TableCell>{member.aidUrgency}</TableCell>
                  <TableCell>{member.comments}</TableCell>
                  <TableCell>
                    {member.registrationDate?.toDate().toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={16} align="center">
                  <Typography variant="body1">
                    Your account is being verified. Please check back later.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Submissions;
