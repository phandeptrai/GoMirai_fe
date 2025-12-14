import { useNavigate } from 'react-router-dom';
import ProfileScreen from '../../components/ProfileScreen/ProfileScreen.jsx';
import { Icons } from '../../components/constants';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="profile-page-header">
        <button className="profile-page-back" onClick={() => navigate(-1)}>
          <Icons.ArrowLeft className="profile-page-back-icon" />
        </button>
        <h1 className="profile-page-title">Hồ sơ</h1>
        <div style={{ width: '40px' }}></div>
      </header>

      {/* Profile Content */}
      <div style={{ flex: 1, overflow: 'auto', background: '#ffffff' }}>
        <ProfileScreen />
      </div>
    </div>
  );
};

export default ProfilePage;

