import React from "react";
import { Box, Typography, Container, Link, Stack } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCommentDots,
  faInfoCircle,
  faFileAlt,
  faSignInAlt,
  faHandHoldingHeart,
} from "@fortawesome/free-solid-svg-icons";

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
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
          sx={{ mt: 2, mb: 3 }}
        >
          <Link href="/about" color="inherit" underline="none">
            <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: 8 }} />
            About Us
          </Link>
          <Link href="/policy" color="inherit" underline="none">
            <FontAwesomeIcon icon={faFileAlt} style={{ marginRight: 8 }} />
            Policy
          </Link>
          <Link href="/auth/login" color="inherit" underline="none">
            <FontAwesomeIcon icon={faSignInAlt} style={{ marginRight: 8 }} />
            NGO Login
          </Link>
          <Link href="/feedback" color="inherit" underline="none">
            <FontAwesomeIcon icon={faCommentDots} style={{ marginRight: 8 }} />
            Feedback
          </Link>
          <Link href="/feedback" color="inherit" underline="none">
            <FontAwesomeIcon
              icon={faHandHoldingHeart}
              style={{ marginRight: 8 }}
            />
            Donate
          </Link>
        </Stack>

        <div className="FooterBottom">
          <Typography variant="body1">
            © {new Date().getFullYear()} Nasna. All rights reserved.
          </Typography>
        </div>
      </Container>
    </Box>
  );
}

export default Footer;
