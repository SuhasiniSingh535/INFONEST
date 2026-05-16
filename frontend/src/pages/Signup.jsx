import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Auth.css';

/* ── Allowed email domains (must match backend) ── */
const ALLOWED_DOMAINS = ['@banasthali.in', '@gmail.com'];

const Signup = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'STUDENT',
        clubId: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const [otp, setOtp] = useState('');
    const [showOtpField, setShowOtpField] = useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    /* ── Client-side validation (mirrors backend rules) ── */
    const validateForm = () => {
        // First & last name
        if (!formData.firstName.trim()) return 'First name is required!';
        if (!formData.lastName.trim()) return 'Last name is required!';

        // Email domain
        const email = formData.email.trim().toLowerCase();
        if (!email) return 'Email is required!';
        const domainOk = ALLOWED_DOMAINS.some(d => email.endsWith(d));
        if (!domainOk) return 'Only @banasthali.in or @gmail.com emails are allowed!';

        // Password strength
        const pw = formData.password;
        if (!pw) return 'Password is required!';
        if (pw.length < 8) return 'Password must be at least 8 characters long!';
        if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter!';
        if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(pw))
            return 'Password must contain at least one special character (!@#$%^&* etc.)!';

        // Confirm match
        if (pw !== formData.confirmPassword) return 'Passwords do not match!';

        return null; // all good
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post('https://infonest-backend.onrender.com/api/v1/auth/signup', formData);
            if (res.data === "OTP_SENT") {
                setShowOtpField(true);
                setSuccess('OTP sent to your email! Please verify.');
            }
        } catch (err) {
            const msg = err.response?.data;
            // Backend may return a validation object or a string
            if (typeof msg === 'object' && msg !== null) {
                // Join all field errors
                const messages = Object.values(msg).flat().join('. ');
                setError(messages || 'Signup failed. Please check your inputs.');
            } else {
                setError(msg || 'Error sending verification code. Please try again.');
            }
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!otp.trim() || otp.trim().length !== 6) {
            setError('Please enter a valid 6-digit OTP.');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post('https://infonest-backend.onrender.com/api/v1/auth/verify-otp', {
                email: formData.email,
                otp: otp
            });

            if (res.data === "ACCOUNT_CREATED_SUCCESSFULLY") {
                setSuccess('Account created successfully! Redirecting to login...');
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            const msg = err.response?.data;
            if (typeof msg === 'string' && msg.includes('Error:')) {
                setError(msg.replace('Error: ', ''));
            } else {
                setError(msg || 'Invalid OTP. Please try again.');
            }
        }
        setLoading(false);
    };

    /* ── Live password-strength indicator ── */
    const pw = formData.password;
    const pwChecks = [
        { label: 'Min 8 characters', ok: pw.length >= 8 },
        { label: '1 uppercase letter', ok: /[A-Z]/.test(pw) },
        { label: '1 special character', ok: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(pw) },
    ];

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="logo">
                    <h1>{showOtpField ? 'Verify Your Email' : 'Create your account to get started'}</h1>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {!showOtpField ? (
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="John"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lastName">Last Name</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@banasthali.in or @gmail.com"
                                required
                            />
                            <p className="password-hint">Only @banasthali.in or @gmail.com emails allowed</p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="role">Role</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                            >
                                <option value="STUDENT">Student</option>
                                <option value="FACULTY">Faculty / Club Official</option>
                                <option value="OFFICE">Office</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Min 8 chars, 1 uppercase, 1 special"
                                    required
                                />
                                <button
                                    type="button"
                                    className="eye-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ fontSize: '0.7rem', fontWeight: 'bold' }}
                                >
                                    {showPassword ? 'HIDE' : 'SHOW'}
                                </button>
                            </div>
                            {/* Live password checklist */}
                            {pw.length > 0 && (
                                <ul className="pw-checklist">
                                    {pwChecks.map((c, i) => (
                                        <li key={i} className={c.ok ? 'pw-ok' : 'pw-fail'}>
                                            {c.ok ? '✓' : '✗'} {c.label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {pw.length === 0 && (
                                <p className="password-hint">Min 8 characters, 1 uppercase, 1 special character</p>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Re-enter password"
                                required
                            />
                            {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
                                <p className="pw-mismatch">⚠ Passwords do not match</p>
                            )}
                            {formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword && (
                                <p className="pw-match">✓ Passwords match</p>
                            )}
                        </div>

                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? 'Processing...' : 'Get Verification Code'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp}>
                        <div className="form-group">
                            <label htmlFor="otp">Enter 6-Digit OTP</label>
                            <input
                                type="text"
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                required
                            />
                            <p className="password-hint">Check your email for the code</p>
                        </div>

                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify & Create Account'}
                        </button>

                        <button
                            type="button"
                            className="btn-link"
                            onClick={() => setShowOtpField(false)}
                            style={{ marginTop: '15px', width: '100%', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
                        >
                            Back to Signup Details
                        </button>
                    </form>
                )}

                <div className="divider">
                    <span>or</span>
                </div>

                <div className="links">
                    <p>Already have an account? <Link to="/login">Sign In</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
