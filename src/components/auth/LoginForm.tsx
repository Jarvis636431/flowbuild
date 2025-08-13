import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthService } from '../../services/authService';
import './Auth.css';

interface LoginFormProps {
  onSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await AuthService.login({
        username: formData.username,
        password: formData.password,
      });
      onSuccess();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : '登录失败，请检查用户名和密码';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {/* Error Message */}
      {error && <div className="auth-error">{error}</div>}

      {/* Username Field */}
      <div className="auth-field">
        <label htmlFor="username" className="auth-label">
          用户名
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          required
          className="auth-input"
          placeholder="请输入用户名"
          disabled={isLoading}
        />
      </div>

      {/* Password Field */}
      <div className="auth-field">
        <label htmlFor="password" className="auth-label">
          密码
        </label>
        <div className="auth-password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className="auth-input auth-password-input"
            placeholder="请输入密码"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="auth-password-toggle"
            disabled={isLoading}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !formData.username || !formData.password}
        className="auth-submit-btn"
      >
        {isLoading ? (
          <>
            <Loader2 className="auth-loading-spinner" size={20} />
            登录中...
          </>
        ) : (
          '登录'
        )}
      </button>

      {/* Forgot Password Link */}
      <div className="auth-text-center">
        <button type="button" className="auth-link" disabled={isLoading}>
          忘记密码？
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
