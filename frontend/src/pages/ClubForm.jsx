import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, eventsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ClubForm.css';

const ClubForm = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [eventInfo, setEventInfo] = useState(null);
    const [customFields, setCustomFields] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        college: '',
        branch: '',
        year: '',
        phone: '',
        message: ''
    });
    // Dynamic links: array of {label, url}
    const [links, setLinks] = useState([]);
    // Custom field values
    const [customValues, setCustomValues] = useState({});
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const pending = sessionStorage.getItem('pendingRegistration');
        if (!pending) {
            setMessage({ type: 'error', text: 'No event selected. Please select an event first.' });
            setTimeout(() => navigate('/events'), 2000);
            return;
        }

        const pendingData = JSON.parse(pending);
        setEventInfo(pendingData);

        // Pre-fill name if available
        if (user?.firstName) {
            setFormData(prev => ({ ...prev, name: user.firstName + (user.lastName ? ' ' + user.lastName : '') }));
        }

        // Fetch event details to get custom fields
        if (pendingData.eventId) {
            fetchEventDetails(pendingData.eventId);
        }
    }, [user, navigate]);

    const fetchEventDetails = async (eventId) => {
        try {
            const res = await eventsAPI.getEventById(eventId);
            const event = res.data;
            if (event.customFormFields) {
                try {
                    const fields = JSON.parse(event.customFormFields);
                    if (Array.isArray(fields) && fields.length > 0) {
                        setCustomFields(fields);
                        // Initialize custom values
                        const initValues = {};
                        fields.forEach(f => { initValues[f.label] = ''; });
                        setCustomValues(initValues);
                    }
                } catch { }
            }
        } catch (err) {
            console.error('Error fetching event details:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomValueChange = (label, value) => {
        setCustomValues(prev => ({ ...prev, [label]: value }));
    };

    // Link management
    const addLink = () => {
        setLinks([...links, { label: '', url: '' }]);
    };

    const updateLink = (index, field, value) => {
        const updated = [...links];
        updated[index][field] = value;
        setLinks(updated);
    };

    const removeLink = (index) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Step 1: Create registration
            const registration = {
                userId: user.userId,
                eventId: eventInfo.eventId
            };
            const regResponse = await studentAPI.registerForEvent(registration);
            const regId = regResponse.data.regId;

            // Step 2: Build form data with all fields
            const fullFormData = {
                ...formData,
                ...customValues,
                links: links.filter(l => l.url.trim()) // Only include links with URLs
            };
            const formDataJson = JSON.stringify(fullFormData);
            await studentAPI.updateFormData(regId, formDataJson);

            sessionStorage.removeItem('pendingRegistration');
            setMessage({ type: 'success', text: 'Registration successful!' });

            setTimeout(() => {
                if (user?.role === 'ADMIN') navigate('/admin');
                else if (user?.role === 'FACULTY') navigate('/faculty');
                else navigate('/dashboard');
            }, 1500);

        } catch (error) {
            const errorMsg = error.response?.data?.error || error.response?.data || 'Registration failed. Please try again.';
            setMessage({ type: 'error', text: typeof errorMsg === 'string' ? errorMsg : 'Registration failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        sessionStorage.removeItem('pendingRegistration');
        navigate('/events');
    };

    return (
        <div className="club-form-page">
            <div className="club-form-container">
                <div className="club-form-card">
                    <h1>📝 Event Registration</h1>
                    {eventInfo && (
                        <p className="event-name">Registering for: <strong>{eventInfo.eventName}</strong></p>
                    )}
                    <p className="form-subtitle">Fill in your details to complete registration</p>

                    {message.text && (
                        <div className={`alert alert-${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="name">Full Name *</label>
                                <input
                                    type="text" id="name" name="name"
                                    value={formData.name} onChange={handleChange}
                                    placeholder="Your full name" required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="college">College/Department *</label>
                                <input
                                    type="text" id="college" name="college"
                                    value={formData.college} onChange={handleChange}
                                    placeholder="e.g., CSE" required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="branch">Branch/Major *</label>
                                <input
                                    type="text" id="branch" name="branch"
                                    value={formData.branch} onChange={handleChange}
                                    placeholder="e.g., Computer Science" required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="year">Year of Study *</label>
                                <select id="year" name="year" value={formData.year} onChange={handleChange} required>
                                    <option value="">Select Year</option>
                                    <option value="1st Year">1st Year</option>
                                    <option value="2nd Year">2nd Year</option>
                                    <option value="3rd Year">3rd Year</option>
                                    <option value="4th Year">4th Year</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone Number *</label>
                            <input
                                type="tel" id="phone" name="phone"
                                value={formData.phone} onChange={handleChange}
                                placeholder="Your contact number" required
                            />
                        </div>

                        {/* Dynamic Links Section */}
                        <div className="links-section">
                            <div className="links-header">
                                <label><i className="fa-solid fa-link" /> Add Links (Optional)</label>
                                <p className="links-note">Add your portfolio, GitHub, LinkedIn, or any relevant links</p>
                            </div>
                            {links.map((link, idx) => (
                                <div key={idx} className="link-input-row">
                                    <input
                                        type="text"
                                        value={link.label}
                                        onChange={e => updateLink(idx, 'label', e.target.value)}
                                        placeholder="Label (e.g., GitHub)"
                                        className="link-label-input"
                                    />
                                    <input
                                        type="url"
                                        value={link.url}
                                        onChange={e => updateLink(idx, 'url', e.target.value)}
                                        placeholder="https://..."
                                        className="link-url-input"
                                    />
                                    <button type="button" className="btn-remove-link" onClick={() => removeLink(idx)}>
                                        <i className="fa-solid fa-trash-can" />
                                    </button>
                                </div>
                            ))}
                            <button type="button" className="btn-add-link" onClick={addLink}>
                                <i className="fa-solid fa-plus" /> Add Link
                            </button>
                        </div>

                        {/* Custom Fields from Event */}
                        {customFields.length > 0 && (
                            <div className="custom-fields-section">
                                <h3><i className="fa-solid fa-list-check" /> Additional Information</h3>
                                {customFields.map((field, idx) => (
                                    <div className="form-group" key={idx}>
                                        <label>{field.label} {field.required && '*'}</label>
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                value={customValues[field.label] || ''}
                                                onChange={e => handleCustomValueChange(field.label, e.target.value)}
                                                rows={3}
                                                required={field.required}
                                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={customValues[field.label] || ''}
                                                onChange={e => handleCustomValueChange(field.label, e.target.value)}
                                                required={field.required}
                                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="message">Why do you want to participate? (Optional)</label>
                            <textarea
                                id="message" name="message"
                                value={formData.message} onChange={handleChange}
                                rows="3" placeholder="Tell us about your interest..."
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Registration'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                            Cancel
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ClubForm;
