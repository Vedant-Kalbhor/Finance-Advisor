import React, { useState, useEffect } from 'react';
import { advisoryService } from '../services/advisoryService';
import Sidebar from '../components/Sidebar';
import { authService } from '../services/authService';
import {
    Plus, Target, TrendingUp, Calendar,
    Trash2, ChevronRight, Loader2, Sparkles,
    ArrowUpRight, AlertCircle, CheckCircle2
} from 'lucide-react';

const Goals = () => {
    const [goals, setGoals] = useState([]);
    const [recommendations, setRecommendations] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newGoal, setNewGoal] = useState({
        name: '',
        target_amount: '',
        target_date: '',
        category: 'Future'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [goalsData, recData, profileData] = await Promise.all([
                advisoryService.getGoals(),
                advisoryService.getRecommendations(),
                authService.getProfile()
            ]);
            setGoals(goalsData);
            setRecommendations(recData);
            setProfile(profileData);
        } catch (err) {
            console.error('Error fetching goals');
        } finally {
            setLoading(false);
        }
    };

    const handleAddGoal = async (e) => {
        e.preventDefault();
        try {
            await advisoryService.createGoal(newGoal);
            setShowModal(false);
            setNewGoal({ name: '', target_amount: '', target_date: '', category: 'Future' });
            fetchData();
        } catch (err) {
            alert('Failed to add goal');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this goal?')) {
            try {
                await advisoryService.deleteGoal(id);
                fetchData();
            } catch (err) {
                alert('Failed to delete');
            }
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="w-10 h-10 text-accent animate-spin" />
        </div>
    );

    const savingsRate = profile?.monthly_income > 0
        ? Math.round(((profile.monthly_income - profile.monthly_expenses) / profile.monthly_income) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar savingsRate={savingsRate} />
            <div className="flex-1 lg:ml-72 p-6 lg:p-12">
                <div className="max-w-6xl mx-auto space-y-10">

                    <header className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 leading-tight">Advisor Strategy</h1>
                            <p className="text-slate-500 font-medium">Goal-based planning & SIP orchestration.</p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-accent px-6 py-3 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            New Strategy
                        </button>
                    </header>

                    {/* Recommendations Banner */}
                    <div className={`p-8 rounded-[2.5rem] border-2 flex flex-col md:flex-row items-center justify-between gap-8 transition-all duration-500 ${recommendations?.is_feasible ? 'bg-accent/5 border-accent/20' : 'bg-amber-50 border-amber-100'}`}>
                        <div className="flex items-center gap-6">
                            <div className={`p-5 rounded-3xl ${recommendations?.is_feasible ? 'bg-accent text-white' : 'bg-amber-500 text-white'}`}>
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">{recommendations?.is_feasible ? 'Strategy Feasible' : 'Efficiency Gap Detected'}</h3>
                                <p className="text-slate-500 font-medium">{recommendations?.advice}</p>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <div className="text-3xl font-black text-slate-900">₹{recommendations?.total_required_sip.toLocaleString()}</div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Monthly Deployment Target</span>
                        </div>
                    </div>

                    {/* Goals List */}
                    <div className="grid grid-cols-1 gap-6">
                        {goals.length > 0 ? goals.map((goal) => {
                            const rec = recommendations?.goal_recommendations.find(r => r.goal_id === goal.id);
                            return (
                                <div key={goal.id} className="premium-card p-8 bg-white group hover:border-accent transition-all duration-300">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                                                <Target className="w-8 h-8 text-slate-900" />
                                            </div>
                                            <div>
                                                <div className="text-xl font-black text-slate-900 leading-none mb-2">{goal.name}</div>
                                                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(goal.target_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                                                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                    <span>Target: ₹{goal.target_amount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-10">
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-accent leading-none mb-1">₹{rec?.suggested_sip.toLocaleString()}</div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suggested SIP</span>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(goal.id)}
                                                className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-8 pt-8 border-t border-slate-50">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                            <span className="text-slate-400">Strategy Progress</span>
                                            <span className="text-accent">{Math.round((rec?.current_amount / goal.target_amount) * 100) || 0}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-accent transition-all duration-1000"
                                                style={{ width: `${(rec?.current_amount / goal.target_amount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="premium-card p-20 bg-white text-center">
                                <Target className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-medium italic">No active strategies. Define a goal to get AI advisor suggestions.</p>
                            </div>
                        )}
                    </div>

                    {/* New Goal Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-black text-slate-900">Define Strategy</h2>
                                    <button onClick={() => setShowModal(false)} className="text-slate-400">
                                        <Plus className="rotate-45 w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleAddGoal} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Goal Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="input-premium"
                                            placeholder="e.g. Retirement 2045"
                                            value={newGoal.name}
                                            onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Target (₹)</label>
                                            <input
                                                required
                                                type="number"
                                                className="input-premium"
                                                placeholder="10,00,000"
                                                value={newGoal.target_amount}
                                                onChange={(e) => setNewGoal({ ...newGoal, target_amount: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Target Date</label>
                                            <input
                                                required
                                                type="date"
                                                className="input-premium"
                                                value={newGoal.target_date}
                                                onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <button type="submit" className="btn-accent w-full py-5 text-lg shadow-2xl mt-4">
                                        Create Strategy
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Goals;
