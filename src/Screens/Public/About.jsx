import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, Link, Button, Grid, Paper, Divider, Avatar, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import HandshakeIcon from "@mui/icons-material/Handshake";
import PeopleIcon from "@mui/icons-material/People";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import GavelIcon from '@mui/icons-material/Gavel';

function About() {
  const { t } = useTranslation();

  return (
    <>
      {/* Banner Section */}
      <Box
        component="section"
        sx={{
          width: "100vw",
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
          {/* <Typography variant="body1" paragraph>
            <Link href="/" color="inherit" underline="hover">
              {t("about.banner.FormButton")}
            </Link>{" "}
            / {t("about.title.aboutUs")}
          </Typography> */}
        </Box>
      </Box>

      {/* About Us Content Section */}
      <Box
        component="section"
        sx={{
          width: "100vw",
          height: "55vh",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          padding: "40px",
          backgroundColor: "#f5f5f5",
        }}
      >
        {/* Text Section */}
        <Box
          sx={{
            flex: 1,
            textAlign: { xs: "center", md: "left" },
            marginRight: { md: 4 },
            marginBottom: { xs: 4, md: 0 },
          }}
        >
          <Typography variant="h4" gutterBottom>
            {t("about.content.title")}
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: "text.secondary" }}>
            {t("about.content.missionStatement")}
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: "text.secondary" }}>
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
            maxWidth: "50%",
            height: "auto",
          }}
        />
      </Box>

      {/* How We Operate Section */}
      <Box
        component="section"
        sx={{
          width: "100vw",
          padding: "60px 10px",
          backgroundColor: "#f5f5f5",
          textAlign: "center",
        }}
      >
        <Typography variant="h4" gutterBottom color="primary" sx={{ mb: 4 }}>
          {t("about.howWeOperate.title")}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: "800px", mx: "auto" }}>
          {t("about.howWeOperate.intro")}
        </Typography>

        <Grid container spacing={6} justifyContent="center">
          {/* Registration Process for Displaced People */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ padding: "30px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <AccountTreeIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {t("about.howWeOperate.registrationTitle")}
              </Typography>
              <Divider sx={{ width: "40px", my: 2, borderColor: "primary.main" }} />
              <Typography variant="body2" color="text.secondary">
                {t("about.howWeOperate.registrationDescription")}
              </Typography>
            </Paper>
          </Grid>

          {/* Partnerships with Other Organizations */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ padding: "30px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <HandshakeIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {t("about.howWeOperate.partnershipsTitle")}
              </Typography>
              <Divider sx={{ width: "40px", my: 2, borderColor: "primary.main" }} />
              <Typography variant="body2" color="text.secondary">
                {t("about.howWeOperate.partnershipsDescription")}
              </Typography>
            </Paper>
          </Grid>

          {/* Support for Beneficiaries and Donors */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ padding: "30px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <PeopleIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {t("about.howWeOperate.supportTitle")}
              </Typography>
              <Divider sx={{ width: "40px", my: 2, borderColor: "primary.main" }} />
              <Typography variant="body2" color="text.secondary">
                {t("about.howWeOperate.supportDescription")}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Who We Are Section */}
      <Box
        component="section"
        sx={{
          width: "100vw",
          padding: "60px 20px",
          backgroundColor: "#ffffff",
          textAlign: "center",
        }}
      >
        <Typography variant="h4" gutterBottom color="primary" sx={{ mb: 4 }}>
          {t("about.whoWeAre.title")}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: "800px", mx: "auto" }}>
          {t("about.whoWeAre.intro")}
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Avatar alt="Team Member" src="/public/member1.jpg" sx={{ width: 80, height: 80, mb: 2 }} />
              <Typography variant="h6" gutterBottom>{t("about.whoWeAre.member1.name")}</Typography>
              <Typography variant="body2" color="text.secondary">{t("about.whoWeAre.member1.position")}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t("about.whoWeAre.member1.affiliation")}</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Avatar alt="Team Member" src="/public/member2.jpg" sx={{ width: 80, height: 80, mb: 2 }} />
              <Typography variant="h6" gutterBottom>{t("about.whoWeAre.member2.name")}</Typography>
              <Typography variant="body2" color="text.secondary">{t("about.whoWeAre.member2.position")}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t("about.whoWeAre.member2.affiliation")}</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Avatar alt="Team Member" src="/public/member3.jpg" sx={{ width: 80, height: 80, mb: 2 }} />
              <Typography variant="h6" gutterBottom>{t("about.whoWeAre.member3.name")}</Typography>
              <Typography variant="body2" color="text.secondary">{t("about.whoWeAre.member3.position")}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t("about.whoWeAre.member3.affiliation")}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
       {/* Get Involved Section */}
       <Box
        component="section"
        sx={{
          width: "100vw",
          padding: "60px 10px",
          backgroundColor: "#e8f4f8",
          textAlign: "center",
        }}
      >
        <Typography variant="h4" gutterBottom color="primary" sx={{ mb: 4 }}>
          {t("about.getInvolved.title")}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: "800px", mx: "auto" }}>
          {t("about.getInvolved.intro")}
        </Typography>

        <Grid container spacing={6} justifyContent="center">
          {/* Volunteer */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ padding: "30px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <VolunteerActivismIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {t("about.getInvolved.volunteerTitle")}
              </Typography>
              <Divider sx={{ width: "40px", my: 2, borderColor: "primary.main" }} />
              <Typography variant="body2" color="text.secondary">
                {t("about.getInvolved.volunteerDescription")}
              </Typography>
              <Button variant="contained" color="primary" sx={{ mt: 2 }} href="/volunteer">
                {t("about.getInvolved.volunteerButton")}
              </Button>
            </Paper>
          </Grid>

          {/* Donate */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ padding: "30px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <LocalAtmIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {t("about.getInvolved.donateTitle")}
              </Typography>
              <Divider sx={{ width: "40px", my: 2, borderColor: "primary.main" }} />
              <Typography variant="body2" color="text.secondary">
                {t("about.getInvolved.donateDescription")}
              </Typography>
              <Button variant="contained" color="primary" sx={{ mt: 2 }} href="/donate">
                {t("about.getInvolved.donateButton")}
              </Button>
            </Paper>
          </Grid>

          {/* Partner */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ padding: "30px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <BusinessCenterIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {t("about.getInvolved.partnerTitle")}
              </Typography>
              <Divider sx={{ width: "40px", my: 2, borderColor: "primary.main" }} />
              <Typography variant="body2" color="text.secondary">
                {t("about.getInvolved.partnerDescription")}
              </Typography>
              <Button variant="contained" color="primary" sx={{ mt: 2 }} href="/partner">
                {t("about.getInvolved.partnerButton")}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      {/* FAQ Section */}
      <Box
        component="section"
        sx={{
          width: "100vw",
          padding: "60px 20px",
          backgroundColor: "#f0f4f8",
          textAlign: "center",
        }}
      >
        <Typography variant="h4" gutterBottom color="primary" sx={{ mb: 4 }}>
          {t("about.faq.title")}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: "800px", mx: "auto" }}>
          {t("about.faq.intro")}
        </Typography>

        <Box sx={{ maxWidth: "800px", mx: "auto" }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content">
              <Typography>{t("about.faq.questions.eligibility")}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                {t("about.faq.answers.eligibility")}
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel2a-content">
              <Typography>{t("about.faq.questions.legitimacy")}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                {t("about.faq.answers.legitimacy")}
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel3a-content">
              <Typography>{t("about.faq.questions.dataHandling")}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                {t("about.faq.answers.dataHandling")}
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Box>
       {/* Legal Status and Compliance Section */}
       <Box
        component="section"
        sx={{
          width: "100vw",
          padding: "60px 10px",
          backgroundColor: "#f0f4f8",
          textAlign: "center",
        }}
      >
        <Paper elevation={3} sx={{ padding: "40px", maxWidth: "800px", margin: "auto" }}>
          <GavelIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            {t("about.legalStatus.title")}
          </Typography>
          <Divider sx={{ width: "60px", my: 2, borderColor: "primary.main", mx: "auto" }} />
          <Typography variant="body1" color="text.secondary" paragraph>
            {t("about.legalStatus.description")}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t("about.legalStatus.disclaimer")}
          </Typography>
        </Paper>
      </Box>
    </>
  );
}

export default About;
