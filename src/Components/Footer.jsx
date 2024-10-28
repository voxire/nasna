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
  faUserShield, // Admin icon
} from "@fortawesome/free-solid-svg-icons";
import { auth } from "../firebase";
import { useTranslation } from "react-i18next"; // Import i18next

function Footer() {
  const { t } = useTranslation(); // Initialize i18n translation hook
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);

      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          setRole(tokenResult.claims.role);
        } catch (error) {
          console.error("Error retrieving user role:", error);
        }
      } else {
        setRole(null);
      }
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
          direction={{ xs: "column", sm: "column", md: "row" }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
          sx={{ mt: 2, mb: 3 }}
        >
          <Link href="/about" color="inherit" underline="none">
            <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: 8 }} />
            {t("footer.aboutUs")}
          </Link>

          {user?.email ? (
            <>
              {role === "admin" ? (
                <Link href="/manage" color="inherit" underline="none">
                  <FontAwesomeIcon
                    icon={faUserShield}
                    style={{ marginRight: 8 }}
                  />
                  {t("footer.adminPanel")}
                </Link>
              ) : (
                <Link href="/ngo/submissions" color="inherit" underline="none">
                  <FontAwesomeIcon
                    icon={faChartBar}
                    style={{ marginRight: 8 }}
                  />
                  {t("footer.dashboard")}
                </Link>
              )}
            </>
          ) : (
            <Link href="/auth/login" color="inherit" underline="none">
              <FontAwesomeIcon icon={faSignInAlt} style={{ marginRight: 8 }} />
              {t("footer.signIn")}
            </Link>
          )}

          {!user?.email && (
            <>
              <Link href="/auth/register" color="inherit" underline="none">
                <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 8 }} />
                {t("footer.registerNgo")}
              </Link>
              <Link href="/auth/agent" color="inherit" underline="none">
                <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 8 }} />
                {t("footer.becomeAgent")}
              </Link>
            </>
          )}
        </Stack>

        <div className="FooterBottom">
          <Typography variant="body1">
            © {new Date().getFullYear()} Nasna. {t("footer.allRightsReserved")}
          </Typography>
        </div>
      </Container>
    </Box>
  );
}

export default Footer;
