import { useLocation, useNavigate } from 'react-router-dom';
import { X, Home, List, Bell, UserPlus } from 'lucide-react';

interface SideBarProps {
  sidebarOpen: boolean;
  closeSidebar: () => void;
}

const SideBar = ({ sidebarOpen, closeSidebar }: SideBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className={`sidebar ${sidebarOpen ? 'sidebar-responsive' : ''}`}>
      <div className="sidebar__nav">
        <div className="sidebar__title__container">
          <img
            src="/Nasna Logo.png"
            alt="Nasna logo"
            width="130px"
            height="100%"
            style={{ margin: '0px', cursor: 'pointer', marginBottom: 20 }}
          />
        </div>
        <X className="close__icon cursor-pointer" onClick={closeSidebar} size={24} />
      </div>
      <div className="sidebar__menu">
        <div
          className={`sidebar__link ${location.pathname === '/manage' ? 'active' : ''}`}
          onClick={() => handleNavigation('/manage')}
        >
          <Home className="sidebar__icon" size={18} />
          <p id="link">Home</p>
        </div>

        <div
          className={`sidebar__link ${location.pathname === '/manage/submissions' ? 'active' : ''}`}
          onClick={() => handleNavigation('/manage/submissions')}
        >
          <List className="sidebar__icon" size={18} />
          <p id="link">Submissions</p>
        </div>
        <div
          className={`sidebar__link ${location.pathname === '/manage/ngo' ? 'active' : ''}`}
          onClick={() => handleNavigation('/manage/ngo')}
        >
          <Bell className="sidebar__icon" size={18} />
          <p id="link">NGO/Initiative</p>
        </div>
        <div
          className={`sidebar__link ${location.pathname === '/manage/agents' ? 'active' : ''}`}
          onClick={() => handleNavigation('/manage/agents')}
        >
          <UserPlus className="sidebar__icon" size={18} />
          <p id="link">Agents</p>
        </div>
      </div>
    </div>
  );
};

export default SideBar;
