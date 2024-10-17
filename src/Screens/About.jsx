import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, Link } from "@mui/material";

function About() {
  const { t } = useTranslation();

  return (
    <Box
      component="section"
      sx={{
        width: "100vw", 
        minHeight: "10vh", 
        backgroundImage: 'url("/public/nabatiye.jpg")', 
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)", 
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          p: 4,
        }}
      >
        <Typography variant="h3" gutterBottom>
          {t("about.title.aboutUs")}
        </Typography>

        <Typography variant="body1" paragraph>
          <Link href="/" color="inherit" underline="hover">
            {t("home")}
          </Link>{" "}
          / {t("about.title.aboutUs")}
        </Typography>
      </Box>
    </Box>
  );
}

export default About;
