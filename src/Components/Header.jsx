import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  IconButton,
} from "@mui/material";
import { auth } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faLanguage } from "@fortawesome/free-solid-svg-icons";
import { selectLanguage } from "../services/i18next";
import { faInfo } from "@fortawesome/free-solid-svg-icons/faInfo";
import { useNavigate } from "react-router-dom";

function Header() {
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const isMobile = false;
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) {
      selectLanguage(savedLanguage);
    }
  }, []);

  const handleLanguageChange = (lng) => {
    selectLanguage(lng);
    console.log("Language changed to: " + lng);
    setAnchorEl(null);
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            color: "white",
            display: "flex",
            alignItems: "center",
          }}
        >
          <img
            src="/Nasna Logo.png"
            alt="Nasna logo"
            width="150px"
            height="100%"
            style={{ margin: "0px" }}
          />
        </Typography>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <IconButton
            onClick={() => {
              navigate("/about");
            }}
            color="inherit"
          >
            <FontAwesomeIcon icon={faInfo}  style={{color: "#0f0f0f",}} />
          </IconButton>
          <IconButton
            onClick={(event) => setAnchorEl(event.currentTarget)}
            color="inherit"
          >
            <FontAwesomeIcon icon={faLanguage}  style={{color: "#0f0f0f",}} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => handleLanguageChange("en")}>
              English
            </MenuItem>
            <MenuItem onClick={() => handleLanguageChange("ar")}>
              Arabic
            </MenuItem>
            <MenuItem onClick={() => handleLanguageChange("fr")}>
              French
            </MenuItem>
          </Menu>
        </div>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
