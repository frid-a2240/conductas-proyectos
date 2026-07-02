import { api } from "./api.js";
const USER_KEY = "cuestionario_user";
export const auth = {
  async login(numero_empleado, password) {
  console.log("🔵 LOGIN INTENTO:", {
    numero_empleado,
    numero_len: numero_empleado.length,
    numero_charcodes: [...numero_empleado].map(c => c.charCodeAt(0)),
    password_len: password.length,
    password_charcodes: [...password].map(c => c.charCodeAt(0)),
  });
  try {
    const { user } = await api.login(numero_empleado, password);
    console.log("🟢 LOGIN OK:", user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch (err) {
    console.error("🔴 LOGIN ERROR:", err.message);
    throw err;
  }
},

  async refresh() {
    try {
      const user = await api.me();
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  current() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  // ━━━ Logout ━━━
  async logout() {
    try { await api.logout(); } catch {}
    localStorage.removeItem(USER_KEY);
  },
  // ━━━ Cambio de contraseña ━━━
  async changePassword(current_password, new_password) {
    return api.changePassword(current_password, new_password);
  },
  // Para actualizar el cache cuando cambian datos del user (ej. después de cambiar pw)
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
};