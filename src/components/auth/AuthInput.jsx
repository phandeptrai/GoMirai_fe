import './auth.css';

const AuthInput = ({ label, placeholder, type = 'text', icon: Icon, value, onChange, name, error }) => {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <div className={`field-box ${error ? 'field-box-error' : ''}`}>
        {Icon && (
          <div className="field-icon">
            <Icon />
          </div>
        )}
        <input
          className="field-input"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          name={name}
        />
      </div>
      {error && <span className="field-error">{error}</span>}
    </label>
  );
};

export default AuthInput;









