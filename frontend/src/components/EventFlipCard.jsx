import { motion } from 'framer-motion';

const EventFlipCard = ({ event, index, onAction, onEdit, onDelete, onToggleVisibility, isAdmin }) => {
  const isHidden = event.hidden;

  return (
    <motion.div
      className={`event-blob-card ${isHidden ? 'event-card--hidden' : ''}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* The animated moving blob background */}
      <div className={`event-blob ${isHidden ? 'blob--hidden' : ''}`} />

      {/* The glassmorphic foreground containing content */}
      <div 
        className="event-blob-bg" 
        style={{ cursor: onAction && !isAdmin ? 'pointer' : 'default' }}
        onClick={() => onAction && !isAdmin && onAction(event)}
      >
        
        {/* Hidden Badge */}
        {isHidden && (
          <div className="ebc-hidden-badge">
            <i className="fa-solid fa-eye-slash"></i> Hidden from Public
          </div>
        )}

        {/* Header: Title & Date Badge */}
        <div className="ebc-header">
          <div>
            <h3 className="ebc-title">{event.eventName}</h3>
            <p className="ebc-club">{event.clubId ? `by ${event.clubId}` : 'Campus Event'}</p>
          </div>
          <span className="ebc-date-badge">
            {event.eventDate ? new Date(event.eventDate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD'}
          </span>
        </div>

        {/* Info Grid (Time, Venue, etc.) */}
        <div className="ebc-details">
          {event.eventTime && (
            <div className="ebc-detail-item">
              <span>⏰</span> {event.eventTime}
            </div>
          )}
          {event.venueId && (
            <div className="ebc-detail-item">
              <span>📍</span> {event.venueId}
            </div>
          )}
          {event.capacity && (
            <div className="ebc-detail-item">
              <span>👥</span> Cap: {event.capacity}
            </div>
          )}
          {event.deadline && (
            <div className="ebc-detail-item">
              <span>📝</span> Due: {new Date(event.deadline + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="ebc-desc">
          {event.description || 'Join this exciting event on campus. See you there!'}
        </p>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="ebc-actions">
            <button
              className="ebc-btn btn-edit"
              title="Edit Event"
              onClick={(e) => {
                  e.stopPropagation();
                  onEdit && onEdit(event);
              }}
            >
              <i className="fa-solid fa-pen"></i>
            </button>
            <button
              className={`ebc-btn ${isHidden ? 'btn-unhide' : 'btn-hide'}`}
              title={isHidden ? "Unhide Event" : "Hide Event"}
              onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility && onToggleVisibility(event.eventId);
              }}
            >
              <i className={`fa-solid ${isHidden ? 'fa-eye' : 'fa-eye-slash'}`}></i>
            </button>
            <button
              className="ebc-btn btn-delete"
              title="Delete Event"
              onClick={(e) => {
                  e.stopPropagation();
                  onDelete && onDelete(event.eventId);
              }}
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default EventFlipCard;
