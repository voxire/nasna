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
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOut, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { selectLanguage } from "../services/i18next";

function Header() {
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const isMobile = false;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const notify = () => toast("Logged out!", { type: "success" });

  const handleLanguageChange = (lng) => {
    selectLanguage(lng);
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
            src="/logo.png"
            alt="gym logo"
            width="35px"
            height="35px"
            style={{ marginRight: "10px", filter: "invert(1)" }}
          />
          Nasna
        </Typography>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <IconButton
            onClick={(event) => setAnchorEl(event.currentTarget)}
            color="inherit"
          >
            <FontAwesomeIcon icon={faGlobe} />
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
