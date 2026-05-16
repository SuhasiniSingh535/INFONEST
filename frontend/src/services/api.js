import axios from 'axios';

// Base API configuration
const API_BASE_URL = 'https://infonest-backend.onrender.com/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};

// ==================== USER API ====================
export const userAPI = {
  getProfile: (email) => api.get(`/users/profile/${email}`),
  checkRole: (email) => api.get('/users/check-role', { params: { email } }),
};

// ==================== CLUBS API (Public) ====================
export const clubsAPI = {
  getAllClubs: () => api.get('/clubs/all'),
  getClubDetails: (clubId) => api.get(`/clubs/${clubId}/details`),
};

// ==================== EVENTS API (Public) ====================
export const eventsAPI = {
  getAllEvents: () => api.get('/events'),
  getEventById: (eventId) => api.get(`/events/${eventId}`),
  getUpcomingEvents: () => api.get('/events/upcoming'),
  getEventsByClubId: (clubId) => api.get(`/events/club/${clubId}`),
};

// ==================== STATS API (Public) ====================
export const statsAPI = {
  getStats: async () => {
    try {
      const eventsRes = await api.get('/events');
      return {
        totalUsers: 0,  // Will update when we have users endpoint
        totalEvents: eventsRes.data?.length || 0,
        totalVenues: 0
      };
    } catch (error) {
      return { totalUsers: 0, totalEvents: 0, totalVenues: 0 };
    }
  }
};

// ==================== STUDENT API ====================
export const studentAPI = {
  // Register for an event
  registerForEvent: (registration) => api.post('/student/register', registration),

  // Update form data after filling internal form
  updateFormData: (regId, formData) => api.put('/student/update-form-data', { regId, formData }),

  // Get user's registrations
  getMyRegistrations: (userId) => api.get(`/student/my-registrations/${userId}`),
};

// ==================== FACULTY API ====================
export const facultyAPI = {
  // Event Management
  addEvent: (event) => api.post('/faculty/add-event', event),
  updateEvent: (eventId, eventData) => api.put(`/faculty/update-event/${eventId}`, eventData),
  deleteEvent: (eventId) => api.delete(`/faculty/delete-event/${eventId}`),
  getMyEvents: () => api.get('/faculty/my-events'),
  getEventDetails: (clubId, eventName) => api.get(`/faculty/event-details/${clubId}/${eventName}`),

  // Club Management
  getMyClub: () => api.get('/faculty/my-club'),
  updateClubDescription: (description) => api.put('/faculty/update-club-description', { description }),

  // Submissions/Registrations  
  // Status flow for RECRUITMENT: APPLIED → SHORTLISTED → SELECTED or REJECTED
  // Status flow for NON_RECRUITMENT: APPLIED → APPROVED or REJECTED
  getSubmissions: (clubId) => api.get(`/faculty/submissions/${clubId}`),
  updateRegistrationStatus: (regId, status) =>
    api.put(`/faculty/update-status/${regId}`, null, { params: { status } }),
};

// ==================== ADMIN API ====================
export const adminAPI = {
  // Club Management
  getAllClubs: () => api.get('/admin/clubs'),
  addClub: (club) => api.post('/admin/clubs/add', club),
  updateClub: (clubId, clubData) => api.put(`/admin/clubs/${clubId}`, clubData),
  deleteClub: (clubId) => api.delete(`/admin/clubs/${clubId}`),

  // Event Management
  getAllEvents: () => api.get('/admin/events'),
  addEvent: (event) => api.post('/admin/events/add', event),
  updateEvent: (eventId, eventData) => api.put(`/admin/events/${eventId}`, eventData),
  deleteEvent: (eventId) => api.delete(`/admin/events/${eventId}`),
  toggleEventVisibility: (eventId) => api.put(`/admin/events/${eventId}/toggle-visibility`),
  setEventVisibility: (eventId, hidden) =>
    api.put(`/admin/events/${eventId}/visibility`, null, { params: { hidden } }),

  // Club Officials Management
  getClubOfficials: (clubId) => api.get(`/admin/officials/${clubId}`),
  getAllFaculty: () => api.get('/admin/faculty'),
  assignFacultyToClub: (email, clubId) =>
    api.put('/admin/officials/assign', null, { params: { email, clubId } }),
  removeFacultyFromClub: (email) =>
    api.put('/admin/officials/remove', null, { params: { email } }),
};

// ==================== SCHEDULE API ====================
export const scheduleAPI = {
    // Current class search
    searchRealTime: (name) => api.get(`/office/schedule/search/now?name=${name}`),
    
    // Find teacher's cabin
    getCabin: (name) => api.get(`/office/schedule/cabin?name=${name}`),
    
    // Search by specific details
    searchAdvanced: (name, day, time) => 
        api.get(`/office/schedule/search/advanced?name=${name}&day=${day}&time=${time}`),

    // YAHAN EXACT CHANGE KARNA HAI (axios hata kar api.get use kiya hai)
    searchTeachers: (query) => api.get(`/office/schedule/teachers/search?query=${encodeURIComponent(query)}`),

    // Check if teacher has existing schedule
    checkScheduleExists: (email) => api.get(`/office/schedule/teachers/check-schedule?email=${encodeURIComponent(email)}`),

    deleteSchedule: (email) => api.delete(`/office/schedule/delete-teacher-schedule?email=${encodeURIComponent(email)}`),

    uploadExcel: (file, email, teacherName, isUpdate = false) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('email', email);
        formData.append('teacherName', teacherName);
        formData.append('isUpdate', isUpdate.toString()); 
        return api.post('/office/schedule/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    getTeacherScheduleData: (email) => api.get(`/office/schedule/teachers/schedule-data`, { params: { email } }),
};

// ==================== VENUE BOOKING API ====================
export const venueAPI = {
  // Get all active venues
  getAllVenues: () => api.get('/venues/all'),

  // Add a venue (Admin/Office)
  addVenue: (venueData) => api.post('/venues/add', venueData),

  // Delete/deactivate a venue (Admin)
  deleteVenue: (venueId) => api.delete(`/venues/${venueId}`),

  // Search available venues for a time slot
  searchAvailable: (date, startTime, endTime, capacity, type) => {
    const params = { date, startTime, endTime };
    if (capacity) params.capacity = capacity;
    if (type) params.type = type;
    return api.get('/venues/available', { params });
  },

  // Book a venue
  bookVenue: (bookingData) => api.post('/venues/book', bookingData),

  // Get my bookings
  getMyBookings: () => api.get('/venues/my-bookings'),

  // Cancel a booking
  cancelBooking: (bookingId) => api.put(`/venues/cancel/${bookingId}`),

  // Get venue count (for stats)
  getVenueCount: () => api.get('/venues/count'),
};

export default api;
