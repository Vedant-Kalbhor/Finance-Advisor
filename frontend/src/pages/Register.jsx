import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { User, Lock, Mail, Loader2, Sparkles, CheckCircle, Zap } from 'lucide-react';

const Register = () => {
    const [fullName, setFullName] = useState('');
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
            await authService.register(email, password, fullName);
            await authService.login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration encountered an error. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-500/10 via-background to-background">
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                {/* Value Proposition Section */}
                <div className="hidden lg:block space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary tracking-widest uppercase">
                        <Zap className="w-4 h-4" /> Next-Gen Finance
                    </div>
                    <h2 className="text-6xl font-black text-white leading-tight">
                        Build your <span className="neon-text">wealth</span> <br /> with AI precision.
                    </h2>
                    <div className="space-y-6">
                        {[
                            { icon: CheckCircle, title: 'Smart Analytics', desc: 'Deep dive into your spending patterns automatically.' },
                            { icon: CheckCircle, title: 'AI Advisory', desc: 'Get personalized investment tips based on your profile.' },
                            { icon: CheckCircle, title: 'Military Grade', desc: 'Secure hashing and JWT encryption for your data.' }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className="mt-1">
                                    <item.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-lg">{item.title}</h4>
                                    <p className="text-slate-400 font-medium">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Section */}
                <div className="w-full max-w-md mx-auto">
                    <div className="glass-card p-10 relative">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                            <p className="text-slate-400 font-medium">Start your journey to financial freedom.</p>
                        </div>

                        {error && (
                            <div className="bg-accent-danger/10 border border-accent-danger/20 text-accent-danger p-4 rounded-2xl mb-6 text-sm flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-accent-danger" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-300 ml-1">Identity</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        required
                                        className="input-dark pl-12"
                                        placeholder="Your Full Name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-300 ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="email"
                                        required
                                        className="input-dark pl-12"
                                        placeholder="name@provider.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-300 ml-1">Secure Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="password"
                                        required
                                        className="input-dark pl-12"
                                        placeholder="Min. 8 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-premium w-full mt-6"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-950" /> : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Create Profile
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-slate-400 text-sm font-medium">
                            Already have a profile?{' '}
                            <Link to="/login" className="text-primary hover:text-white transition-colors underline-offset-4 hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
