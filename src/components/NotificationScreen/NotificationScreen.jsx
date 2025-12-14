import { Icons } from '../constants';
import './NotificationScreen.css';

const NotificationScreen = () => {
  const notifications = [
    {
      id: 1,
      icon: Icons.Plus,
      iconBg: 'orange',
      title: 'Khuyến mãi 50% hôm nay!',
      description: 'Nhập mã RIDE50 để được giảm giá cho 2 chuyến đi tiếp theo của bạn. Hạn dùng 24h.',
      time: '1 giờ trước',
      unread: true,
    },
    {
      id: 2,
      icon: Icons.Building,
      iconBg: 'green',
      title: 'Đã hoàn thành chuyến đi',
      description: 'Cảm ơn bạn đã sử dụng dịch vụ. Hãy đánh giá tài xế ngay nhé.',
      time: 'Hôm qua',
      unread: false,
    },
  ];

  return (
    <div className="notification-list">
      {notifications.map((notification) => {
        const IconComponent = notification.icon;
        return (
          <div key={notification.id} className="notification-card">
            {notification.unread && <div className="notification-dot"></div>}
            <div className="notification-content">
              <div className={`notification-icon notification-icon-${notification.iconBg}`}>
                <IconComponent className="notification-icon-svg" />
              </div>
              <div className="notification-text">
                <h4 className="notification-title">{notification.title}</h4>
                <p className="notification-description">{notification.description}</p>
                <div className="notification-time">{notification.time}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationScreen;

