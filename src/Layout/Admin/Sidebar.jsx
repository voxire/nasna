import { useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
  faHome,
  faBuildingNgo,
  faList,
  faBell,
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
          <p className="sidebar__title">Meow in Meows</p>
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
            location.pathname === "/manage/requests" ? "active" : ""
          }`}
          onClick={() => handleNavigation("/manage/requests")}
        >
          <FontAwesomeIcon icon={faBell} className="sidebar__icon" />
          <p id="link">NGO Requests</p>
        </div>
        <div
          className={`sidebar__link ${
            location.pathname === "/manage/settings" ? "active" : ""
          }`}
          onClick={() => handleNavigation("/manage/settings")}
        >
          <FontAwesomeIcon icon={faBuildingNgo} className="sidebar__icon" />
          <p id="link">Active NGOS</p>
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
