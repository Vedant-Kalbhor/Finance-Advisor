import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import {
    User, Wallet, Activity, Save, Loader2,
    LogOut, Briefcase, Calendar, TrendingUp,
    LayoutDashboard, PieChart, Target, Settings,
    ChevronRight, ArrowUpRight, ArrowDownRight,
    Shield, CreditCard, DollarSign, Menu, Bell, MapPin
} from 'lucide-react';

const Dashboard = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const navigate = useNavigate();

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
            alert('Profile synced successfully.');
        } catch (err) {
            alert('Failed to sync data.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
                <p className="text-slate-400 font-bold animate-pulse">Initializing Advisor...</p>
            </div>
        </div>
    );

    const savingsRate = profile?.monthly_income > 0
        ? Math.round(((profile.monthly_income - profile.monthly_expenses) / profile.monthly_income) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col p-8 fixed h-full z-10">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-black text-2xl tracking-tighter text-slate-900">Finance <span className="text-accent">Advisor</span></span>
                </div>

                <nav className="flex-1 space-y-2">
                    {[
                        { icon: LayoutDashboard, label: 'Overview', active: true, path: '/dashboard' },
                        { icon: PieChart, label: 'Budget', path: '/budget' },
                        { icon: Target, label: 'Goals', path: '#' },
                        { icon: Briefcase, label: 'Investments', path: '#' },
                        { icon: Settings, label: 'Preferences', path: '#' },
                    ].map((item) => (
                        <button
                            key={item.label}
                            onClick={() => item.path !== '#' && navigate(item.path)}
                            className={item.active ? 'nav-item-active w-full' : 'nav-item w-full'}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-bold text-sm">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status</span>
                    </div>
                    <p className="text-xs text-slate-600 font-bold">Saving: <span className="text-accent">{savingsRate}%</span></p>
                </div>

                <button
                    onClick={() => { authService.logout(); window.location.href = '/login'; }}
                    className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm mt-auto"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 p-6 lg:p-12">
                <div className="max-w-5xl mx-auto space-y-12">

                    <header className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 leading-tight">Advisor Overview</h1>
                            <p className="text-slate-500 font-medium">Monitoring your financial ecosystem.</p>
                        </div>
                        <div className="flex gap-4">
                            <button className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                                <Bell className="w-5 h-5 text-slate-500" />
                            </button>
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black hover:scale-105 transition-all cursor-pointer shadow-lg shadow-primary/20">
                                {profile?.full_name?.charAt(0) || 'U'}
                            </div>
                        </div>
                    </header>

                    {/* Core Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { label: 'Income', val: `₹${profile?.monthly_income || 0}`, icon: DollarSign, color: 'text-accent', bg: 'bg-accent/10' },
                            { label: 'Expenses', val: `₹${profile?.monthly_expenses || 0}`, icon: Activity, color: 'text-red-600', bg: 'bg-red-50' },
                            { label: 'Efficiency', val: `${savingsRate}%`, icon: TrendingUp, color: 'text-slate-900', bg: 'bg-slate-100' },
                        ].map((stat, i) => (
                            <div key={i} className="premium-card p-8 bg-white flex flex-col justify-between h-44">
                                <div className="flex justify-between items-start">
                                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-slate-900">{stat.val}</div>
                                    <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{stat.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <section className="premium-card p-10 bg-white">
                                <div className="flex items-center gap-4 mb-8">
                                    <h3 className="text-xl font-black text-slate-900 leading-none">Personal Profile</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Age Range</label>
                                        <input
                                            type="number"
                                            value={profile?.age || ''}
                                            onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                                            className="input-premium"
                                            placeholder="e.g. 28"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Current Occupation</label>
                                        <input
                                            type="text"
                                            value={profile?.occupation || ''}
                                            onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                                            className="input-premium"
                                            placeholder="e.g. Product Manager"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Location</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                value={profile?.location || ''}
                                                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                                className="input-premium pl-12"
                                                placeholder="e.g. Mumbai, Delhi"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="bg-slate-900 p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-primary/20 group">
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-2 italic">Ready to optimize?</h3>
                                    <p className="text-slate-400 font-medium">Save your data to update AI recommendations.</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="btn-accent px-12 py-5 shadow-2xl hover:scale-105 active:scale-95 group/btn"
                                >
                                    {updating ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : (
                                        <>
                                            <Save className="w-6 h-6" />
                                            Sync Profile
                                            <ArrowUpRight className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <section className="premium-card p-10 bg-white h-full">
                                <h3 className="text-xl font-black text-slate-900 mb-8">Cashflow</h3>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Monthly Income</label>
                                        <input
                                            type="number"
                                            value={profile?.monthly_income || ''}
                                            onChange={(e) => setProfile({ ...profile, monthly_income: e.target.value })}
                                            className="input-premium text-accent font-black text-xl"
                                            placeholder="₹ 0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Monthly Expenses</label>
                                        <input
                                            type="number"
                                            value={profile?.monthly_expenses || ''}
                                            onChange={(e) => setProfile({ ...profile, monthly_expenses: e.target.value })}
                                            className="input-premium text-red-600 font-black text-xl"
                                            placeholder="₹ 0"
                                        />
                                    </div>

                                    <div className="pt-8 border-t border-slate-100">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 block">Risk Appetite</label>
                                        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                                            {['Conservative', 'Moderate', 'Aggressive'].map((level) => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => setProfile({ ...profile, risk_profile: level })}
                                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${profile?.risk_profile === level
                                                        ? 'bg-white text-accent shadow-sm border border-slate-100'
                                                        : 'text-slate-400 hover:text-slate-600'
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
