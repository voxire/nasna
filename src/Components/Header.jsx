import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Button,
} from "@mui/material";
import { auth } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLanguage,
  faChartBar,
  faSignOut,
} from "@fortawesome/free-solid-svg-icons";
import { selectLanguage } from "../services/i18next";import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../redux/reducers/userSlice";

function Header({ dashboard = false }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

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

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) {
      selectLanguage(savedLanguage);
    }
  }, []);

  const handleLanguageChange = (lng) => {
    selectLanguage(lng);
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      auth.signOut().then(() => {
        dispatch(logout());
        navigate("/auth/login");
      });
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
          onClick={() => navigate("/")}
        >
          <img
            src="/Nasna Logo.png"
            alt="Nasna logo"
            width="140px"
            height="100%"
            style={{ margin: "0px", cursor: "pointer" }}
          />
        </Typography>

        {/* Show panel button if user is logged in */}
        {user && (
          <>
            {/* {role === "admin" ? (
              <Button
                color="inherit"
                onClick={() => navigate("/manage")}
                startIcon={<FontAwesomeIcon icon={faUserShield} />}
              >
                Admin Panel
              </Button>
            ) : (
              <Button
                color="inherit"
                onClick={() => navigate("/ngo/submissions")}
                startIcon={<FontAwesomeIcon icon={faChartBar} />}
              >
                Dashboard
              </Button>
            )} */}
            {!dashboard && (
              <IconButton
                color="inherit"
                onClick={() => {
                  if (role === "admin") navigate("/manage");
                  else navigate("/ngo/submissions");
                }}
              >
                <FontAwesomeIcon icon={faChartBar} />
              </IconButton>
            )}
            <IconButton
              color="inherit"
              onClick={() => {
                handleLogout();
              }}
            >
              <FontAwesomeIcon icon={faSignOut} />
            </IconButton>
          </>
        )}

        {/* Always show language selector */}
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
          <MenuItem onClick={() => handleLanguageChange("ar")}>Arabic</MenuItem>
          <MenuItem onClick={() => handleLanguageChange("fr")}>French</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
