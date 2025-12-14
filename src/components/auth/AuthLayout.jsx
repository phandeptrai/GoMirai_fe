import './auth.css';

const AuthLayout = ({ title, subtitle, children, footer }) => {
  return (
    <div className="auth-page">
      <header className="hero">
        <div className="hero-logo">▶</div>
        <div className="hero-text">
          <div className="hero-title">GoMirai</div>
          <div className="hero-sub">Di chuyển thông minh, trọn niềm vui</div>
        </div>
      </header>

      <main className="auth-card">
        <div className="auth-heading">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
      </main>

      {footer && <div className="auth-footer">{footer}</div>}
    </div>
  );
};

export default AuthLayout;

