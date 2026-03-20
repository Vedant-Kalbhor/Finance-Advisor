import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { investmentService } from '../services/investmentService';
import { advisoryService } from '../services/advisoryService';
import {
    User, Wallet, Activity, Save, Loader2,
    TrendingUp, ChevronRight, ArrowUpRight,
    DollarSign, Bell, MapPin, Briefcase, MessageCircle,
    Download, PieChart as PieChartIcon, Target
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Sidebar from '../components/Sidebar';
import IndicesWidget from '../components/IndicesWidget';
import { reportService } from '../services/reportService';

const COLORS = ['#10B981', '#111827', '#6B7280', '#3B82F6', '#8B5CF6'];

const Dashboard = () => {
    const [profile, setProfile] = useState(null);
    const [investments, setInvestments] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const navigate = useNavigate();
    const dashboardRef = useRef();

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [profileData, investmentData, goalsData] = await Promise.all([
                    authService.getProfile(),
                    investmentService.getInvestments(),
                    advisoryService.getGoals()
                ]);
                setProfile(profileData);
                setInvestments(investmentData);
                setGoals(goalsData);
            } catch (err) {
                console.error('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
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

    const downloadPDF = async () => {
        try {
            setLoading(true); // Show loader while AI generates report
            await reportService.downloadReport('Overview');
        } catch (err) {
            alert('Failed to generate professional report.');
        } finally {
            setLoading(false);
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

    const portfolioTotal = investments.reduce((sum, inv) => sum + inv.amount, 0);

    // Process chart data
    const chartData = investments.reduce((acc, inv) => {
        const existing = acc.find(item => item.name === inv.type);
        if (existing) {
            existing.value += inv.amount;
        } else {
            acc.push({ name: inv.type, value: inv.amount });
        }
        return acc;
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar savingsRate={savingsRate} />

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 p-6 lg:p-12">
                <div ref={dashboardRef} className="max-w-5xl mx-auto space-y-12 pb-12">

                    <header className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 leading-tight">Advisor Overview</h1>
                            <p className="text-slate-500 font-medium">Monitoring your financial ecosystem.</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={downloadPDF}
                                className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-slate-600"
                            >
                                <Download className="w-4 h-4" />
                                Report
                            </button>
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black hover:scale-105 transition-all cursor-pointer shadow-lg shadow-primary/20">
                                {profile?.full_name?.charAt(0) || 'U'}
                            </div>
                        </div>
                    </header>

                    {/* Market Indices Widget */}
                    <IndicesWidget />

                    {/* Core Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Income', val: `₹${profile?.monthly_income || 0}`, icon: DollarSign, color: 'text-accent', bg: 'bg-accent/10' },
                            { label: 'Expenses', val: `₹${profile?.monthly_expenses || 0}`, icon: Activity, color: 'text-red-600', bg: 'bg-red-50' },
                            { label: 'Portfolio', val: `₹${portfolioTotal.toLocaleString()}`, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Efficiency', val: `${savingsRate}%`, icon: TrendingUp, color: 'text-slate-900', bg: 'bg-slate-100' },
                        ].map((stat, i) => (
                            <div key={i} className="premium-card p-6 bg-white flex flex-col justify-between h-40">
                                <div className="flex justify-between items-start">
                                    <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                </div>
                                <div className="mt-4">
                                    <div className="text-2xl font-black text-slate-900 leading-none mb-1">{stat.val}</div>
                                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{stat.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Asset Breakdown Chart */}
                        <section className="premium-card p-8 bg-white overflow-hidden flex flex-col">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5 text-accent" />
                                Asset Allocation
                            </h3>
                            <div className="h-[250px] w-full">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 font-medium italic">No assets registered.</div>
                                )}
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                                {chartData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Top Goals Tracking */}
                        <section className="premium-card p-8 bg-white">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                <Target className="w-5 h-5 text-slate-900" />
                                Active Strategy Progress
                            </h3>
                            <div className="space-y-6">
                                {goals.length > 0 ? goals.slice(0, 3).map((goal, i) => {
                                    const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100) || 0);
                                    return (
                                        <div key={goal.id} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <div className="font-black text-slate-900 leading-none mb-1">{goal.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        ₹{goal.current_amount.toLocaleString()} / ₹{goal.target_amount.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="text-accent font-black text-sm">{progress}%</div>
                                            </div>
                                            <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-accent transition-all duration-1000"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="py-12 text-center text-slate-400 font-medium italic">No strategies defined yet.</div>
                                )}
                                {goals.length > 3 && (
                                    <button
                                        onClick={() => navigate('/goals')}
                                        className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-t border-slate-50 mt-4 hover:text-accent transition-colors"
                                    >
                                        View all strategies
                                    </button>
                                )}
                            </div>
                        </section>
                    </div>

                    <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                        <div className="lg:col-span-2 space-y-8">
                            <section className="premium-card p-10 bg-white shadow-xl shadow-slate-200/50">
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
                            <section className="premium-card p-10 bg-white h-fit">
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

                {/* Floating Chat Button */}
                <button
                    onClick={() => navigate('/chatbot')}
                    className="fixed bottom-8 right-8 w-16 h-16 bg-accent rounded-full flex items-center justify-center shadow-2xl shadow-accent/30 hover:scale-110 active:scale-95 transition-all z-50 group"
                    title="Chat with AI Advisor"
                    id="chatbot-fab"
                >
                    <MessageCircle className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" />
                </button>
            </main>
        </div>
    );
};

export default Dashboard;
