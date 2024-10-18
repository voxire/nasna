import React from "react";
import Navbar from "./Navbar";
import SideBar from "./Sidebar";
import PropTypes from "prop-types";

function Admin(props) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

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
