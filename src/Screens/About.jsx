import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, Container } from "@mui/material";

function About() {
  const { t } = useTranslation();

  return (
    <Container
      component="section"
      maxWidth="lg"
      sx={{
        display: "flex",
        flexDirection: "column",
        py: 3, // Padding on the y-axis
        minHeight: "85dvh",
      }}
    >
      <Typography variant="h4" gutterBottom>
        {t("about.title.aboutUs")}
      </Typography>
      <Typography variant="body1" paragraph>
        {t("about.description")}
      </Typography>

      <Typography variant="h4" gutterBottom>
        {t("about.title.mission")}
      </Typography>
      <Typography variant="body1" paragraph>
        {t("about.mission")}
      </Typography>

      <Typography variant="h4" gutterBottom>
        {t("about.title.vision")}
      </Typography>
      <Typography variant="body1" paragraph>
        {t("about.vision")}
      </Typography>

      <Typography variant="h4" gutterBottom>
        {t("about.title.joinUs")}
      </Typography>
      <Typography variant="body1" paragraph>
        {t("about.joinUs")}
      </Typography>
    </Container>
  );
}

export default About;
