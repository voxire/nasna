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
  Modal,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import { useTranslation } from "react-i18next";

function AdminSubmissions() {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [editMember, setEditMember] = useState({
    ageRanges: [],
    specialNeeds: [],
    needs: [],
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      const membersCollection = await db.collection("members").get();
      const membersData = membersCollection.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMembers(membersData);
    };

    fetchMembers();
  }, []);

  const handleEditClick = (member) => {
    setEditMember({
      ...member,
      ageRanges: Array.isArray(member.ageRanges) ? member.ageRanges : [],
      specialNeeds: Array.isArray(member.specialNeeds)
        ? member.specialNeeds
        : [],
      needs: Array.isArray(member.needs) ? member.needs : [],
    });
    setModalOpen(true);
  };

  const handleDeleteClick = (memberId) => {
    setMemberToDelete(memberId);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await db.collection("members").doc(memberToDelete).delete();
      setMembers(members.filter((member) => member.id !== memberToDelete));
      setConfirmDeleteOpen(false);
    } catch (err) {
      setError("Failed to delete member.");
    }
  };

  const handleSaveEdit = async () => {
    try {
      await db
        .collection("members")
        .doc(editMember.id)
        .update({
          ...editMember,
          ageRanges: editMember.ageRanges,
          specialNeeds: editMember.specialNeeds,
          needs: editMember.needs,
        });
      setModalOpen(false);
    } catch (err) {
      setError("Failed to update member details.");
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleConfirmDeleteClose = () => {
    setConfirmDeleteOpen(false);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t("adminSubmissions.title")}
      </Typography>
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
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member) => (
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
                <TableCell>{JSON.stringify(member.ageRanges || [])}</TableCell>
                <TableCell>{member.specialNeeds?.join(", ") || ""}</TableCell>
                <TableCell>{member.needs?.join(", ") || ""}</TableCell>
                <TableCell>{member.aidUrgency}</TableCell>
                <TableCell>{member.comments}</TableCell>
                <TableCell>
                  {member.registrationDate?.toDate().toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleEditClick(member)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => handleDeleteClick(member.id)}
                    sx={{ marginLeft: "10px" }} // Adjust margin as needed
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={modalOpen} onClose={handleModalClose}>
        <Box
          sx={{
            padding: 2,
            backgroundColor: "white",
            borderRadius: 2,
            width: "500px",
            maxWidth: "90%",
            margin: "auto",
            marginTop: "50px",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6">Edit Member</Typography>
          <TextField
            label="Full Name"
            value={editMember.fullName || ""}
            onChange={(e) =>
              setEditMember({ ...editMember, fullName: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Phone Number"
            value={editMember.phoneNumber || ""}
            onChange={(e) =>
              setEditMember({ ...editMember, phoneNumber: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="National ID"
            value={editMember.nationalID || ""}
            onChange={(e) =>
              setEditMember({ ...editMember, nationalID: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Email Address"
            value={editMember.emailAddress || ""}
            onChange={(e) =>
              setEditMember({ ...editMember, emailAddress: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Gender"
            value={editMember.gender || ""}
            onChange={(e) =>
              setEditMember({ ...editMember, gender: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Current Governorate"
            value={editMember.currentGovernorate || ""}
            onChange={(e) =>
              setEditMember({
                ...editMember,
                currentGovernorate: e.target.value,
              })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Previous Governorate"
            value={editMember.previousGovernorate || ""}
            onChange={(e) =>
              setEditMember({
                ...editMember,
                previousGovernorate: e.target.value,
              })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Street"
            value={editMember.street || ""}
            onChange={(e) =>
              setEditMember({ ...editMember, street: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Building"
            value={editMember.building || ""}
            onChange={(e) =>
              setEditMember({ ...editMember, building: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Floor"
            value={editMember.floor || ""}
            onChange={(e) =>
              setEditMember({ ...editMember, floor: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Age Ranges"
            value={editMember.ageRanges.join(", ") || ""}
            onChange={(e) =>
              setEditMember({
                ...editMember,
                ageRanges: e.target.value.split(", "),
              })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Special Needs"
            value={editMember.specialNeeds.join(", ") || ""}
            onChange={(e) =>
              setEditMember({
                ...editMember,
                specialNeeds: e.target.value.split(", "),
              })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Immediate Needs"
            value={editMember.needs.join(", ") || ""}
            onChange={(e) =>
              setEditMember({
                ...editMember,
                needs: e.target.value.split(", "),
              })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Aid Urgency"
            value={editMember.aidUrgency || ""}
            onChange={(e) =>
              setEditMember({ ...editMember, aidUrgency: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Comments"
            value={editMember.comments || ""}
            onChange={(e) =>
              setEditMember({ ...editMember, comments: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Registration Date"
            value={
              editMember.registrationDate?.toDate().toLocaleDateString() || ""
            }
            onChange={(e) =>
              setEditMember({ ...editMember, registrationDate: e.target.value })
            }
            fullWidth
            margin="normal"
            disabled
          />
          <Box
            sx={{
              marginTop: 2,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveEdit}
              sx={{ marginRight: "10px" }}
            >
              Save
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleModalClose}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal open={confirmDeleteOpen} onClose={handleConfirmDeleteClose}>
        <Box
          sx={{
            padding: 2,
            backgroundColor: "white",
            borderRadius: 2,
            width: "300px",
            margin: "auto",
            marginTop: "10%",
            textAlign: "center",
          }}
        >
          <Typography variant="h6">
            Are you sure you want to delete this member?
          </Typography>
          <Box
            sx={{
              marginTop: 2,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Button
              variant="contained"
              color="error"
              onClick={confirmDelete}
              sx={{ marginRight: "10px" }}
            >
              Confirm
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleConfirmDeleteClose}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
      >
        <Alert onClose={() => setError("")} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminSubmissions;
