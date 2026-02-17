// ========================================
// AUTENTICACIÓN - VERSIÓN CORREGIDA
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, iniciando auth.js');
    
    // ========================================
    // MANEJO DEL LOGIN
    // ========================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('Formulario de login encontrado');
        
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Intento de login...');
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            console.log('Email:', email);
            console.log('Password:', password);
            
            if (!email || !password) {
                showAlert('Complete todos los campos', 'danger');
                return;
            }
            
            // Buscar usuario directamente
            const users = StorageService.getUsers();
            console.log('Usuarios en sistema:', users);
            
            const user = users.find(u => u.email === email && u.password === password);
            console.log('Usuario encontrado:', user);
            
            if (user) {
                // Login exitoso
                StorageService.setCurrentUser(user);
                showAlert('¡Bienvenido! Redirigiendo...', 'success');
                
                // Redirigir según rol
                setTimeout(() => {
                    switch(user.role) {
                        case 'admin':
                            window.location.href = 'admin.html';
                            break;
                        case 'operator':
                            window.location.href = 'operator.html';
                            break;
                        default:
                            window.location.href = 'client.html';
                    }
                }, 1500);
            } else {
                showAlert('Credenciales incorrectas', 'danger');
                console.log('No se encontró usuario con esas credenciales');
            }
        });
    }
    
    // ========================================
    // MANEJO DEL REGISTRO
    // ========================================
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPass = document.getElementById('confirmPassword').value;
            
            // Validaciones
            if (!name || !email || !password || !confirmPass) {
                showAlert('Complete todos los campos', 'danger');
                return;
            }
            
            if (!validateEmail(email)) {
                showAlert('Email inválido', 'danger');
                return;
            }
            
            if (password.length < 6) {
                showAlert('La contraseña debe tener al menos 6 caracteres', 'danger');
                return;
            }
            
            if (password !== confirmPass) {
                showAlert('Las contraseñas no coinciden', 'danger');
                return;
            }
            
            // Verificar si el email ya existe
            const users = StorageService.getUsers();
            if (users.some(u => u.email === email)) {
                showAlert('Este email ya está registrado', 'danger');
                return;
            }
            
            // Crear nuevo usuario
            const newUser = {
                id: Date.now().toString(),
                name: name,
                email: email,
                password: password,
                role: 'client',
                createdAt: new Date().toISOString()
            };
            
            // Guardar usuario
            StorageService.saveUser(newUser);
            console.log('Nuevo usuario registrado:', newUser);
            
            showAlert('Registro exitoso! Redirigiendo al login...', 'success');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        });
    }
    
    // ========================================
    // VERIFICACIÓN DE ACCESO A PÁGINAS PROTEGIDAS
    // ========================================
    const currentPage = window.location.pathname.split('/').pop();
    const protectedPages = ['admin.html', 'operator.html', 'client.html'];
    const currentUser = StorageService.getCurrentUser();
    
    console.log('Página actual:', currentPage);
    console.log('Usuario actual:', currentUser);
    
    if (protectedPages.includes(currentPage)) {
        if (!currentUser) {
            console.log('No hay usuario, redirigiendo a login');
            window.location.href = 'login.html';
            return;
        }
        
        // Verificar permisos
        if (currentPage === 'admin.html' && currentUser.role !== 'admin') {
            window.location.href = 'unauthorized.html';
        } else if (currentPage === 'operator.html' && currentUser.role !== 'operator') {
            window.location.href = 'unauthorized.html';
        } else if (currentPage === 'client.html' && currentUser.role !== 'client') {
            window.location.href = 'unauthorized.html';
        }
    }
});

// ========================================
// FUNCIÓN DE CIERRE DE SESIÓN
// ========================================
function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        StorageService.logout();
        window.location.href = 'index.html';
    }
}