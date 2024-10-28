import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import SideBar from "./Sidebar";
import PropTypes from "prop-types";
import { auth } from "../../firebase";

function Admin(props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);

      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          setRole(tokenResult.claims.role);

          if (tokenResult.claims.role !== "admin") {
            navigate("/");
          }
        } catch (error) {
          console.error("Error retrieving user role:", error);
          navigate("/");
        }
      } else {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

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
