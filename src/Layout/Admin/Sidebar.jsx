import { useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
  faHome,
  faList,
  faBell,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";

const SideBar = ({ sidebarOpen, closeSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className={`sidebar ${sidebarOpen ? "sidebar-responsive" : ""}`}>
      <div className="sidebar__nav">
        <div className="sidebar__title__container">
          <img
            src="/Nasna Logo.png"
            alt="Nasna logo"
            width="130px"
            height="100%"
            style={{
              margin: "0px",
              cursor: "pointer",
              marginBottom: 20,
            }}
          />
        </div>
        <FontAwesomeIcon
          className="close__icon"
          onClick={closeSidebar}
          icon={faClose}
          size="lg"
        />
      </div>
      <div className="sidebar__menu">
        <div
          className={`sidebar__link ${
            location.pathname === "/manage" ? "active" : ""
          }`}
          onClick={() => handleNavigation("/manage")}
        >
          <FontAwesomeIcon icon={faHome} className="sidebar__icon" />
          <p id="link">Home</p>
        </div>

        <div
          className={`sidebar__link ${
            location.pathname === "/manage/submissions" ? "active" : ""
          }`}
          onClick={() => handleNavigation("/manage/submissions")}
        >
          <FontAwesomeIcon icon={faList} className="sidebar__icon" />
          <p id="link">Submissions</p>
        </div>
        <div
          className={`sidebar__link ${
            location.pathname === "/manage/ngo" ? "active" : ""
          }`}
          onClick={() => handleNavigation("/manage/ngo")}
        >
          <FontAwesomeIcon icon={faBell} className="sidebar__icon" />
          <p id="link">NGO/Initiative</p>
        </div>
        <div
          className={`sidebar__link ${
            location.pathname === "/manage/agents" ? "active" : ""
          }`}
          onClick={() => handleNavigation("/manage/agents")}
        >
          <FontAwesomeIcon icon={faUserPlus} className="sidebar__icon" />
          <p id="link">Agents</p>
        </div>
      </div>
    </div>
  );
};

SideBar.propTypes = {
  sidebarOpen: PropTypes.bool.isRequired,
  closeSidebar: PropTypes.func.isRequired,
};

export default SideBar;
