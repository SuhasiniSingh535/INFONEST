import { useState, useEffect, useCallback, memo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { clubsAPI, eventsAPI, studentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Clubs.css';

export const isEventExpired = (event) => {
    if (!event.eventDate) return false;
    const now = new Date();
    // Normalize time string (e.g. '14:30' -> '14:30:00') to parse safely
    let timeStr = event.eventTime || '00:00:00';
    if (timeStr.length === 5) timeStr += ':00'; // Append seconds if missing

    const eventDateTime = new Date(`${event.eventDate}T${timeStr}`);
    if (!isNaN(eventDateTime)) {
        return eventDateTime < now;
    }
    // Fallback if exact time parsing fails
    const eventDateOnly = new Date(event.eventDate);
    if (!isNaN(eventDateOnly)) {
        eventDateOnly.setHours(23, 59, 59);
        return eventDateOnly < now;
    }
    return false;
};

/* ── Inline SVG icon ── */
const Icon = ({ d, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0 }}>
        <path d={d} />
    </svg>
);

const IC = {
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    clock: "M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2zM12 6v6l4 2",
    map: "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0zM12 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    deadline: "M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2zM12 8v4l3 3",
    check: "M20 6L9 17l-5-5",
    arrow: "M5 12h14M12 5l7 7-7 7",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    building: "M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21v-4a3 3 0 0 1 6 0v4",
    tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
    external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3",
};

/* ── Club colour palette (cycles by index) ── */
const CLUB_COLORS = [
    { from: '#2563eb', to: '#60a5fa', bg: '#eff6ff', border: '#bfdbfe' },
    { from: '#7c3aed', to: '#a78bfa', bg: '#f5f3ff', border: '#ddd6fe' },
    { from: '#059669', to: '#34d399', bg: '#f0fdf4', border: '#bbf7d0' },
    { from: '#d97706', to: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
    { from: '#dc2626', to: '#f87171', bg: '#fef2f2', border: '#fecaca' },
    { from: '#0891b2', to: '#22d3ee', bg: '#ecfeff', border: '#a5f3fc' },
];

/* ─────────────────────────────────────────────
   Event Accordion Card
───────────────────────────────────────────── */
const EventCard = memo(({ event, index, isRegistered, onRegister }) => {
    const [open, setOpen] = useState(false);
    const color = CLUB_COLORS[index % CLUB_COLORS.length];
    const expired = isEventExpired(event);

    return (
        <div
            className={`cl-event-card${open ? ' cl-event-card--open' : ''}`}
            style={{ '--ev-from': color.from, '--ev-to': color.to, animationDelay: `${index * 55}ms` }}
        >
            {/* ── Clickable header ── */}
            <div className="cl-event-header" onClick={() => setOpen(o => !o)}>
                <div className="cl-event-accent" />
                <div className="cl-event-main">
                    <div className="cl-event-top">
                        <h3 className="cl-event-name">{event.eventName}</h3>
                        {event.clubId && (
                            <Link
                                to={`/clubs/${event.clubId}`}
                                className="cl-event-club-link"
                                onClick={e => e.stopPropagation()}
                            >
                                {event.clubId}
                            </Link>
                        )}
                    </div>
                    {/* quick meta always visible */}
                    <div className="cl-event-quickmeta">
                        {event.eventDate && (
                            <span><Icon d={IC.calendar} size={13} /> {event.eventDate}</span>
                        )}
                        {event.eventTime && (
                            <span><Icon d={IC.clock} size={13} /> {event.eventTime}</span>
                        )}
                        {event.venueId && (
                            <span><Icon d={IC.map} size={13} /> {event.venueId}</span>
                        )}
                    </div>
                </div>
                <div className="cl-event-right">
                    {expired ? (
                        <span className="cl-badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                            Expired
                        </span>
                    ) : isRegistered ? (
                        <span className="cl-badge cl-badge-success">
                            <Icon d={IC.check} size={12} /> Registered
                        </span>
                    ) : (
                        <span className="cl-badge cl-badge-upcoming">Upcoming</span>
                    )}
                    <span className={`cl-chevron${open ? ' cl-chevron--up' : ''}`}>›</span>
                </div>
            </div>

            {/* ── Expandable body ── */}
            <div className="cl-event-body">
                <div className="cl-event-body-inner">
                    {event.description && (
                        <p className="cl-event-desc">{event.description}</p>
                    )}
                    <div className="cl-event-detail-grid">
                        <div className="cl-detail-item">
                            <Icon d={IC.calendar} size={14} />
                            <div>
                                <span className="cl-detail-label">Date</span>
                                <span className="cl-detail-value">{event.eventDate || 'TBD'}</span>
                            </div>
                        </div>
                        <div className="cl-detail-item">
                            <Icon d={IC.clock} size={14} />
                            <div>
                                <span className="cl-detail-label">Time</span>
                                <span className="cl-detail-value">{event.eventTime || 'TBD'}</span>
                            </div>
                        </div>
                        <div className="cl-detail-item">
                            <Icon d={IC.map} size={14} />
                            <div>
                                <span className="cl-detail-label">Venue</span>
                                <span className="cl-detail-value">{event.venueId || 'TBD'}</span>
                            </div>
                        </div>
                        {event.deadline && (
                            <div className="cl-detail-item">
                                <Icon d={IC.deadline} size={14} />
                                <div>
                                    <span className="cl-detail-label">Deadline</span>
                                    <span className="cl-detail-value">{event.deadline}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="cl-event-action">
                        {expired ? (
                            <button className="cl-btn" style={{ backgroundColor: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed', boxShadow: 'none' }} disabled>
                                Registration Closed
                            </button>
                        ) : isRegistered ? (
                            <span className="cl-badge cl-badge-success cl-badge-lg">
                                <Icon d={IC.check} size={14} /> You're registered
                            </span>
                        ) : (
                            <button
                                className="cl-btn cl-btn-primary"
                                onClick={(e) => { e.stopPropagation(); onRegister(event); }}
                            >
                                Register Now <Icon d={IC.arrow} size={15} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

/* ─────────────────────────────────────────────
<<<<<<< HEAD
   Club Card — Uiverse.io Animated Card
=======
   Club Card (for the grid)
>>>>>>> origin/final-code
───────────────────────────────────────────── */
const ClubGridCard = memo(({ club, index }) => {
    const color = CLUB_COLORS[index % CLUB_COLORS.length];
    const initials = (club.clubName || club.clubId || '?')
        .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    return (
        <Link
            to={`/clubs/${club.clubId}`}
            className="uv-card"
            style={{ '--uv-play': color.from, '--uv-dot': color.to, animationDelay: `${index * 65}ms` }}
        >
            <div className="uv-img-section">
                <div className="uv-card-avatar">{initials}</div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: 8, bottom: 8, width: 32, height: 32 }}>
                    <path d={IC.building} />
                </svg>
            </div>
            <div className="uv-card-desc">
                <div className="uv-card-header">
                    <span className="uv-card-title">{club.clubName}</span>
                    <div className="uv-card-menu">
                        <div className="uv-dot" />
                        <div className="uv-dot" />
                        <div className="uv-dot" />
                    </div>
                </div>
                <span className="uv-card-time">{club.clubId}</span>
                <span className="uv-recent">View Club →</span>
            </div>
        </Link>
    );
});

/* ═══════════════════════════════════════════
   Main Component
═══════════════════════════════════════════ */
const Clubs = () => {
    const { clubId } = useParams();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [clubs, setClubs] = useState([]);
    const [events, setEvents] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [selectedClub, setSelectedClub] = useState(null);
    const [clubEvents, setClubEvents] = useState([]);
    const [clubFaculty, setClubFaculty] = useState([]);
    const [clubMembers, setClubMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('events');
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (clubId) fetchClubDetails(clubId);
        else fetchData();
    }, [clubId, user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [clubsRes, eventsRes] = await Promise.all([
                clubsAPI.getAllClubs(),
                eventsAPI.getUpcomingEvents()
            ]);
            setClubs(clubsRes.data);
            // For the main Upcoming Events tab, show strictly non-expired upcoming events
            const allEvents = eventsRes.data || [];
            const upcomingOnly = allEvents.filter(e => !isEventExpired(e));
            setEvents(upcomingOnly);
            if (isAuthenticated && user?.userId) {
                const regsRes = await studentAPI.getMyRegistrations(user.userId);
                setRegistrations(regsRes.data);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchClubDetails = async (id) => {
        setLoading(true);
        try {
            const [detailsRes, eventsRes] = await Promise.all([
                clubsAPI.getClubDetails(id),
                eventsAPI.getEventsByClubId(id)
            ]);
            setSelectedClub(detailsRes.data.club || detailsRes.data);
            setClubEvents(eventsRes.data);
            setClubFaculty(detailsRes.data.faculty || []);
            setClubMembers(detailsRes.data.members || []);
            if (isAuthenticated && user?.userId) {
                const regsRes = await studentAPI.getMyRegistrations(user.userId);
                setRegistrations(regsRes.data);
            }
        } catch (err) {
            console.error('Error fetching club details:', err);
        } finally {
            setLoading(false);
        }
    };

    const isRegistered = useCallback((eventId) =>
        registrations.some(r => r.eventId === eventId), [registrations]);

    const handleRegister = useCallback(async (event) => {
        if (!isAuthenticated) {
            sessionStorage.setItem('pendingRegistration', JSON.stringify({
                eventId: event.eventId,
                eventName: event.eventName,
                registrationFormLink: event.registrationFormLink || 'club_form_link'
            }));
            navigate('/login');
            return;
        }
        if (!event.registrationFormLink || event.registrationFormLink === 'club_form_link') {
            sessionStorage.setItem('pendingRegistration', JSON.stringify({
                eventId: event.eventId,
                eventName: event.eventName,
                registrationFormLink: 'club_form_link'
            }));
            navigate('/club-form');
            return;
        }
        try {
            await studentAPI.registerForEvent({ userId: user.userId, eventId: event.eventId });
            setMessage({ type: 'success', text: `Registered! Opening external form…` });
            window.open(event.registrationFormLink, '_blank');
            const regsRes = await studentAPI.getMyRegistrations(user.userId);
            setRegistrations(regsRes.data);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Registration failed' });
        }
    }, [isAuthenticated, user, navigate]);

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="cl-page">
                <div className="cl-loading">
                    <div className="cl-loader-ring" />
                    <p>Loading…</p>
                </div>
            </div>
        );
    }

    /* ── Club Detail View ── */
    if (clubId && selectedClub) {
        const colorIdx = 0;
        const color = CLUB_COLORS[colorIdx];
        const initials = (selectedClub.clubName || selectedClub.clubId || '?')
            .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

        return (
            <div className="cl-page cl-page--detail">

                {/* Club hero card — tab animation */}
                <div className="cl-hero-wrap" style={{ '--ch-from': color.from, '--ch-to': color.to }}>
                    <div className="cl-hero-topbar">
                        <div className="cl-hero-tab">
                            <div className="cl-club-hero-avatar">{initials}</div>
                        </div>
                    </div>
                    <div className="cl-club-hero">
                        {/* Newton's cradle pendulum animation */}
                        <div className="cl-pendulum">
                            <div className="cl-ball cl-ball-first"></div>
                            <div className="cl-ball"></div>
                            <div className="cl-ball"></div>
                            <div className="cl-ball"></div>
                            <div className="cl-ball cl-ball-last"></div>
                        </div>
                        <span className="cl-club-hero-id">Club · {selectedClub.clubId}</span>
                        <h1>{selectedClub.clubName}</h1>
                        {selectedClub.description && (
                            <p className="cl-club-hero-desc">{selectedClub.description}</p>
                        )}
                    </div>
                </div>

                {message.text && (
                    <div className={`cl-alert cl-alert-${message.type}`}>
                        <span>{message.text}</span>
                        <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
                    </div>
                )}

                {/* Faculty & Members Section */}
                <div className="cl-people-section">
                    <div className="cl-people-card cl-faculty-card">
                        <div className="cl-people-header">
                            <Icon d={IC.users} size={18} />
                            <h3>Faculty Advisors</h3>
                            <span className="cl-people-count">{clubFaculty.length}</span>
                        </div>
                        {clubFaculty.length > 0 ? (
                            <div className="cl-people-list">
                                {clubFaculty.map(f => (
                                    <div key={f.userId} className="cl-person-chip">
                                        <span className="cl-person-avatar">{(f.firstName?.[0] || '?').toUpperCase()}</span>
                                        <span className="cl-person-name">{`${f.firstName || ''} ${f.lastName || ''}`.trim() || f.email}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="cl-people-empty">No faculty assigned yet</p>
                        )}
                    </div>

                    <div className="cl-people-card cl-members-card">
                        <div className="cl-people-header">
                            <Icon d={IC.check} size={18} />
                            <h3>Club Members</h3>
                            <span className="cl-people-count">{clubMembers.length}</span>
                        </div>
                        {clubMembers.length > 0 ? (
                            <div className="cl-people-list">
                                {clubMembers.map(m => (
                                    <div key={m.userId} className="cl-person-chip cl-member-chip">
                                        <span className="cl-person-avatar cl-member-avatar">{(m.firstName?.[0] || '?').toUpperCase()}</span>
                                        <span className="cl-person-name">{`${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="cl-people-empty">No members yet</p>
                        )}
                    </div>
                </div>

                {/* Events section */}
                <div className="cl-section-header">
                    <h2><Icon d={IC.calendar} size={18} /> Club Events</h2>
                    <span className="cl-count-badge">{clubEvents.length} event{clubEvents.length !== 1 ? 's' : ''}</span>
                </div>

                {clubEvents.length > 0 ? (
                    <div className="cl-events-list">
                        {clubEvents.map((event, i) => (
                            <EventCard
                                key={event.eventId}
                                event={event}
                                index={i}
                                isRegistered={isRegistered(event.eventId)}
                                onRegister={handleRegister}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="cl-empty">
                        <span className="cl-empty-icon">📅</span>
                        <p>No events for this club yet.</p>
                    </div>
                )}
            </div>
        );
    }

    /* ── Main Clubs & Events Page ── */
    return (
        <div className="cl-page">

            {/* Page header */}
            <header className="cl-page-header">
                <div>
                    <h1>Clubs &amp; Events</h1>
                    <p>Discover student clubs and upcoming events on campus</p>
                </div>
                <div className="cl-header-stats">
                    <div className="cl-stat-pill">
                        <Icon d={IC.building} size={14} />
                        <span>{clubs.length} Clubs</span>
                    </div>
                    <div className="cl-stat-pill">
                        <Icon d={IC.calendar} size={14} />
                        <span>{events.length} Events</span>
                    </div>
                </div>
            </header>

            {message.text && (
                <div className={`cl-alert cl-alert-${message.type}`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
                </div>
            )}

            {/* Tabs */}
            <div className="cl-tabs">
                <button
                    className={`cl-tab${activeTab === 'events' ? ' cl-tab-active' : ''}`}
                    onClick={() => setActiveTab('events')}
                >
                    <Icon d={IC.calendar} size={15} /> Upcoming Events
                </button>
                <button
                    className={`cl-tab${activeTab === 'clubs' ? ' cl-tab-active' : ''}`}
                    onClick={() => setActiveTab('clubs')}
                >
                    <Icon d={IC.building} size={15} /> All Clubs
                </button>
            </div>

            {/* ── Events tab ── */}
            {activeTab === 'events' && (
                <div className="cl-tab-content">
                    {events.length > 0 ? (
                        <div className="cl-events-list">
                            {events.map((event, i) => (
                                <EventCard
                                    key={event.eventId}
                                    event={event}
                                    index={i}
                                    isRegistered={isRegistered(event.eventId)}
                                    onRegister={handleRegister}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="cl-empty">
                            <span className="cl-empty-icon">📅</span>
                            <p>No upcoming events right now. Check back soon!</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Clubs tab ── */}
            {activeTab === 'clubs' && (
                <div className="cl-tab-content">
                    {clubs.length > 0 ? (
                        <div className="cl-clubs-grid">
                            {clubs.map((club, i) => (
                                <ClubGridCard key={club.clubId} club={club} index={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="cl-empty">
                            <span className="cl-empty-icon">🏢</span>
                            <p>No clubs found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Clubs;