/**
 * TOKO NADYN POS – Auth Module (REST API)
 */
const Auth = {
    currentUser: null,

    init() {
        const saved = sessionStorage.getItem('pos_session');
        if (saved) {
            this.currentUser = JSON.parse(saved);
            return true;
        }
        return false;
    },

    async login(username, password) {
        try {
            const res = await fetch(`${DB.apiBase}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!res.ok) return false;

            const user = await res.json();
            this.currentUser = user;
            sessionStorage.setItem('pos_session', JSON.stringify(user));
            return true;
        } catch (e) {
            console.error('Login failed:', e);
            return false;
        }
    },

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('pos_session');
    },

    isAdmin() { return this.currentUser?.role === 'admin'; }
};
