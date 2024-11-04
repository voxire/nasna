import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import SideBar from "./Sidebar";
import PropTypes from "prop-types";
import { auth } from "../../firebase";
import { CircularProgress, Box } from "@mui/material";

function Admin(props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          const userRole = tokenResult.claims.role;

          if (userRole !== "admin") {
            navigate("/");
          } else {
            setUser(user);
            setRole(userRole);
          }
        } catch (error) {
          console.error("Error retrieving user role:", error);
          navigate("/");
        }
      } else {
        navigate("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user || role !== "admin") {
    return null;
  }

  return (
    <div className="Admincontainer">
      <Navbar openSidebar={openSidebar} />
      <div className="InnerContainer">{props.children}</div>
      <SideBar sidebarOpen={sidebarOpen} closeSidebar={closeSidebar} />
    </div>
  );
}

Admin.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Admin;
