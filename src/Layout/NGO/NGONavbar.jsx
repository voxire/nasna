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
import { auth } from "../../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import { selectLanguage } from "../../services/i18next";
import { useNavigate } from "react-router-dom";

function Header() {
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
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

  const handleClickAbout = () => {
    window.location.href = "/";
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      console.log("User logged out successfully");
      // Optionally, you can navigate to the login page after logout
      navigate("/auth/login");
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: "#f9f9f9",
        color: "#12a89d",
      }}
    >
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
            width="140px"
            height="100%"
            style={{ margin: "0px", cursor: "pointer" }}
            onClick={handleClickAbout}
          />
        </Typography>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {user && (
            <Button
              color="inherit"
              onClick={handleLogout}
              sx={{ marginLeft: "10px" }}
            >
              Logout
            </Button>
          )}
          <IconButton
            onClick={(event) => setAnchorEl(event.currentTarget)}
            color="inherit"
          >
            <FontAwesomeIcon icon={faLanguage} style={{ color: "#12a89d" }} />
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
