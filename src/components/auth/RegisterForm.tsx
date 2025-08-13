import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthService } from '../../services/authService';
import './Auth.css';

interface RegisterFormProps {
  onSuccess: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }
    if (formData.password.length < 6) {
      setError('密码长度至少为6位');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await AuthService.register({
        username: formData.username,
        password: formData.password,
      });
      onSuccess();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : '注册失败，请稍后重试';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    formData.username && formData.password && formData.confirmPassword;

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
            placeholder="请输入密码（至少6位）"
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

      {/* Confirm Password Field */}
      <div className="auth-field">
        <label htmlFor="confirmPassword" className="auth-label">
          确认密码
        </label>
        <div className="auth-password-container">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            className="auth-input auth-password-input"
            placeholder="请再次输入密码"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="auth-password-toggle"
            disabled={isLoading}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !isFormValid}
        className="auth-submit-btn"
      >
        {isLoading ? (
          <>
            <Loader2 className="auth-loading-spinner" size={20} />
            注册中...
          </>
        ) : (
          '注册'
        )}
      </button>

      {/* Terms and Conditions */}
      <div className="auth-terms">
        注册即表示您同意我们的
        <button type="button" className="auth-link" disabled={isLoading}>
          服务条款
        </button>
        和
        <button type="button" className="auth-link" disabled={isLoading}>
          隐私政策
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;
