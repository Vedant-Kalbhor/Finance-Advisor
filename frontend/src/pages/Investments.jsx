import React, { useState, useEffect } from 'react';
import { investmentService } from '../services/investmentService';
import { authService } from '../services/authService';
import {
    Plus, TrendingUp, Wallet, PieChart as PieChartIcon,
    Trash2, ExternalLink, Loader2, Edit2, ShieldCheck,
    ChevronRight, DollarSign, BarChart3
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import Sidebar from '../components/Sidebar';

const COLORS = ['#10B981', '#111827', '#6B7280', '#D1FAE5', '#374151'];

const Investments = () => {
    const [investments, setInvestments] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBrokerModal, setShowBrokerModal] = useState(false);
    const [brokerConfig, setBrokerConfig] = useState(null);
    const [brokerForm, setBrokerForm] = useState({
        api_key: '',
        api_secret: ''
    });
    const [newInvestment, setNewInvestment] = useState({
        name: '',
        type: 'Stock',
        amount: '',
        frequency: 'Monthly',
        expected_return: 12
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [invData, brokerData, profileData] = await Promise.all([
                investmentService.getInvestments(),
                investmentService.getBrokerConfig(),
                authService.getProfile()
            ]);
            setInvestments(invData);
            setBrokerConfig(brokerData);
            setBrokerForm({
                api_key: brokerData.api_key || '',
                api_secret: brokerData.api_secret || ''
            });
            setProfile(profileData);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddInvestment = async (e) => {
        e.preventDefault();
        try {
            await investmentService.createInvestment(newInvestment);
            setShowModal(false);
            setNewInvestment({ name: '', type: 'Stock', amount: '', frequency: 'Monthly', expected_return: 12 });
            fetchData();
        } catch (err) {
            alert('Failed to add investment');
        }
    };

    const handleBrokerUpdate = async (e) => {
        e.preventDefault();
        try {
            await investmentService.updateBrokerConfig({
                ...brokerForm,
                is_active: true
            });
            setShowBrokerModal(false);
            fetchData();
            alert('Zerodha integration updated. Portfolio sync will begin shortly.');
        } catch (err) {
            alert('Failed to update broker config');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this investment?')) {
            try {
                await investmentService.deleteInvestment(id);
                fetchData();
            } catch (err) {
                alert('Failed to delete');
            }
        }
    };

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

    const chartData = investments.reduce((acc, inv) => {
        const existing = acc.find(item => item.name === inv.type);
        if (existing) {
            existing.value += inv.amount;
        } else {
            acc.push({ name: inv.type, value: inv.amount });
        }
        return acc;
    }, []);

    const savingsRate = profile?.monthly_income > 0
        ? Math.round(((profile.monthly_income - profile.monthly_expenses) / profile.monthly_income) * 100)
        : 0;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="w-10 h-10 text-accent animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar savingsRate={savingsRate} />
            <div className="flex-1 lg:ml-72 p-6 lg:p-12">
                <div className="max-w-6xl mx-auto space-y-10">

                    <header className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 leading-tight">Investment Hub</h1>
                            <p className="text-slate-500 font-medium">Growth tracking & portfolio orchestration.</p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-accent px-6 py-3 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add Investment
                        </button>
                    </header>

                    {/* Global Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="premium-card p-8 bg-white flex flex-col justify-between h-44 border-l-8 border-accent">
                            <div className="flex justify-between items-start">
                                <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                                    <Wallet className="w-6 h-6" />
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-black text-slate-900">₹{totalInvested.toLocaleString()}</div>
                                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Total Assets Registered</span>
                            </div>
                        </div>

                        <div className="premium-card p-8 bg-slate-900 text-white flex flex-col justify-between h-44 relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-white/10 rounded-xl">
                                        <ShieldCheck className="w-5 h-5 text-accent" />
                                    </div>
                                </div>
                                <div className="text-xl font-bold">{brokerConfig?.is_active ? 'Zerodha Connected' : 'Broker Disconnected'}</div>
                                <p className="text-slate-400 text-xs mt-1">Live portfolio synchronization active.</p>
                            </div>
                            <button
                                onClick={() => setShowBrokerModal(true)}
                                className="relative z-10 flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 w-fit px-4 py-2 rounded-lg transition-all mt-4"
                            >
                                {brokerConfig?.is_active ? 'Manage Connection' : 'Connect Zerodha'}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -mr-10 -mt-10" />
                        </div>

                        <div className="premium-card p-8 bg-white flex flex-col justify-between h-44">
                            <div className="flex justify-between items-start">
                                <div className="p-3 rounded-2xl bg-slate-100 text-slate-900">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-black text-slate-900">12.4%</div>
                                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Overall Portfolio XIRR</span>
                            </div>
                        </div>
                    </div>

                    {/* Charts & Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <section className="premium-card p-8 bg-white">
                            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5 text-accent" />
                                Asset Allocation
                            </h3>
                            <div className="h-64">
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
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 font-medium italic">
                                        No data available. Add investments to see allocation.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="premium-card p-8 bg-white overflow-hidden">
                            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-slate-900" />
                                Investment List
                            </h3>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {investments.length > 0 ? investments.map((inv) => (
                                    <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                                                <TrendingUp className="w-5 h-5 text-accent" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 leading-none mb-1">{inv.name}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{inv.type} • {inv.frequency}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="font-black text-slate-900">₹{inv.amount.toLocaleString()}</div>
                                                <div className="text-[10px] font-bold text-accent">+{inv.expected_return}% est.</div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(inv.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10">
                                        <p className="text-slate-400 font-medium italic">Your investment vault is empty.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-black text-slate-900">Add Asset</h2>
                                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                                        <Plus className="rotate-45 w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleAddInvestment} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Asset Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="input-premium"
                                            placeholder="e.g. HDFC Flexi Cap"
                                            value={newInvestment.name}
                                            onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Asset Type</label>
                                            <select
                                                className="input-premium"
                                                value={newInvestment.type}
                                                onChange={(e) => setNewInvestment({ ...newInvestment, type: e.target.value })}
                                            >
                                                <option value="Stock">Stock</option>
                                                <option value="SIP">SIP</option>
                                                <option value="Mutual Fund">Mutual Fund</option>
                                                <option value="FD">FD</option>
                                                <option value="Gold">Gold</option>
                                                <option value="Cash">Cash</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Expected Return (%)</label>
                                            <input
                                                type="number"
                                                className="input-premium"
                                                value={newInvestment.expected_return}
                                                onChange={(e) => setNewInvestment({ ...newInvestment, expected_return: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Investment Amount (₹)</label>
                                        <input
                                            required
                                            type="number"
                                            className="input-premium text-accent font-black"
                                            placeholder="0.00"
                                            value={newInvestment.amount}
                                            onChange={(e) => setNewInvestment({ ...newInvestment, amount: Number(e.target.value) })}
                                        />
                                    </div>

                                    <button type="submit" className="btn-accent w-full py-5 text-lg shadow-2xl mt-4">
                                        Deploy Funds
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                </div>
            </div>
            {/* Broker Modal */}
            {showBrokerModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Broker Setup</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Zerodha Kite Connect</p>
                            </div>
                            <button onClick={() => setShowBrokerModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                                <Plus className="rotate-45 w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleBrokerUpdate} className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-accent mt-0.5" />
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                    Your API credentials are 256-bit encrypted. We only use them to fetch portfolio and holdings data once a day.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">API Key</label>
                                <input
                                    required
                                    type="text"
                                    className="input-premium"
                                    placeholder="Enter your Kite API Key"
                                    value={brokerForm.api_key}
                                    onChange={(e) => setBrokerForm({ ...brokerForm, api_key: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">API Secret</label>
                                <input
                                    required
                                    type="password"
                                    className="input-premium"
                                    placeholder="Enter your Kite API Secret"
                                    value={brokerForm.api_secret}
                                    onChange={(e) => setBrokerForm({ ...brokerForm, api_secret: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="btn-accent w-full py-5 text-lg shadow-2xl mt-4">
                                Authorize & Connect
                            </button>

                            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Don't have an API key? <a href="https://kite.trade" target="_blank" className="text-accent underline">Kite Trade</a>
                            </p>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Investments;
