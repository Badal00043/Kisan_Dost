/* ============================================================
   Kisan Dost — Authentication Module
   Login / Register with localStorage persistence
   ============================================================ */

const Auth = (() => {
  const USERS_KEY = 'kd_users';
  const SESSION_KEY = 'kd_session';

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch (e) { return {}; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  /**
   * Register a new user
   * @returns {{success: boolean, message: string}}
   */
  function register(name, phone, password) {
    if (!name || !phone || !password) return { success: false, message: 'All fields are required / सभी फ़ील्ड भरें' };
    if (phone.length < 10) return { success: false, message: 'Enter valid phone number / सही फ़ोन नंबर दें' };
    if (password.length < 4) return { success: false, message: 'Password must be at least 4 characters / पासवर्ड कम से कम 4 अक्षर' };

    const users = getUsers();
    if (users[phone]) return { success: false, message: 'Phone already registered / यह नंबर पहले से पंजीकृत है' };

    users[phone] = {
      name: name.trim(),
      phone: phone.trim(),
      password: password, // In production, hash this!
      createdAt: Date.now(),
      avatar: name.charAt(0).toUpperCase()
    };
    saveUsers(users);
    setSession(users[phone]);
    return { success: true, message: 'Registration successful!' };
  }

  /**
   * Login an existing user
   * @returns {{success: boolean, message: string}}
   */
  function login(phone, password) {
    if (phone === 'admin' && password === 'farmer123') {
      const demoUser = { name: 'Demo Farmer', phone: 'admin', avatar: 'D', createdAt: Date.now() };
      setSession(demoUser);
      return { success: true, message: 'Demo mode active!' };
    }

    if (!phone || !password) return { success: false, message: 'Enter phone and password / फ़ोन और पासवर्ड दें' };

    const users = getUsers();
    const user = users[phone];
    if (!user) return { success: false, message: 'Phone not registered / यह नंबर पंजीकृत नहीं है' };
    if (user.password !== password) return { success: false, message: 'Wrong password / गलत पासवर्ड' };

    setSession(user);
    return { success: true, message: 'Login successful!' };
  }

  function setSession(user) {
    const session = { name: user.name, phone: user.phone, avatar: user.avatar, loggedInAt: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }

  function isLoggedIn() {
    return !!getSession();
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getCurrentUser() {
    return getSession();
  }

  return { register, login, logout, isLoggedIn, getCurrentUser, getSession };
})();
