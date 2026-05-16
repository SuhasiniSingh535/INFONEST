import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ResetPassword.css';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const [loading, setLoading] = useState(false);
    const [showSuccessIcon, setShowSuccessIcon] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const successTimeoutRef = useRef(null);

    // Calculate password strength
    const calculateStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength = 25;
        if (password.length >= 12) strength = 50;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;
        return Math.min(strength, 100);
    };

    const handlePasswordChange = (e) => {
        const password = e.target.value;
        setNewPassword(password);
        setPasswordStrength(calculateStrength(password));
    };

    const handleReset = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            setMessageType('error');
            setMessage('Passwords do not match!');
            return;
        }

        if (newPassword.length < 8) {
            setMessageType('error');
            setMessage('Password must be at least 8 characters long!');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            await axios.post('https://infonest-backend.onrender.com/api/auth/reset-password', {
                token: token,
                newPassword: newPassword
            });
            
            setMessageType('success');
            setMessage('Password updated successfully!');
            setShowSuccessIcon(true);
            setNewPassword('');
            setConfirmPassword('');

            // Redirect to login after 3 seconds
            successTimeoutRef.current = setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            setMessageType('error');
            setMessage(error.response?.data?.message || 'Failed to reset password. Please try again.');
            setShowSuccessIcon(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (successTimeoutRef.current) {
                clearTimeout(successTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="reset-password-page">
            <div className="reset-password-container">
                <div className="reset-password-card">
                    {/* Icon */}
                    {!showSuccessIcon ? (
                        <div className="reset-password-icon">🔑</div>
                    ) : (
                        <div className="reset-password-success-icon show">
                            <div className="success-checkmark"></div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="reset-password-header">
                        <h1>Create New Password</h1>
                        <p>
                            Enter a strong password to secure your account. Use a mix of uppercase, lowercase, numbers, and symbols.
                        </p>
                    </div>

                    {/* Form */}
                    {!showSuccessIcon && (
                        <form onSubmit={handleReset} className="reset-password-form">
                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    disabled={loading}
                                />
                                <div className="password-strength">
                                    <div 
                                        className="password-strength-bar" 
                                        style={{ width: `${passwordStrength}%` }}
                                    ></div>
                                </div>
                                <div className="password-strength-text">
                                    Strength: {passwordStrength < 50 ? 'Weak' : passwordStrength < 80 ? 'Fair' : 'Strong'}
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                className={`reset-password-submit ${loading ? 'loading' : ''}`}
                                disabled={loading || !newPassword || !confirmPassword}
                            >
                                <span>
                                    {loading && <span className="loading-spinner"></span>}
                                    {loading ? 'Updating...' : 'Update Password'}
                                </span>
                            </button>
                        </form>
                    )}

                    {/* Success Message */}
                    {showSuccessIcon && (
                        <div className="reset-password-success-message">
                            <p>Your password has been reset successfully!</p>
                            <small>Redirecting to login in 3 seconds...</small>
                        </div>
                    )}

                    {/* Error/Info Message */}
                    {message && !showSuccessIcon && (
                        <div className={`reset-password-message message-${messageType}`}>
                            {message}
                        </div>
                    )}

                    {/* Back Link */}
                    <div className="back-link">
                        <a href="/login">← Back to Login</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;