import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/apiService';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Token is now handled by apiService interceptor

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (state.token) {
        try {
          const response = await apiService.getUserProfile();
          if (response.success !== false) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: response.user,
                token: state.token,
              },
            });
          } else {
            dispatch({ type: 'LOGOUT' });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, [state.token]);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiService.login(email, password);
      
      if (response.success !== false) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: response,
        });
        
        return { 
          success: true, 
          user: response.user,
          token: response.token
        };
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
        return {
          success: false,
          message: response.error || 'Login failed',
        };
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // Handle recruiter approval status
      if (error.response?.status === 403 && error.response?.data?.approvalStatus) {
        return {
          success: false,
          message: error.response.data.message,
          approvalStatus: error.response.data.approvalStatus,
          rejectionReason: error.response.data.rejectionReason
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiService.register(userData);
      
      if (response.success !== false) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: response,
        });
        
        return { success: true };
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
        return {
          success: false,
          message: response.error || 'Registration failed',
        };
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    dispatch({
      type: 'UPDATE_USER',
      payload: userData,
    });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
