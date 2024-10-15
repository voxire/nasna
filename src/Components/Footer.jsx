import React from "react";
import { Box, Typography, Container, Link } from "@mui/material";

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#12a89d",
        color: "#fff",
        py: 2,
        textAlign: "center",
      }}
    >
      <Container>
        <Typography variant="body1">
          © {new Date().getFullYear()} Nasna. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer;
