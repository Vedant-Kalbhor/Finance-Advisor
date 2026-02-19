import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await authService.login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid credentials. Please verify your login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
            {/* Decorative Blur */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-indigo/10 rounded-full blur-[120px] -z-10" />

            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex p-3 bg-primary/10 border border-primary/20 rounded-2xl mb-6 shadow-2xl shadow-primary/20">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">FinanceAI</h1>
                    <p className="text-slate-400 font-medium">Elevate your financial intelligence</p>
                </div>

                <div className="glass-card p-8 lg:p-10 relative overflow-hidden group">
                    {/* subtle shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                    {error && (
                        <div className="bg-accent-danger/10 border border-accent-danger/20 text-accent-danger p-4 rounded-2xl mb-6 text-sm font-semibold flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-danger animate-pulse" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    required
                                    className="input-dark pl-12"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between ml-1">
                                <label className="text-sm font-bold text-slate-300">Password</label>
                                <button type="button" className="text-xs font-semibold text-primary/80 hover:text-primary">Recovery</button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    className="input-dark pl-12"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-premium w-full group/btn"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-950" /> : (
                                <>
                                    Enter Dashboard
                                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-slate-400 text-sm font-medium">
                    New here?{' '}
                    <Link to="/register" className="text-primary hover:text-white transition-colors underline-offset-4 hover:underline">
                        Initiate Account
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
