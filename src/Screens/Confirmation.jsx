import React from "react";
import { Box, Typography } from "@mui/material";

function Confirmation() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        textAlign: "center",
        paddingTop: "100px",
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Thank You!
      </Typography>
      <Typography variant="h6" component="p" gutterBottom>
        Your submission has been received successfully.
      </Typography>
      <Typography variant="body1" component="p" gutterBottom>
        We appreciate your participation and support.
      </Typography>
    </Box>
  );
}

export default Confirmation;
