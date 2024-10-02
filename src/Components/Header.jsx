import React, { useState, useEffect} from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";

import { auth } from "../firebase";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOut, faHome, faPlus } from "@fortawesome/free-solid-svg-icons";

function Header() {
  const [user, setUser] = useState(null);
  const isMobile = false;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const notify = () => toast("Logged out!", { type: "success" });

  return (
    <AppBar position="static">
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
          />{" "}
          [App Name]
        </Typography>
        {user && (
          <div style={{ display: "flex", gap: "10px" }}>
            {window.location.pathname !== "/" && (
              <Button
                color="secondary"
                href="/"
                variant="contained"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {isMobile ? null : "Home"}
                <FontAwesomeIcon icon={faHome} />
              </Button>
            )}
            {window.location.pathname !== "/add-member" && (
              <Button
                color="secondary"
                href="/add-member"
                variant="contained"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {isMobile ? null : "Add Member"}
                <FontAwesomeIcon icon={faPlus} />
              </Button>
            )}
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                notify();
                auth.signOut();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {isMobile ? null : "Logout"}
              <FontAwesomeIcon icon={faSignOut} />
            </Button>
          </div>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Header;
