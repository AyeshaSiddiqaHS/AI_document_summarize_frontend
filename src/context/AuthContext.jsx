import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [isAuthenticated, setIsAuthenticated] = useState(!!token);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchCurrentUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchCurrentUser = async () => {
        try {
            setLoading(true);
            const response = await api.get('/auth/me');
            setUser(response.data);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        const response = await api.post('/auth/login', formData);
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        setToken(access_token);
        setIsAuthenticated(true);
        await fetchCurrentUser();
        return response.data;
    };

    const register = async (formData) => {
        const response = await api.post('/auth/register', formData);
        return response.data; // UserResponse
    };

    const logout = async () => {
        try {
            // Call API to revoke token if we have one
            if (token) {
                await api.post('/auth/logout');
            }
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Always clear local state even if API fails
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, register, logout, fetchCurrentUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
