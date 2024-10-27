import React, { useState, useEffect } from "react";
import { Box, Typography, Container, Link, Stack } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCommentDots,
  faInfoCircle,
  faFileAlt,
  faSignInAlt,
  faHandHoldingHeart,
  faChartBar,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { auth } from "../firebase";

function Footer() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

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
          {user?.email ? (
            <Link href="/ngo/submissions" color="inherit" underline="none">
              <FontAwesomeIcon icon={faChartBar} style={{ marginRight: 8 }} />
              Dashboard
            </Link>
          ) : (
            <Link href="/auth/login" color="inherit" underline="none">
              <FontAwesomeIcon icon={faSignInAlt} style={{ marginRight: 8 }} />
              Sign In
            </Link>
          )}

          {!user?.email && (
            <>
              <Link href="/auth/register" color="inherit" underline="none">
                <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 8 }} />
                Register NGO/Initiative
              </Link>
              <Link href="/auth/agent" color="inherit" underline="none">
                <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 8 }} />
                Become an agent
              </Link>
            </>
          )}
          <Link href="/feedback" color="inherit" underline="none">
            <FontAwesomeIcon icon={faCommentDots} style={{ marginRight: 8 }} />
            Feedback
          </Link>
          <Link href="/donate" color="inherit" underline="none">
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
