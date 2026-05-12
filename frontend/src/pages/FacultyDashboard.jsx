import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { facultyAPI, studentAPI, eventsAPI, venueAPI } from '../services/api';
import MyBookingsCalendar from '../components/MyBookingsCalendar';
import EventFlipCard from '../components/EventFlipCard';
import './FacultyDashboard.css';
import '../components/EventFlipCard.css';

const FacultyDashboard = () => {
    const { user, logout } = useAuth();
    const [club, setClub] = useState(null);
    const [events, setEvents] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [myRegistrations, setMyRegistrations] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('events');
    const [message, setMessage] = useState({ type: '', text: '' });

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingSubmission, setViewingSubmission] = useState(null);
    const [viewingEvent, setViewingEvent] = useState(null);
    const [editingEvent, setEditingEvent] = useState(null);
    const [searchEventName, setSearchEventName] = useState('');

    const [eventForm, setEventForm] = useState({
        eventName: '', description: '', venueId: '',
        eventDate: '', eventTime: '', deadline: '', registrationFormLink: '',
        eventType: 'NON_RECRUITMENT', customFormFields: '[]'
    });

    // Custom form fields state for the builder
    const [customFields, setCustomFields] = useState([]);

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [clubRes, eventsRes, allEventsRes] = await Promise.all([
                facultyAPI.getMyClub(),
                facultyAPI.getMyEvents(),
                eventsAPI.getAllEvents()
            ]);
            setClub(clubRes.data);
            setEvents(eventsRes.data);
            setAllEvents(allEventsRes.data);

            if (clubRes.data?.clubId) {
                const subsRes = await facultyAPI.getSubmissions(clubRes.data.clubId);
                setSubmissions(subsRes.data);
            }

            if (user?.userId) {
                const regsRes = await studentAPI.getMyRegistrations(user.userId);
                setMyRegistrations(regsRes.data);
            }
        } catch (err) {
            console.error('Error fetching club/events:', err);
        }

        // Fetch venue bookings independently
        try {
            const bookingsRes = await venueAPI.getMyBookings();
            setMyBookings(bookingsRes.data);
        } catch (e) {
            console.error('Error fetching bookings:', e);
        }

        setLoading(false);
    };

    const resetForm = () => {
        setEventForm({
            eventName: '', description: '', venueId: '',
            eventDate: '', eventTime: '', deadline: '', registrationFormLink: '',
            eventType: 'NON_RECRUITMENT', customFormFields: '[]'
        });
        setCustomFields([]);
        setEditingEvent(null);
    };

    // ─── Custom Fields Builder ───
    const addCustomField = () => {
        setCustomFields([...customFields, { label: '', type: 'text', required: false }]);
    };

    const updateCustomField = (index, key, value) => {
        const updated = [...customFields];
        updated[index][key] = value;
        setCustomFields(updated);
    };

    const removeCustomField = (index) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    // Sync custom fields to eventForm
    useEffect(() => {
        setEventForm(prev => ({ ...prev, customFormFields: JSON.stringify(customFields) }));
    }, [customFields]);

    // Handle event type change
    const handleEventTypeChange = (type) => {
        setEventForm(prev => ({
            ...prev,
            eventType: type,
            registrationFormLink: type === 'RECRUITMENT' ? 'club_form_link' : prev.registrationFormLink
        }));
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...eventForm, clubId: club.clubId };
            if (payload.eventType === 'RECRUITMENT') {
                payload.registrationFormLink = 'club_form_link';
            }
            await facultyAPI.addEvent(payload);
            setMessage({ type: 'success', text: 'Event added successfully!' });
            setShowAddModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data || 'Failed to add event' });
        }
    };

    const fetchEventForUpdate = async () => {
        if (!searchEventName.trim()) return;
        try {
            const res = await facultyAPI.getEventDetails(club.clubId, searchEventName);
            setEditingEvent(res.data);
            const existingCustomFields = res.data.customFormFields ? JSON.parse(res.data.customFormFields) : [];
            setCustomFields(existingCustomFields);
            setEventForm({
                eventName: res.data.eventName || '',
                description: res.data.description || '',
                venueId: res.data.venueId || '',
                eventDate: res.data.eventDate || '',
                eventTime: res.data.eventTime || '',
                deadline: res.data.deadline || '',
                registrationFormLink: res.data.registrationFormLink || '',
                eventType: res.data.eventType || 'NON_RECRUITMENT',
                customFormFields: res.data.customFormFields || '[]'
            });
            setMessage({ type: '', text: '' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Event not found' });
        }
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        if (!editingEvent) return;
        try {
            const payload = { ...eventForm };
            if (payload.eventType === 'RECRUITMENT') {
                payload.registrationFormLink = 'club_form_link';
            }
            await facultyAPI.updateEvent(editingEvent.eventId, payload);
            setMessage({ type: 'success', text: 'Event updated!' });
            setShowUpdateModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data || 'Failed to update' });
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!confirm('Delete this event?')) return;
        try {
            await facultyAPI.deleteEvent(eventId);
            setMessage({ type: 'success', text: 'Event deleted!' });
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data || 'Failed to delete' });
        }
    };

    const handleStatusUpdate = async (regId, status) => {
        try {
            await facultyAPI.updateRegistrationStatus(regId, status);
            setMessage({ type: 'success', text: `Status updated!` });
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data || 'Failed to update' });
        }
    };

    const updateClubDescription = async () => {
        const desc = document.getElementById('clubDescription').value;
        try {
            await facultyAPI.updateClubDescription(desc);
            setMessage({ type: 'success', text: 'Description saved!' });
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data || 'Failed to save' });
        }
    };

    const getEventName = (eventId) => {
        const event = allEvents.find(e => e.eventId === eventId);
        return event?.eventName || `Event #${eventId}`;
    };

    const getEventForSubmission = (eventId) => {
        return allEvents.find(e => e.eventId === eventId);
    };

    const parseFormData = (formData) => {
        if (!formData) return null;
        try {
            return JSON.parse(formData);
        } catch {
            return null;
        }
    };

    const openViewModal = (submission) => {
        setViewingSubmission(submission);
        const event = getEventForSubmission(submission.eventId);
        setViewingEvent(event);
        setShowViewModal(true);
    };

    const handleStatusFromModal = async (status) => {
        if (!viewingSubmission) return;
        await handleStatusUpdate(viewingSubmission.regId, status);
        setShowViewModal(false);
        setViewingSubmission(null);
        setViewingEvent(null);
    };

    const showTab = (tabName) => {
        setActiveTab(tabName);
        if (tabName === 'submissions' || tabName === 'bookings') fetchData();
    };

    const handleCancelBooking = async (bookingId) => {
        if (!confirm('Cancel this booking?')) return;
        try {
            await venueAPI.cancelBooking(bookingId);
            setMessage({ type: 'success', text: 'Booking cancelled!' }); fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data || 'Failed to cancel' });
        }
    };

    // Get status badge styling
    const getStatusClass = (status) => {
        switch (status) {
            case 'APPLIED': return 'status-applied';
            case 'SHORTLISTED': return 'status-shortlisted';
            case 'SELECTED': return 'status-selected';
            case 'APPROVED': return 'status-approved';
            case 'REJECTED': return 'status-rejected';
            default: return '';
        }
    };

    // Render the event form fields (shared between add and update modals)
    const renderEventFormFields = () => (
        <>
            <div className="form-group">
                <label>Event Name *</label>
                <input value={eventForm.eventName} onChange={e => setEventForm({ ...eventForm, eventName: e.target.value })} required />
            </div>
            <div className="form-group">
                <label>Description</label>
                <textarea value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} rows={3} />
            </div>

            {/* Event Type Toggle */}
            <div className="form-group">
                <label><i className="fa-solid fa-tag" /> Event Type *</label>
                <div className="event-type-toggle">
                    <button
                        type="button"
                        className={`toggle-btn ${eventForm.eventType === 'NON_RECRUITMENT' ? 'active' : ''}`}
                        onClick={() => handleEventTypeChange('NON_RECRUITMENT')}
                    >
                        <i className="fa-solid fa-calendar-days" /> Non-Recruitment
                    </button>
                    <button
                        type="button"
                        className={`toggle-btn ${eventForm.eventType === 'RECRUITMENT' ? 'active recruitment' : ''}`}
                        onClick={() => handleEventTypeChange('RECRUITMENT')}
                    >
                        <i className="fa-solid fa-user-plus" /> Recruitment
                    </button>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Event Date</label>
                    <input type="date" value={eventForm.eventDate} onChange={e => setEventForm({ ...eventForm, eventDate: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Event Time</label>
                    <input type="time" value={eventForm.eventTime} onChange={e => setEventForm({ ...eventForm, eventTime: e.target.value })} />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Venue ID</label>
                    <input value={eventForm.venueId} onChange={e => setEventForm({ ...eventForm, venueId: e.target.value })} placeholder="e.g., HALL_A" />
                </div>
                <div className="form-group">
                    <label>Registration Deadline</label>
                    <input type="date" value={eventForm.deadline} onChange={e => setEventForm({ ...eventForm, deadline: e.target.value })} />
                </div>
            </div>

            {/* Registration Link — disabled for RECRUITMENT */}
            <div className="form-group">
                <label>
                    <i className="fa-solid fa-link" /> Registration Link
                    {eventForm.eventType === 'RECRUITMENT' && (
                        <span className="field-note"> (Auto: Internal Form)</span>
                    )}
                </label>
                <input
                    value={eventForm.eventType === 'RECRUITMENT' ? 'Internal Form (Automatic)' : eventForm.registrationFormLink}
                    onChange={e => setEventForm({ ...eventForm, registrationFormLink: e.target.value })}
                    placeholder="URL or leave blank for internal form"
                    disabled={eventForm.eventType === 'RECRUITMENT'}
                    style={eventForm.eventType === 'RECRUITMENT' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                />
            </div>

            {/* Custom Form Fields Builder — only for RECRUITMENT */}
            {eventForm.eventType === 'RECRUITMENT' && (
                <div className="custom-fields-builder">
                    <div className="builder-header">
                        <h4><i className="fa-solid fa-list-check" /> Custom Form Fields</h4>
                        <p className="builder-note">Add extra fields students will fill during registration</p>
                    </div>
                    {customFields.map((field, idx) => (
                        <div key={idx} className="custom-field-row">
                            <input
                                className="field-label-input"
                                value={field.label}
                                onChange={e => updateCustomField(idx, 'label', e.target.value)}
                                placeholder={`Field #${idx + 1} label (e.g., "Technical Skills")`}
                            />
                            <select
                                value={field.type}
                                onChange={e => updateCustomField(idx, 'type', e.target.value)}
                                className="field-type-select"
                            >
                                <option value="text">Text</option>
                                <option value="textarea">Long Text</option>
                                <option value="select">Dropdown</option>
                            </select>
                            <label className="field-required-label">
                                <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={e => updateCustomField(idx, 'required', e.target.checked)}
                                />
                                Required
                            </label>
                            <button type="button" className="btn-remove-field" onClick={() => removeCustomField(idx)}>
                                <i className="fa-solid fa-trash-can" />
                            </button>
                        </div>
                    ))}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addCustomField}>
                        <i className="fa-solid fa-plus" /> Add Field
                    </button>
                </div>
            )}
        </>
    );

    if (loading) {
        return <div className="faculty-dashboard"><div className="loading-container"><div className="loader"></div></div></div>;
    }

    return (
        <div className="faculty-dashboard page-container">
            <header className="dashboard-header card">
                <div className="header-info">
                    <h1><i className="fa-solid fa-chalkboard-user" style={{marginRight:'0.5rem'}} /> Club Official Dashboard</h1>
                    <span className="club-badge">{club?.clubId || 'No Club'}</span>
                </div>
                <div className="header-actions">
                    <Link to="/events" className="btn btn-secondary"><i className="fa-solid fa-magnifying-glass" /> Browse Events</Link>
                </div>
            </header>

            <div style={{ height: '1.5rem' }} />

            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                    <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => showTab('events')}>
                    <i className="fa-solid fa-calendar-days" /> My Events
                </button>
                <button className={`tab-btn ${activeTab === 'submissions' ? 'active' : ''}`} onClick={() => showTab('submissions')}>
                    <i className="fa-solid fa-clipboard-list" /> Submissions
                </button>
                <button className={`tab-btn ${activeTab === 'myregs' ? 'active' : ''}`} onClick={() => showTab('myregs')}>
                    <i className="fa-solid fa-circle-check" /> My Registrations
                </button>
                <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => showTab('settings')}>
                    <i className="fa-solid fa-gear" /> Club Settings
                </button>
                <button className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => showTab('bookings')}>
                    <i className="fa-solid fa-calendar-check" /> My Bookings
                </button>
            </div>

            {/* Events Tab */}
            {activeTab === 'events' && (
                <div className="card">
                    <h2><i className="fa-solid fa-calendar-days" /> Manage Club Events</h2>
                    <div className="action-bar">
                        <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}><i className="fa-solid fa-plus" /> Add New Event</button>
                        <button className="btn btn-secondary" onClick={() => { resetForm(); setShowUpdateModal(true); }}><i className="fa-solid fa-pen-to-square" /> Update Event</button>
                        <button className="btn btn-secondary" onClick={fetchData}><i className="fa-solid fa-arrows-rotate" /> Refresh</button>
                    </div>

                    <div className="event-cards-grid">
                        {events.length > 0 ? events.map((event, index) => (
                            <EventFlipCard
                                key={event.eventId}
                                event={event}
                                index={index}
                                isAdmin={true} /* Faculty also has admin-like control over their club's events */
                                onEdit={(evt) => {
                                    setEditingEvent(evt);
                                    setSearchEventName(evt.eventName);
                                    const existingCustomFields = evt.customFormFields ? JSON.parse(evt.customFormFields) : [];
                                    setCustomFields(existingCustomFields);
                                    setEventForm({
                                        eventName: evt.eventName || '',
                                        description: evt.description || '',
                                        venueId: evt.venueId || '',
                                        eventDate: evt.eventDate || '',
                                        eventTime: evt.eventTime || '',
                                        deadline: evt.deadline || '',
                                        registrationFormLink: evt.registrationFormLink || '',
                                        eventType: evt.eventType || 'NON_RECRUITMENT',
                                        customFormFields: evt.customFormFields || '[]'
                                    });
                                    setShowUpdateModal(true);
                                }}
                                onDelete={handleDeleteEvent}
                            />
                        )) : (
                            <p style={{ padding: '2rem', color: 'var(--muted)', textAlign: 'center', gridColumn: '1 / -1' }}>
                                No events. Add one!
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Submissions Tab */}
            {activeTab === 'submissions' && (
                <div className="card">
                    <h2><i className="fa-solid fa-clipboard-list" /> Event Submissions</h2>
                    <div className="action-bar">
                        <button className="btn btn-secondary" onClick={fetchData}><i className="fa-solid fa-arrows-rotate" /> Refresh Submissions</button>
                    </div>
                    <table>
                        <thead>
                            <tr><th>User ID</th><th>Event</th><th>Type</th><th>Submitted</th><th>Status</th><th>Stage</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {submissions.length > 0 ? submissions.map(sub => {
                                const subEvent = getEventForSubmission(sub.eventId);
                                const isRecruitment = subEvent?.eventType === 'RECRUITMENT';
                                return (
                                    <tr key={sub.regId}>
                                        <td>{sub.userId}</td>
                                        <td>{getEventName(sub.eventId)}</td>
                                        <td>
                                            <span className={`type-badge ${isRecruitment ? 'type-recruitment' : 'type-regular'}`}>
                                                {isRecruitment ? '🎯 Recruitment' : '📅 Regular'}
                                            </span>
                                        </td>
                                        <td>{sub.submissionDate ? new Date(sub.submissionDate).toLocaleDateString() : '-'}</td>
                                        <td><span className={getStatusClass(sub.status)}>{sub.status}</span></td>
                                        <td>
                                            {isRecruitment ? (
                                                <span className="stage-indicator">
                                                    {sub.approvalCount === 0 && '⏳ Stage 0'}
                                                    {sub.approvalCount === 1 && '🔄 Stage 1'}
                                                    {sub.approvalCount === 2 && '✅ Stage 2 (Final)'}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <button className="btn btn-secondary" onClick={() => openViewModal(sub)}><i className="fa-solid fa-eye" /> View</button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="7">No submissions yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* My Registrations Tab */}
            {activeTab === 'myregs' && (
                <div className="card">
                    <h2><i className="fa-solid fa-circle-check" /> My Event Registrations</h2>
                    <table>
                        <thead>
                            <tr><th>Event</th><th>Submitted On</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {myRegistrations.length > 0 ? myRegistrations.map(reg => (
                                <tr key={reg.regId}>
                                    <td>{getEventName(reg.eventId)}</td>
                                    <td>{reg.submissionDate ? new Date(reg.submissionDate).toLocaleDateString() : '-'}</td>
                                    <td><span className={getStatusClass(reg.status)}>{reg.status}</span></td>
                                </tr>
                            )) : (
                                <tr><td colSpan="3">No registrations.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Club Settings Tab */}
            {activeTab === 'settings' && (
                <div className="card">
                    <h2><i className="fa-solid fa-gear" /> Club Settings</h2>
                    <div className="form-group">
                        <label>Club Name</label>
                        <input type="text" value={club?.clubName || ''} disabled style={{ opacity: 0.7 }} />
                    </div>
                    <div className="form-group">
                        <label>Club Description</label>
                        <textarea id="clubDescription" rows={6} defaultValue={club?.description || ''} placeholder="Enter your club's description..." />
                    </div>
                    <button className="btn btn-primary" onClick={updateClubDescription}><i className="fa-solid fa-floppy-disk" /> Save Description</button>
                </div>
            )}

            {/* My Bookings Tab */}
            {activeTab === 'bookings' && (
                <div className="card">
                    <h2><i className="fa-solid fa-calendar-check" /> My Venue Bookings</h2>
                    <div className="action-bar">
                        <Link to="/booking" className="btn btn-primary"><i className="fa-solid fa-plus" /> New Booking</Link>
                        <button className="btn btn-secondary" onClick={fetchData}><i className="fa-solid fa-arrows-rotate" /> Refresh</button>
                    </div>
                    <MyBookingsCalendar />
                    <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>All Bookings</h3>
                    <table>
                        <thead>
                            <tr><th>Venue</th><th>Date</th><th>Time</th><th>Purpose</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {myBookings.length > 0 ? myBookings.map(b => (
                                <tr key={b.bookingId}>
                                    <td>{b.venue?.name || 'N/A'}</td>
                                    <td>{new Date(b.bookingDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td>{new Date('1970-01-01T' + b.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} - {new Date('1970-01-01T' + b.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                                    <td>{b.purpose}</td>
                                    <td><span className={`status-badge status-${b.status?.toLowerCase()}`}>{b.status}</span></td>
                                    <td>
                                        {b.status === 'CONFIRMED' && (
                                            <button className="btn btn-danger" onClick={() => handleCancelBooking(b.bookingId)}>Cancel</button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6">No bookings yet. <Link to="/booking">Book a venue!</Link></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Event Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
                        <h3><i className="fa-solid fa-plus" /> Add New Event</h3>
                        <form onSubmit={handleAddEvent}>
                            {renderEventFormFields()}
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Event</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Update Event Modal */}
            {showUpdateModal && (
                <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setShowUpdateModal(false)}>×</button>
                        <h3><i className="fa-solid fa-pen-to-square" /> Update Event</h3>
                        <div className="form-group">
                            <label>Search by Event Name</label>
                            <input value={searchEventName} onChange={e => setSearchEventName(e.target.value)} placeholder="Enter exact event name" />
                        </div>
                        <button className="btn btn-secondary" onClick={fetchEventForUpdate}><i className="fa-solid fa-magnifying-glass" /> Find Event</button>

                        {editingEvent && (
                            <form onSubmit={handleUpdateEvent} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                {renderEventFormFields()}
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Event</button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* View Submission Modal — Multi-stage Approval */}
            {showViewModal && viewingSubmission && (
                <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
                    <div className="modal view-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setShowViewModal(false)}>×</button>
                        <h3><i className="fa-solid fa-clipboard-list" /> Submission Details</h3>

                        <div className="submission-info">
                            <div className="info-row">
                                <span className="info-label">Event:</span>
                                <span className="info-value">{getEventName(viewingSubmission.eventId)}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Event Type:</span>
                                <span className="info-value">
                                    <span className={`type-badge ${viewingEvent?.eventType === 'RECRUITMENT' ? 'type-recruitment' : 'type-regular'}`}>
                                        {viewingEvent?.eventType === 'RECRUITMENT' ? '🎯 Recruitment' : '📅 Regular'}
                                    </span>
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">User ID:</span>
                                <span className="info-value">{viewingSubmission.userId}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Submitted:</span>
                                <span className="info-value">
                                    {viewingSubmission.submissionDate
                                        ? new Date(viewingSubmission.submissionDate).toLocaleString()
                                        : 'N/A'}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Status:</span>
                                <span className={getStatusClass(viewingSubmission.status)}>
                                    {viewingSubmission.status}
                                </span>
                            </div>
                            {viewingEvent?.eventType === 'RECRUITMENT' && (
                                <div className="info-row">
                                    <span className="info-label">Approval Stage:</span>
                                    <span className="info-value">
                                        <span className="stage-indicator">
                                            {viewingSubmission.approvalCount === 0 && '⏳ Stage 0 — Awaiting review'}
                                            {viewingSubmission.approvalCount === 1 && '🔄 Stage 1 — Shortlisted (interview/further rounds)'}
                                            {viewingSubmission.approvalCount === 2 && '✅ Stage 2 — Selected as Member'}
                                        </span>
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="form-data-section">
                            <h4><i className="fa-solid fa-pen" /> Form Data</h4>
                            {parseFormData(viewingSubmission.formData) ? (
                                <div className="form-data-grid">
                                    {Object.entries(parseFormData(viewingSubmission.formData)).map(([key, value]) => (
                                        <div className="form-data-item" key={key}>
                                            <span className="data-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:</span>
                                            <span className="data-value">
                                                {Array.isArray(value) ? (
                                                    <div className="links-list">
                                                        {value.map((item, i) => (
                                                            <div key={i} className="link-item">
                                                                {typeof item === 'object' ? (
                                                                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                                                                        {item.label || item.url}
                                                                    </a>
                                                                ) : (
                                                                    <span>{item}</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (value || '-')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-data">No form data available (external registration)</p>
                            )}
                        </div>

                        {/* Action Buttons — Context-dependent */}
                        {(() => {
                            const isRecruitment = viewingEvent?.eventType === 'RECRUITMENT';
                            const status = viewingSubmission.status;
                            const count = viewingSubmission.approvalCount || 0;

                            if (status === 'SELECTED' || status === 'REJECTED' || status === 'APPROVED') {
                                return (
                                    <div className="modal-actions">
                                        <p className="finalized-note">
                                            {status === 'SELECTED' && '✅ This student has been selected as a club member.'}
                                            {status === 'APPROVED' && '✅ This registration has been approved.'}
                                            {status === 'REJECTED' && '❌ This registration has been rejected.'}
                                        </p>
                                    </div>
                                );
                            }

                            if (isRecruitment) {
                                if (count === 0) {
                                    return (
                                        <div className="modal-actions">
                                            <div className="approval-stage-info">
                                                <i className="fa-solid fa-info-circle" /> Stage 1: Shortlist for further rounds (interview, etc.)
                                            </div>
                                            <button className="btn btn-warning" onClick={() => handleStatusFromModal('APPROVED')}>
                                                🔄 Shortlist for Further Rounds
                                            </button>
                                            <button className="btn btn-danger" onClick={() => handleStatusFromModal('REJECTED')}>
                                                ✗ Reject
                                            </button>
                                        </div>
                                    );
                                } else if (count === 1) {
                                    return (
                                        <div className="modal-actions">
                                            <div className="approval-stage-info">
                                                <i className="fa-solid fa-info-circle" /> Stage 2: Final selection as club member
                                            </div>
                                            <button className="btn btn-success" onClick={() => handleStatusFromModal('APPROVED')}>
                                                ✅ Select as Club Member
                                            </button>
                                            <button className="btn btn-danger" onClick={() => handleStatusFromModal('REJECTED')}>
                                                ✗ Reject
                                            </button>
                                        </div>
                                    );
                                }
                            } else {
                                // Non-recruitment: single stage
                                return (
                                    <div className="modal-actions">
                                        <button className="btn btn-success" onClick={() => handleStatusFromModal('APPROVED')}>
                                            ✓ Approve
                                        </button>
                                        <button className="btn btn-danger" onClick={() => handleStatusFromModal('REJECTED')}>
                                            ✗ Reject
                                        </button>
                                    </div>
                                );
                            }
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyDashboard;
