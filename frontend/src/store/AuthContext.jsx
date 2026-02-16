import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const response = await api.post('token/', { username, password });
        const { access, refresh } = response.data;

        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);

        // In a real app we might fetch user profile here.
        // For now, we'll just set the username.
        const userData = { username };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        return response.data;
    };

    const signup = async (username, password, email) => {
        const response = await api.post('signup/', { username, password, email });
        const { access, refresh, user: userData } = response.data;

        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
