/**
 * auth.js - Handles basic user authentication and session management
 */

const AUTH_KEY = 'nlpl_it_user';

const Auth = {
    login(userId, password) {
        // Simple validation: Accept any non-empty input for userId/password
        if (userId.trim() && password.trim()) {
            localStorage.setItem(AUTH_KEY, JSON.stringify({ userId, loggedIn: true }));
            return true;
        }
        return false;
    },

    logout() {
        localStorage.removeItem(AUTH_KEY);
        window.location.href = 'login.html';
    },

    isLoggedIn() {
        const user = localStorage.getItem(AUTH_KEY);
        return user ? JSON.parse(user).loggedIn : false;
    },

    getUser() {
        const user = localStorage.getItem(AUTH_KEY);
        return user ? JSON.parse(user) : null;
    },

    checkAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
        }
    }
};

window.Auth = Auth;
