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
            setError(err.response?.data?.detail || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                <div className="hidden lg:block space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full text-xs font-bold text-accent tracking-widest uppercase">
                        <Zap className="w-4 h-4" /> Smart Finance
                    </div>
                    <h2 className="text-6xl font-black text-slate-900 leading-tight">
                        Master your <span className="text-accent underline decoration-accent/30">finances</span> <br /> with AI precision.
                    </h2>
                    <div className="space-y-6">
                        {[
                            { title: 'Smart Analytics', desc: 'Automatic tracking of every transaction.' },
                            { title: 'AI Advisory', desc: 'Personalized wealth creation strategies.' },
                            { title: 'Bank-Grade Security', desc: 'Your data is encrypted and private.' }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className="mt-1">
                                    <CheckCircle className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">{item.title}</h4>
                                    <p className="text-slate-500 font-medium">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full max-w-md mx-auto">
                    <div className="premium-card p-10 bg-white shadow-elevated">
                        <div className="mb-8 font-black text-2xl flex items-center gap-2">
                            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            Finance Advisor
                        </div>
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-slate-900 mb-1">Create Profile</h1>
                            <p className="text-slate-500 text-sm font-medium">Join thousands of smart investors.</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 font-semibold">
                                <div className="w-2 h-2 rounded-full bg-red-600" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        className="input-premium pl-12"
                                        placeholder="John Doe"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        className="input-premium pl-12"
                                        placeholder="name@provider.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        className="input-premium pl-12"
                                        placeholder="Min. 8 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-accent w-full mt-6"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Get Started'}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-slate-500 text-sm font-medium">
                            Already have a profile?{' '}
                            <Link to="/login" className="text-accent font-bold hover:underline">
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
