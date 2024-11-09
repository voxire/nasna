import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, Button, Grid, Paper, Divider } from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import HandshakeIcon from "@mui/icons-material/Handshake";
import PeopleIcon from "@mui/icons-material/People";

function About() {
  const { t } = useTranslation();

  return (
    <>
      {/* Banner Section */}
      <Box
        component="section"
        sx={{
          maxWidth: "100%",
          minHeight: "25vh",
          backgroundImage: 'url("/public/nabatiye.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          overflow: "hidden",
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
            p: 2,
          }}
        >
          <Typography variant="h3" gutterBottom>
            {t("about.banner.aboutUs")}
          </Typography>
          <Typography variant="body1" paragraph>
            {t("about.banner.quote")}
          </Typography>
        </Box>
      </Box>

      {/* About Us Content Section */}
      <Box
        component="section"
        sx={{
          maxWidth: "100%",
          padding: "40px",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {/* Text Section */}
        <Box
          sx={{
            flex: 1,
            textAlign: { xs: "center", md: "left" },
            mb: { xs: 4, md: 0 },
            mr: { md: 4 },
          }}
        >
          <Typography variant="h4" gutterBottom>
            {t("about.content.title")}
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            {t("about.content.missionStatement")}
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            {t("about.content.visionStatement")}
          </Typography>
          <Button variant="contained" color="primary" href="/volunteer">
            {t("about.content.volunteerButton")}
          </Button>
        </Box>

        {/* Image Section */}
        <Box
          component="img"
          src="/public/logo.png"
          alt="Nasna Volunteers"
          sx={{
            flex: 1,
            maxWidth: "100%",
            height: "auto",
            overflow: "hidden",
          }}
        />
      </Box>

      {/* How We Operate Section */}
      <Box
        component="section"
        sx={{
          maxWidth: "100%",
          padding: "60px 20px",
        }}
      >
        <Typography variant="h4" gutterBottom color="primary">
          {t("about.howWeOperate.title")}
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <AccountTreeIcon color="primary" sx={{ fontSize: 50 }} />
              <Typography variant="h6">
                {t("about.howWeOperate.registrationTitle")}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography color="text.secondary">
                {t("about.howWeOperate.registrationDescription")}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <HandshakeIcon color="primary" sx={{ fontSize: 50 }} />
              <Typography variant="h6">
                {t("about.howWeOperate.partnershipsTitle")}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography color="text.secondary">
                {t("about.howWeOperate.partnershipsDescription")}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <PeopleIcon color="primary" sx={{ fontSize: 50 }} />
              <Typography variant="h6">
                {t("about.howWeOperate.supportTitle")}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography color="text.secondary">
                {t("about.howWeOperate.supportDescription")}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}

export default About;
