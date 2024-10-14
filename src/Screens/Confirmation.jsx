import React from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

function Confirmation() {
  const { t } = useTranslation();

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
        {t("confirmation.thankYou")}
      </Typography>
      <Typography variant="h6" component="p" gutterBottom>
        {t("confirmation.submissionRecieved")}
      </Typography>
      <Typography variant="body1" component="p" gutterBottom>
        {t("confirmation.appreciation")}
      </Typography>
    </Box>
  );
}

export default Confirmation;
