import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  TextField,
  useMediaQuery,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Modal,
  Fade,
  Backdrop,
} from "@mui/material";
import { Timestamp } from "firebase/firestore";
import { useTheme } from "@mui/material/styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faFilter,
  faTrash,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles({
  tableContainer: {
    maxHeight: "60vh",
    "&::-webkit-scrollbar": {
      width: "8px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#9c9a9a",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: "#555555",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: "#1E201E",
    },
  },
});

function Members() {
  const classes = useStyles();
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchMembers = async () => {
      const membersCollection = await db.collection("members").get();
      const membersList = membersCollection.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const calculatedMembers = membersList.map((member) => {
        const dueDate = member.dueDate?.toDate();
        if (dueDate) {
          dueDate.setHours(0, 0, 0, 0);
        }
        const status = dueDate && dueDate <= today ? "Unpaid" : "Paid";
        return {
          ...member,
          status,
          dueDate,
        };
      });

      const sortedMembers = calculatedMembers.sort((a, b) => {
        if (a.status === "Unpaid" && b.status === "Paid") return -1;
        if (a.status === "Paid" && b.status === "Unpaid") return 1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });

      setMembers(sortedMembers);
    };

    fetchMembers();
  }, []);

  const markAsPaid = async (member) => {
    const today = new Date();
    const newDueDate = new Date(member.dueDate);
    newDueDate.setMonth(newDueDate.getMonth() + 1);

    await db
      .collection("members")
      .doc(member.id)
      .update({
        dueDate: Timestamp.fromDate(newDueDate),
        lastDayPaid: Timestamp.fromDate(today),
      });

    setMembers((prevMembers) =>
      prevMembers.map((m) =>
        m.id === member.id
          ? {
              ...m,
              dueDate: newDueDate,
              lastDayPaid: today,
              status: "Paid",
            }
          : m
      )
    );
  };

  const toggleInactiveStatus = async (member) => {
    await db.collection("members").doc(member.id).update({
      inactive: !member.inactive,
    });
    setMembers((prevMembers) =>
      prevMembers.map((m) =>
        m.id === member.id ? { ...m, inactive: !m.inactive } : m
      )
    );
  };

  const handleDeleteClick = (member) => {
    setMemberToDelete(member);
    setOpenModal(true);
  };

  const handleConfirmDelete = async () => {
    if (memberToDelete) {
      await db.collection("members").doc(memberToDelete.id).delete();
      setMembers((prevMembers) =>
        prevMembers.filter((m) => m.id !== memberToDelete.id)
      );
      setOpenModal(false);
      setMemberToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setMemberToDelete(null);
  };

  const handleFilterClick = () => {
    setShowFilters((prev) => !prev);
  };

  const handleInactiveUsersClick = () => {
    setShowInactive((prev) => !prev);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  const filteredMembers = members
    .filter((member) => (showInactive ? member.inactive : !member.inactive))
    .filter((member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((member) => {
      if (!selectedDate) return true;
      const registrationDate = member.subscriptionDate.toDate();
      return (
        registrationDate.getDate() === selectedDate.getDate() &&
        registrationDate.getMonth() === selectedDate.getMonth() &&
        registrationDate.getFullYear() === selectedDate.getFullYear()
      );
    })
    .filter((member) => {
      if (!selectedMonth) return true;
      const registrationMonth = member.subscriptionDate.toDate().getMonth();
      return registrationMonth === parseInt(selectedMonth, 10);
    });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          padding: isMobile ? "16px" : "32px",
          maxWidth: "100%",
          overflowX: "auto",
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          style={{
            color: "white",
          }}
        >
          Members {`(${filteredMembers?.length})`}
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <TextField
            label="Search by name"
            variant="outlined"
            fullWidth
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={handleFilterClick}
            sx={{ marginTop: isMobile ? "16px" : "0" }}
          >
            {showFilters ? (
              <FontAwesomeIcon icon={faX} />
            ) : (
              <FontAwesomeIcon icon={faFilter} />
            )}
          </Button>
          <Button
            variant="contained"
            color={showInactive ? "error" : "secondary"}
            onClick={handleInactiveUsersClick}
            sx={{ marginTop: isMobile ? "16px" : "0" }}
          >
            {showInactive ? "Active" : "Inactive"}
          </Button>
        </Box>

        {showFilters && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "40px",
            }}
          >
            <FormControl fullWidth>
              <DatePicker
                label="Filter by Date"
                value={selectedDate}
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} />}
              />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Filter by Month</InputLabel>
              <Select
                value={selectedMonth}
                onChange={handleMonthChange}
                label="Filter by Month"
              >
                <MenuItem value="">All Months</MenuItem>
                <MenuItem value={0}>January</MenuItem>
                <MenuItem value={1}>February</MenuItem>
                <MenuItem value={2}>March</MenuItem>
                <MenuItem value={3}>April</MenuItem>
                <MenuItem value={4}>May</MenuItem>
                <MenuItem value={5}>June</MenuItem>
                <MenuItem value={6}>July</MenuItem>
                <MenuItem value={7}>August</MenuItem>
                <MenuItem value={8}>September</MenuItem>
                <MenuItem value={9}>October</MenuItem>
                <MenuItem value={10}>November</MenuItem>
                <MenuItem value={11}>December</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: "#1E201E",
            maxHeight: showFilters ? "50vh" : "calc(100vh - 300px)",
            overflowY: "auto",
          }}
          className={classes.tableContainer}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "white", backgroundColor: "#1E201E" }}>
                  Name
                </TableCell>
                <TableCell sx={{ color: "white", backgroundColor: "#1E201E" }}>
                  Subscription Date
                </TableCell>
                <TableCell sx={{ color: "white", backgroundColor: "#1E201E" }}>
                  Due Date
                </TableCell>
                <TableCell sx={{ color: "white", backgroundColor: "#1E201E" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow
                  key={member.id}
                  sx={{
                    bgcolor: member.status === "Unpaid" ? "#ffebee" : "#1E201E",
                  }}
                >
                  <TableCell
                    style={{
                      textTransform: "capitalize",
                      color: "white",
                    }}
                  >
                    {member.name}
                  </TableCell>
                  <TableCell style={{ color: "white" }}>
                    {member.subscriptionDate
                      .toDate()
                      .toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell style={{ color: "white" }}>
                    {member.dueDate?.toLocaleDateString("en-GB") || "N/A"}
                  </TableCell>
                  <TableCell>
                    {member.status === "Unpaid" && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => markAsPaid(member)}
                        sx={{ marginRight: "8px" }}
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      onClick={() => toggleInactiveStatus(member)}
                      sx={{ marginRight: "8px" }}
                    >
                      {member.inactive ? (
                        <FontAwesomeIcon icon={faCheck} />
                      ) : (
                        <FontAwesomeIcon icon={faTrash} />
                      )}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => handleDeleteClick(member)}
                    >
                      <FontAwesomeIcon icon={faX} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Modal open={openModal} onClose={handleCloseModal} closeAfterTransition>
        <Fade in={openModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "background.paper",
              border: "2px solid #000",
              boxShadow: 24,
              p: 4,
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              Confirm Delete
            </Typography>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to delete {memberToDelete?.name}?
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                marginTop: 3,
              }}
            >
              <Button
                variant="contained"
                color="error"
                onClick={handleCloseModal}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleConfirmDelete}
              >
                Confirm
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </LocalizationProvider>
  );
}

export default Members;
