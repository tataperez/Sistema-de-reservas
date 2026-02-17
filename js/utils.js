// ========================================
// SISTEMA DE RESERVAS - VERSIÓN CORREGIDA
// ========================================

// CONSTANTES
const STORAGE_KEYS = {
    USERS: 'reservation_system_users',
    RESERVATIONS: 'reservation_system_reservations',
    CURRENT_USER: 'reservation_system_current_user'
};

// ========================================
// STORAGE SERVICE - TOTALMENTE FUNCIONAL
// ========================================
const StorageService = {
    // Inicializar datos SOLO si no existen
    initializeData: function() {
        console.log('Inicializando datos...');
        
        // USUARIOS POR DEFECTO
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            const defaultUsers = [
                {
                    id: '1',
                    email: 'admin@empresa.com',
                    name: 'Administrador',
                    role: 'admin',
                    password: 'admin123',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    email: 'operador@empresa.com',
                    name: 'Operador',
                    role: 'operator',
                    password: 'operador123',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '3',
                    email: 'cliente@email.com',
                    name: 'Cliente Demo',
                    role: 'client',
                    password: 'cliente123',
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
            console.log('Usuarios por defecto creados:', defaultUsers);
        }

        // RESERVAS POR DEFECTO
        if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
            const today = new Date().toISOString().split('T')[0];
            const defaultReservations = [
                {
                    id: '101',
                    clientId: '3',
                    clientName: 'Cliente Demo',
                    clientEmail: 'cliente@email.com',
                    service: 'Consulta General',
                    date: today,
                    time: '10:00',
                    status: 'confirmed',
                    notes: 'Primera consulta',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '102',
                    clientId: '3',
                    clientName: 'Cliente Demo',
                    clientEmail: 'cliente@email.com',
                    service: 'Mantenimiento',
                    date: today,
                    time: '11:30',
                    status: 'pending',
                    notes: 'Revisión programada',
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(defaultReservations));
            console.log('Reservas por defecto creadas:', defaultReservations);
        }
    },

    // OBTENER TODOS LOS USUARIOS
    getUsers: function() {
        const users = localStorage.getItem(STORAGE_KEYS.USERS);
        console.log('Obteniendo usuarios:', users);
        return users ? JSON.parse(users) : [];
    },

    // OBTENER TODAS LAS RESERVAS
    getReservations: function() {
        const reservations = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
        console.log('Obteniendo reservas:', reservations);
        return reservations ? JSON.parse(reservations) : [];
    },

    // GUARDAR RESERVAS
    saveReservations: function(reservations) {
        console.log('Guardando reservas:', reservations);
        localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
    },

    // GUARDAR USUARIO
    saveUser: function(user) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === user.id);
        
        if (index >= 0) {
            users[index] = { ...users[index], ...user };
        } else {
            users.push(user);
        }
        
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        console.log('Usuario guardado:', user);
    },

    // ESTABLECER USUARIO ACTUAL
    setCurrentUser: function(user) {
        if (user) {
            // Guardar sin password
            const { password, ...userWithoutPassword } = user;
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userWithoutPassword));
            console.log('Usuario actual establecido:', userWithoutPassword);
        } else {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
            console.log('Sesión cerrada');
        }
    },

    // OBTENER USUARIO ACTUAL
    getCurrentUser: function() {
        const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        console.log('Usuario actual obtenido:', user);
        return user ? JSON.parse(user) : null;
    },

    // CERRAR SESIÓN
    logout: function() {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        console.log('Sesión cerrada');
    },

    // ELIMINAR RESERVA
    deleteReservation: function(id) {
        const reservations = this.getReservations();
        const filtered = reservations.filter(r => r.id !== id);
        this.saveReservations(filtered);
        console.log('Reserva eliminada:', id);
    },

    // ACTUALIZAR RESERVA
    updateReservation: function(id, data) {
        const reservations = this.getReservations();
        const index = reservations.findIndex(r => r.id === id);
        if (index === -1) return false;
        
        reservations[index] = { ...reservations[index], ...data };
        this.saveReservations(reservations);
        console.log('Reserva actualizada:', reservations[index]);
        return true;
    },

    // VERIFICAR CREDENCIALES
    checkCredentials: function(email, password) {
        const users = this.getUsers();
        console.log('Verificando credenciales para:', email);
        console.log('Usuarios disponibles:', users);
        
        const user = users.find(u => u.email === email && u.password === password);
        console.log('Usuario encontrado:', user);
        return user || null;
    }
};

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateFutureDate(date) {
    const selected = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected >= today;
}

function isTimeSlotAvailable(date, time, excludeId = null) {
    const reservations = StorageService.getReservations();
    return !reservations.some(r => 
        r.date === date && 
        r.time === time && 
        r.status !== 'cancelled' &&
        r.id !== excludeId
    );
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function showAlert(message, type = 'info', containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.log('No container for alert:', message);
        return;
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    container.innerHTML = '';
    container.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) alertDiv.remove();
    }, 5000);
}

// INICIALIZAR DATOS AL CARGAR
StorageService.initializeData();
console.log('Sistema inicializado. Usuarios:', StorageService.getUsers());