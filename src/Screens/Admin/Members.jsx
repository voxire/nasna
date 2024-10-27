import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Modal,
  TextField,
} from "@mui/material";
import { useSnackBar } from "../../Components/NasnaSnackBar";

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMember, setEditMember] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { showSnackbar } = useSnackBar();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const snapshot = await db.collection("members").get();
      const membersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMembers(membersData);
    } catch (error) {
      console.error("Error fetching members: ", error);
      showSnackbar("Error fetching members.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this member?"
    );
    if (!confirmDelete) return;

    try {
      await db.collection("members").doc(id).delete();
      showSnackbar("Member deleted successfully.", "success");
      fetchMembers(); // Refresh the member list
    } catch (error) {
      console.error("Error deleting member: ", error);
      showSnackbar("Error deleting member. Please try again.", "error");
    }
  };

  const handleValidate = async (id) => {
    try {
      await db.collection("members").doc(id).update({ validated: true });
      showSnackbar("Member validated successfully.", "success");
      fetchMembers(); // Refresh the member list
    } catch (error) {
      console.error("Error validating member: ", error);
      showSnackbar("Error validating member. Please try again.", "error");
    }
  };

  const handleOpenModal = (member) => {
    setEditMember(member);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditMember(null);
    setModalOpen(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditMember((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await db.collection("members").doc(editMember.id).update(editMember);
      showSnackbar("Member updated successfully.", "success");
      handleCloseModal();
      fetchMembers(); // Refresh the member list
    } catch (error) {
      console.error("Error updating member: ", error);
      showSnackbar("Error updating member. Please try again.", "error");
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        NGO Members
      </Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact Person</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone Number</TableCell>
                <TableCell>Validated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.contactPersonName}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phoneNumber}</TableCell>
                  <TableCell>{member.validated ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {!member.validated && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleValidate(member.id)}
                      >
                        Validate
                      </Button>
                    )}
                    {member.validated && (
                      <>
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => handleOpenModal(member)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleDelete(member.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            maxWidth: 400,
            margin: "auto",
            backgroundColor: "#fff",
            padding: 2,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Edit Member
          </Typography>
          <form onSubmit={handleEditSubmit}>
            <TextField
              label="Name"
              name="name"
              value={editMember?.name || ""}
              onChange={handleEditChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Contact Person"
              name="contactPersonName"
              value={editMember?.contactPersonName || ""}
              onChange={handleEditChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email"
              name="email"
              value={editMember?.email || ""}
              onChange={handleEditChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Phone Number"
              name="phoneNumber"
              value={editMember?.phoneNumber || ""}
              onChange={handleEditChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <Button type="submit" variant="contained" color="primary">
              Save Changes
            </Button>
          </form>
        </Box>
      </Modal>
    </Box>
  );
}

export default Members;
