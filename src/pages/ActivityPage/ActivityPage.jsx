import { useNavigate, useLocation } from 'react-router-dom';
import { SearchIcon } from '../../components/auth/icons';
import ActivityScreen from '../../components/ActivityScreen';
import { Icons } from '../../components/constants';
import '../HomePage/HomePage.css';

const ActivityPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Icons.Home, label: 'Trang chủ', path: '/home' },
    { icon: Icons.QuestionMark, label: 'Thanh toán', path: '/payment' },
    { icon: Icons.Clock, label: 'Hoạt động', path: '/activity' },
    { icon: Icons.Bell, label: 'Thông báo', path: '/notifications' },
  ];

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="header-logo">
          <div className="logo-icon">▶</div>
          <span className="logo-text">GoMirai</span>
        </div>
        <div className="header-search" onClick={() => navigate('/home')}>
          <span className="search-icon">
            <SearchIcon />
          </span>
          <input type="text" placeholder="Tìm kiếm địa điểm..." className="search-input" readOnly />
        </div>
        <div className="header-avatar" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          <div className="avatar-circle">
            <span>👤</span>
          </div>
          <div className="avatar-dot"></div>
        </div>
      </header>

      {/* Activity Content */}
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: '70px', background: '#ffffff' }}>
        <div style={{ padding: '20px 16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '20px', marginLeft: '4px' }}>
            Hoạt động gần đây
          </h2>
          <ActivityScreen />
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const IconComponent = item.icon;
          return (
            <button
              key={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">
                <IconComponent className={isActive ? 'text-[#0BA360]' : 'text-[#9aa4b5]'} />
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default ActivityPage;

