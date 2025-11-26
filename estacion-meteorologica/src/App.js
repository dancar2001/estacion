import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Login from './components/Login';
import EstudiantesView from './components/EstudiantesView';
import ProfesoresView from './components/ProfesoresView';
import AdministrativosView from './components/AdministrativosView';

// ============================================================================
// CONFIGURACIÓN DE API
// ============================================================================

const API_BASE_URL = 'https://dancar.pythonanywhere.com';

// Configurar axios con token
const setupAxios = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// ============================================================================
// APP PRINCIPAL
// ============================================================================

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ========================================================================
  // VERIFICAR AUTENTICACIÓN AL CARGAR
  // ========================================================================

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = Cookies.get('access_token');
        
        console.log('Token en cookies:', token ? 'Existe' : 'No existe');
        
        if (token) {
          setupAxios(token);
          
          try {
            // Intentar obtener datos del usuario desde el Backend
            const response = await axios.get(`${API_BASE_URL}/api/me/`);
            
            console.log('Usuario obtenido:', response.data);
            
            // Formatear usuario
            setCurrentUser({
              id: response.data.id,
              nombre: response.data.first_name || response.data.username,
              username: response.data.username,
              email: response.data.email,
              rol: response.data.rol,
              rol_display: response.data.rol_display || response.data.rol,
            });
          } catch (err) {
            console.error('Error obteniendo usuario:', err);
            // Si falla obtener usuario, pero hay token, seguir con usuario vacío
            // o intentar con datos del token
            setCurrentUser(null);
          }
        } else {
          console.log('No hay token en cookies');
        }
      } catch (err) {
        console.error('Error verificando autenticación:', err);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // ========================================================================
  // FUNCIÓN LOGIN
  // ========================================================================

  const handleLogin = async (username, password) => {
    try {
      setError(null);
      setLoading(true);

      console.log('Intentando login con usuario:', username);

      // Obtener token del backend
      const response = await axios.post('https://dancar.pythonanywhere.com/api-token-auth/', {
        username,
        password,
      });

      console.log('Respuesta de token:', response.data);

      const { access, refresh } = response.data;

      // Guardar tokens en cookies
      Cookies.set('access_token', access, { expires: 1 });
      Cookies.set('refresh_token', refresh, { expires: 7 });

      console.log('Tokens guardados en cookies');

      // Configurar axios con el token
      setupAxios(access);

      // Obtener datos del usuario desde el Backend
      const userResponse = await axios.get(`${API_BASE_URL}/me/`);
      
      console.log('Datos del usuario:', userResponse.data);
      
      // Formatear usuario
      const user = {
        id: userResponse.data.id,
        nombre: userResponse.data.first_name || userResponse.data.username,
        username: userResponse.data.username,
        email: userResponse.data.email,
        rol: userResponse.data.rol,
        rol_display: userResponse.data.rol_display || userResponse.data.rol,
      };
      
      console.log('Usuario formateado:', user);
      
      setCurrentUser(user);
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Error al iniciar sesión';
      setError(errorMsg);
      console.error('Error en login:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // FUNCIÓN LOGOUT
  // ========================================================================

  const handleLogout = () => {
    console.log('Logout ejecutado');
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };

  // ========================================================================
  // RENDERING
  // ========================================================================

  // Pantalla de carga inicial
  if (loading && !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar login
  if (!currentUser) {
    return <Login onLogin={handleLogin} error={error} />;
  }

  // Usuario autenticado, mostrar la app
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER */}
      <header className="bg-green-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🌾 Sistema Meteorológico - Campus Milagro</h1>
            <p className="text-sm text-green-100">Universidad Agraria del Ecuador</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold">{currentUser?.nombre || 'Usuario'}</p>
              <p className="text-xs text-green-100">{currentUser?.rol_display || 'Sin rol'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-green-600 hover:bg-green-800 px-4 py-2 rounded-lg flex items-center gap-2 transition duration-200"
            >
              <LogOut size={18} />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* ESTUDIANTE */}
        {currentUser?.rol === 'estudiante' && (
          <EstudiantesView 
            user={currentUser} 
            apiBaseUrl={API_BASE_URL}
            onLogout={handleLogout}
          />
        )}

        {/* PROFESOR */}
        {currentUser?.rol === 'profesor' && (
          <ProfesoresView 
            user={currentUser} 
            apiBaseUrl={API_BASE_URL}
            onLogout={handleLogout}
          />
        )}

        {/* ADMINISTRATIVO */}
        {currentUser?.rol === 'administrativo' && (
          <AdministrativosView 
            user={currentUser} 
            apiBaseUrl={API_BASE_URL}
            onLogout={handleLogout}
          />
        )}

        {/* FALLBACK - USUARIO SIN ROL */}
        {!currentUser?.rol && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600 text-lg">Error: Tu usuario no tiene rol asignado.</p>
            <button
              onClick={handleLogout}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Volver a Login
            </button>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">© 2025 Universidad Agraria del Ecuador - Campus Milagro</p>
          <p className="text-xs text-gray-400 mt-1">
            Prototipo de Estación Meteorológica Experimental
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
