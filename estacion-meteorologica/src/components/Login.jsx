import React, { useState } from 'react';

const Login = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);

    try {
      const success = await onLogin(username, password);
      if (!success) {
        setLocalError(error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setLocalError('Error inesperado');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-700">🌾</h1>
          <h2 className="text-2xl font-bold text-gray-800 mt-2">Estación Meteorológica</h2>
          <p className="text-gray-600 mt-2">Campus Milagro - UAA</p>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* USERNAME */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ingrese usuario"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              disabled={loading}
              required
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              disabled={loading}
              required
            />
          </div>

          {/* ERRORES */}
          {(localError || error) && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="text-sm">{localError || error}</p>
            </div>
          )}

          {/* BOTÓN */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* CREDENCIALES DE PRUEBA */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg text-sm text-gray-600 border border-green-200">
          <p className="font-semibold mb-2 text-green-700">🔐 Credenciales de prueba:</p>
          <p>Usuario: <code className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">admin</code></p>
          <p>Contraseña: <code className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">1234</code></p>
        </div>

        {/* FOOTER */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Universidad Agraria del Ecuador - Campus Milagro</p>
          <p>© 2025 - Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
