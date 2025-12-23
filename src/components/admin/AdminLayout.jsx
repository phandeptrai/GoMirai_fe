import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLayout.css';

const AdminLayout = ({ children, title, subtitle }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    const [pendingCount] = useState(0); // TODO: Get from API

    const menuItems = [
        {
            path: '/admin/dashboard',
            label: 'Tổng quan',
            icon: '📊',
            matchPaths: ['/admin/dashboard']
        },
        {
            path: '/admin/users',
            label: 'Quản lý người dùng',
            icon: '👥',
            matchPaths: ['/admin/users']
        },
        {
            path: '/admin/drivers?status=PENDING_VERIFICATION',
            label: 'Duyệt tài xế',
            icon: '👤',
            badge: pendingCount,
            matchPaths: ['/admin/drivers'],
            checkQuery: 'status=PENDING_VERIFICATION'
        },
        {
            path: '/admin/drivers',
            label: 'Quản lý tài xế',
            icon: '🚗',
            matchPaths: ['/admin/drivers'],
            excludeQuery: 'status=PENDING_VERIFICATION'
        },
        {
            path: '/admin/pricing',
            label: 'Cấu hình giá cước',
            icon: '💰',
            matchPaths: ['/admin/pricing']
        },
    ];

    const isActive = (item) => {
        const currentPath = location.pathname;
        const currentQuery = location.search;

        if (!item.matchPaths.includes(currentPath)) return false;

        if (item.checkQuery && !currentQuery.includes(item.checkQuery)) return false;
        if (item.excludeQuery && currentQuery.includes(item.excludeQuery)) return false;

        return true;
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                {/* Logo */}
                <div className="admin-logo">
                    <div className="logo-icon">🚖</div>
                    <div className="logo-text">
                        <div className="logo-title">RideGo Admin</div>
                        <div className="logo-subtitle">Hệ thống quản trị</div>
                    </div>
                </div>

                {/* Menu */}
                <nav className="admin-menu">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`menu-item ${isActive(item) ? 'active' : ''}`}
                        >
                            <span className="menu-icon">{item.icon}</span>
                            <span className="menu-label">{item.label}</span>
                            {item.badge > 0 && <span className="menu-badge">{item.badge}</span>}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                {/* Top Bar */}
                <header className="admin-header">
                    <div className="header-content">
                        <div className="header-info">
                            {title && <h1 className="header-title">{title}</h1>}
                            {subtitle && <p className="header-subtitle">{subtitle}</p>}
                        </div>
                        <button onClick={logout} className="logout-btn">
                            Đăng xuất
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="admin-content">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
