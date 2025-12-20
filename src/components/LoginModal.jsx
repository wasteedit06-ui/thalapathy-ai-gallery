import React, { useState } from 'react';
import { X, Loader, Lock } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './LoginModal.css';

const LoginModal = ({ onClose, onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            onLoginSuccess(data.user);
            onClose();
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to login. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-modal-overlay" onClick={onClose}>
            <div className="login-modal-content" onClick={e => e.stopPropagation()}>
                <button className="login-modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="login-header">
                    <div className="login-icon">
                        <Lock size={24} />
                    </div>
                    <h2>Admin Login</h2>
                    <p>Sign in to upload new images</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            required
                            className="login-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="login-input"
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader size={16} className="spinner" /> Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
