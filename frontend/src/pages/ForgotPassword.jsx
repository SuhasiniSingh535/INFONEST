import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ForgotPassword.css';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const [loading, setLoading] = useState(false);
    const [showSuccessIcon, setShowSuccessIcon] = useState(false);
    const successTimeoutRef = useRef(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await axios.post(
                `https://infonest-backend.onrender.com/api/auth/forgot-password?email=${email}`
            );
            
            setMessageType('success');
            setMessage('Reset link sent successfully! Check your email.');
            setShowSuccessIcon(true);
            setEmail('');

            // Redirect to login after 3 seconds
            successTimeoutRef.current = setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            setMessageType('error');
            setMessage(error.response?.data?.message || 'Error sending reset link. Please try again.');
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
        <div className="forgot-password-page">
            <div className="forgot-password-container">
                <div className="forgot-password-card">
                    {/* Icon */}
                    {!showSuccessIcon ? (
                        <div className="forgot-password-icon">🔐</div>
                    ) : (
                        <div className="forgot-password-success-icon show">
                            <div className="success-checkmark"></div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="forgot-password-header">
                        <h1>Reset Your Password</h1>
                        <p>
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {/* Form */}
                    {!showSuccessIcon && (
                        <form onSubmit={handleSubmit} className="forgot-password-form">
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                className={`forgot-password-submit ${loading ? 'loading' : ''}`}
                                disabled={loading || !email}
                            >
                                <span>
                                    {loading && <span className="loading-spinner"></span>}
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </span>
                            </button>
                        </form>
                    )}

                    {/* Success Message */}
                    {showSuccessIcon && (
                        <div className="forgot-password-success-message">
                            <div className="forgot-password-form">
                                <p>Check your inbox for the reset link!</p>
                                <small>Redirecting to login in 3 seconds...</small>
                            </div>
                        </div>
                    )}

                    {/* Error/Info Message */}
                    {message && !showSuccessIcon && (
                        <div className={`forgot-password-message message-${messageType}`}>
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

export default ForgotPassword;