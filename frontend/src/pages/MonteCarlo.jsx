import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { advisoryService } from '../services/advisoryService';
import { authService } from '../services/authService';
import Sidebar from '../components/Sidebar';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import {
    Target, TrendingUp, Loader2, RefreshCw,
    BarChart3, Zap, ChevronRight, CheckCircle2, AlertTriangle
} from 'lucide-react';

const probabilityColor = (p) => {
    if (p >= 80) return 'text-emerald-500';
    if (p >= 50) return 'text-amber-500';
    return 'text-red-500';
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl text-sm min-w-[200px]">
                <p className="font-black mb-2">Month {label}</p>
                {payload.map((p, i) => (
                    <div key={i} className="flex justify-between gap-4">
                        <span className="text-slate-400">{p.name}</span>
                        <span className="font-bold">₹{Number(p.value).toLocaleString('en-IN')}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const MonteCarlo = () => {
    const [goals, setGoals] = useState([]);
    const [profile, setProfile] = useState(null);
    const [selectedGoalId, setSelectedGoalId] = useState(null);
    const [simulation, setSimulation] = useState(null);
    const [loadingGoals, setLoadingGoals] = useState(true);
    const [loadingSim, setLoadingSim] = useState(false);

    useEffect(() => {
        fetchGoals();
    }, []);

    useEffect(() => {
        if (selectedGoalId) runSimulation(selectedGoalId);
    }, [selectedGoalId]);

    const fetchGoals = async () => {
        try {
            const [goalsData, profileData] = await Promise.all([
                advisoryService.getGoals(),
                authService.getProfile(),
            ]);
            setGoals(goalsData);
            setProfile(profileData);
            if (goalsData.length > 0) setSelectedGoalId(goalsData[0].id);
        } catch (err) {
            console.error('Monte Carlo fetch error:', err);
        } finally {
            setLoadingGoals(false);
        }
    };

    const runSimulation = async (goalId) => {
        setLoadingSim(true);
        setSimulation(null);
        try {
            const result = await analyticsService.getMonteCarlo(goalId);
            setSimulation(result);
        } catch (err) {
            console.error('Simulation error:', err);
        } finally {
            setLoadingSim(false);
        }
    };

    const savingsRate = profile?.monthly_income > 0
        ? Math.round(((profile.monthly_income - profile.monthly_expenses) / profile.monthly_income) * 100)
        : 0;

    if (loadingGoals) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-12 h-12 text-accent animate-spin" />
        </div>
    );

    // Build chart data from cone_data
    const chartData = simulation?.cone_data?.map(pt => ({
        month: pt.month,
        'Pessimistic (P10)': pt.p10,
        'Conservative (P25)': pt.p25,
        'Median (P50)': pt.p50,
        'Optimistic (P75)': pt.p75,
        'Bullish (P90)': pt.p90,
    })) || [];

    const prob = simulation?.probability_of_success || 0;
    const selectedGoal = goals.find(g => g.id === selectedGoalId);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar savingsRate={savingsRate} />
            <div className="flex-1 lg:ml-72 p-6 lg:p-12">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* Header */}
                    <header>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-accent" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900">Monte Carlo Engine</h1>
                        </div>
                        <p className="text-slate-500 font-medium ml-1">
                            1,000 simulated market paths with volatility — see the real probability of hitting your goals.
                        </p>
                    </header>

                    {goals.length === 0 ? (
                        <div className="bg-white rounded-3xl p-20 text-center border border-slate-100">
                            <Target className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">No goals found. Create financial goals first in the Strategy page.</p>
                        </div>
                    ) : (
                        <>
                            {/* Goal Selector */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Select Goal to Simulate</p>
                                <div className="flex flex-wrap gap-3">
                                    {goals.map(goal => (
                                        <button
                                            key={goal.id}
                                            onClick={() => setSelectedGoalId(goal.id)}
                                            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all ${selectedGoalId === goal.id
                                                    ? 'bg-slate-900 text-white shadow-lg'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                        >
                                            {goal.name}
                                            <span className="ml-2 text-[10px] opacity-60">₹{Number(goal.target_amount).toLocaleString('en-IN')}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {loadingSim ? (
                                <div className="bg-white rounded-3xl p-20 text-center border border-slate-100">
                                    <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
                                    <p className="text-slate-500 font-medium">Running 1,000 market simulations…</p>
                                    <p className="text-xs text-slate-400 mt-1">This may take a moment.</p>
                                </div>
                            ) : simulation && (
                                <>
                                    {/* Probability Banner */}
                                    <div className={`rounded-3xl p-8 border-2 ${prob >= 80 ? 'bg-emerald-50 border-emerald-200' : prob >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-5">
                                                <div className={`text-6xl font-black ${probabilityColor(prob)}`}>{prob}%</div>
                                                <div>
                                                    <p className="text-xl font-black text-slate-900">
                                                        {prob >= 80 ? '✅ High Confidence' : prob >= 50 ? '⚠️ Moderate Confidence' : '❌ Low Confidence'}
                                                    </p>
                                                    <p className="text-sm font-medium text-slate-600 mt-1 max-w-md">{simulation.summary}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-right">
                                                <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-slate-100">
                                                    <div className="text-lg font-black text-emerald-500">₹{Number(simulation.optimistic_final_value).toLocaleString('en-IN')}</div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bullish (P90)</div>
                                                </div>
                                                <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-slate-100">
                                                    <div className="text-lg font-black text-slate-700">₹{Number(simulation.median_final_value).toLocaleString('en-IN')}</div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Median (P50)</div>
                                                </div>
                                                <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-slate-100">
                                                    <div className="text-lg font-black text-red-400">₹{Number(simulation.pessimistic_final_value).toLocaleString('en-IN')}</div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bearish (P10)</div>
                                                </div>
                                                <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-slate-100">
                                                    <div className="text-lg font-black text-accent">₹{Number(simulation.monthly_sip).toLocaleString('en-IN')}</div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly SIP</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Probability Cone Chart */}
                                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                                        <h3 className="text-xl font-black text-slate-900 mb-2">Probability Cone</h3>
                                        <p className="text-sm text-slate-500 mb-6 font-medium">
                                            Each band shows the range of portfolio values across 1,000 simulated market scenarios.
                                            The wider the cone, the higher the market uncertainty.
                                        </p>

                                        <div className="h-80">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="p90" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="p50" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="p10" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15} />
                                                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey="month"
                                                        tickFormatter={v => `M${v}`}
                                                        tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
                                                    />
                                                    <YAxis
                                                        tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`}
                                                        tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
                                                        width={65}
                                                    />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <ReferenceLine
                                                        y={simulation.target_amount}
                                                        stroke="#10B981"
                                                        strokeDasharray="6 3"
                                                        strokeWidth={2}
                                                        label={{ value: 'Target', position: 'right', fontSize: 11, fill: '#10B981', fontWeight: 'bold' }}
                                                    />
                                                    <Area type="monotone" dataKey="Bullish (P90)" stroke="#10B981" strokeWidth={2} fill="url(#p90)" />
                                                    <Area type="monotone" dataKey="Median (P50)" stroke="#3B82F6" strokeWidth={2.5} fill="url(#p50)" strokeDasharray="" />
                                                    <Area type="monotone" dataKey="Pessimistic (P10)" stroke="#F59E0B" strokeWidth={2} fill="url(#p10)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <div className="flex flex-wrap gap-4 mt-4 justify-center">
                                            {['Bullish (P90)', 'Median (P50)', 'Pessimistic (P10)'].map((label, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    <div className={`w-3 h-1.5 rounded-full ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-blue-500' : 'bg-amber-400'}`} />
                                                    {label}
                                                </div>
                                            ))}
                                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                                                <div className="w-5 border-t-2 border-dashed border-emerald-400" />
                                                Goal Target
                                            </div>
                                        </div>
                                    </div>

                                    {/* Simulation Metadata */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Simulations Run', value: simulation.n_simulations?.toLocaleString() || '1,000' },
                                            { label: 'Risk Profile', value: simulation.risk_profile },
                                            { label: 'Months Horizon', value: simulation.months_to_target },
                                            { label: 'Early Hit Prob', value: `${simulation.early_hit_prob}%` },
                                        ].map((m, i) => (
                                            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                                                <div className="text-xl font-black text-slate-900">{m.value}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{m.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MonteCarlo;
