import React from "react";
import { Snackbar, Alert } from "@mui/material";

interface SnackbarComponentProps {
  open: boolean;
  message: string;
  severity?: "success" | "error" | "warning" | "info";
  onClose: () => void;
  autoHideDuration?: number;
}

const NasnaSnackBar: React.FC<SnackbarComponentProps> = ({
  open,
  message,
  severity = "success",
  onClose,
  autoHideDuration = 6000,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert onClose={onClose} severity={severity}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default NasnaSnackBar;
