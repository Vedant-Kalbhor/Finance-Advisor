import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import {
    User, Wallet, Activity, Save, Loader2,
    LogOut, Briefcase, Calendar, TrendingUp,
    LayoutDashboard, PieChart, Target, Settings,
    ChevronRight, ArrowUpRight, ArrowDownRight,
    Shield, CreditCard, DollarSign
} from 'lucide-react';

const Dashboard = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await authService.getProfile();
                setProfile(data);
            } catch (err) {
                console.error('Failed to fetch profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const updated = await authService.updateProfile(profile);
            setProfile(updated);
        } catch (err) {
            alert('Update failed. Verify your connection.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg blur-xl animate-pulse" />
                </div>
            </div>
        </div>
    );

    const savingsRate = profile?.monthly_income > 0
        ? Math.round(((profile.monthly_income - profile.monthly_expenses) / profile.monthly_income) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-background text-slate-200 flex overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-surface/30 backdrop-blur-3xl border-r border-slate-800 hidden lg:flex flex-col p-8 transition-all">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-2xl shadow-primary/20">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-black text-2xl tracking-tighter text-white">Finance<span className="text-primary">AI</span></span>
                </div>

                <nav className="flex-1 space-y-2">
                    {[
                        { icon: LayoutDashboard, label: 'Overview', active: true },
                        { icon: PieChart, label: 'Analytics' },
                        { icon: Target, label: 'Goals' },
                        { icon: Briefcase, label: 'Assets' },
                        { icon: Settings, label: 'Security' },
                    ].map((item) => (
                        <button
                            key={item.label}
                            className={item.active ? 'nav-item-active w-full' : 'nav-item w-full'}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-bold text-sm">{item.label}</span>
                            {item.active && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
                        </button>
                    ))}
                </nav>

                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-accent-success" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Growth Plan</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Your saving rate is <span className="text-accent-success">{savingsRate}%</span> better than average.</p>
                </div>

                <button
                    onClick={() => { authService.logout(); window.location.href = '/login'; }}
                    className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-accent-danger hover:bg-accent-danger/5 rounded-2xl transition-all font-bold text-sm"
                >
                    <LogOut className="w-5 h-5" />
                    Terminate Session
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-12 lg:py-12 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
                <div className="max-w-6xl mx-auto space-y-12">

                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-2">Workspace</p>
                            <h1 className="text-5xl font-black text-white">Global Overview</h1>
                        </div>
                        <div className="flex gap-3">
                            <div className="bg-surface-light border border-slate-700 p-1 rounded-2xl hidden md:flex">
                                <button className="px-6 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xl">Real-time</button>
                                <button className="px-6 py-2.5 text-slate-500 text-xs font-bold rounded-xl hover:text-white transition-colors">History</button>
                            </div>
                        </div>
                    </header>

                    {/* Top Line Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Total Income', val: `₹${profile?.monthly_income || 0}`, icon: ArrowUpRight, color: 'text-accent-success', bg: 'bg-accent-success/10' },
                            { label: 'Estimated Spend', val: `₹${profile?.monthly_expenses || 0}`, icon: ArrowDownRight, color: 'text-accent-danger', bg: 'bg-accent-danger/10' },
                            { label: 'Savings Rate', val: `${savingsRate}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
                        ].map((stat, i) => (
                            <div key={i} className="glass-card p-6 flex flex-col justify-between h-40 group hover:border-slate-600 transition-colors">
                                <div className="flex justify-between items-start">
                                    <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">{stat.label}</span>
                                    <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-white">{stat.val}</div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleUpdate} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Identity Group */}
                        <div className="xl:col-span-2 space-y-8">
                            <section className="glass-card p-8 lg:p-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                                        <User className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Identity & Career</h3>
                                        <p className="text-sm text-slate-500 font-medium">Core information for AI context.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Current Age</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                            <input
                                                type="number"
                                                value={profile?.age || ''}
                                                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                                                className="input-dark pl-12"
                                                placeholder="25"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Professional Title</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                            <input
                                                type="text"
                                                value={profile?.occupation || ''}
                                                onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                                                className="input-dark pl-12"
                                                placeholder="e.g. Lead Developer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="bg-primary/5 border border-primary/10 p-8 rounded-[2.5rem] relative overflow-hidden group">
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-white">Save Infrastructure Changes</h3>
                                        <p className="text-slate-400 font-medium">Click to synchronize your profile with our servers.</p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="btn-premium px-12 py-5 shadow-2xl group/btn"
                                    >
                                        {updating ? <Loader2 className="w-6 h-6 animate-spin text-slate-950" /> : (
                                            <>
                                                <Save className="w-6 h-6" />
                                                Synchronize Data
                                                <ArrowUpRight className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-primary/30 transition-all" />
                            </div>
                        </div>

                        {/* Financial Config Group */}
                        <div className="space-y-8">
                            <section className="glass-card p-8 lg:p-10 flex flex-col h-full">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-accent-success/10 rounded-2xl flex items-center justify-center border border-accent-success/20">
                                        <DollarSign className="w-6 h-6 text-accent-success" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Finance Config</h3>
                                        <p className="text-sm text-slate-500 font-medium">Monthly cashflow tuning.</p>
                                    </div>
                                </div>

                                <div className="space-y-6 flex-1">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Monthly Yield (₹)</label>
                                        <div className="relative group">
                                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-accent-success transition-colors" />
                                            <input
                                                type="number"
                                                value={profile?.monthly_income || ''}
                                                onChange={(e) => setProfile({ ...profile, monthly_income: e.target.value })}
                                                className="input-dark pl-12 text-accent-success font-bold"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Monthly Burn (₹)</label>
                                        <div className="relative group">
                                            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-accent-danger transition-colors" />
                                            <input
                                                type="number"
                                                value={profile?.monthly_expenses || ''}
                                                onChange={(e) => setProfile({ ...profile, monthly_expenses: e.target.value })}
                                                className="input-dark pl-12 text-accent-danger font-bold"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-800 space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-bold uppercase tracking-widest">Risk Tolerance</span>
                                            <span className="text-primary font-black uppercase tracking-tighter">{profile?.risk_profile}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {['Conservative', 'Moderate', 'Aggressive'].map((level) => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => setProfile({ ...profile, risk_profile: level })}
                                                    className={`flex-1 py-3 px-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${profile?.risk_profile === level
                                                            ? 'bg-primary text-slate-950 shadow-lg shadow-primary/20'
                                                            : 'bg-slate-900 text-slate-500 hover:bg-slate-800'
                                                        }`}
                                                >
                                                    {level.substring(0, 3)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
