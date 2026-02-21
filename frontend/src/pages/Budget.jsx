/**
 * Budget Page
 * ============
 * Personalized Budget Generation page.
 * Users can generate AI-powered budget plans, view allocation breakdowns,
 * read AI explanations, and browse their budget history.
 * 
 * Styling matches the existing premium design system:
 * - White/slate background, emerald accent (#10B981)
 * - premium-card, input-premium, btn-accent component classes
 * - Inter font, rounded corners, subtle shadows
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { budgetService } from '../services/budgetService';
import { authService } from '../services/authService';
import {
    Loader2, ArrowLeft, Sparkles, PieChart, Wallet,
    TrendingUp, ShieldCheck, Banknote, CreditCard,
    ChevronDown, ChevronUp, Clock, ArrowUpRight,
    LayoutDashboard, Target, Briefcase, Settings,
    Shield, LogOut, RefreshCw, MapPin
} from 'lucide-react';

const Budget = () => {
    // ─── State Management ───────────────────────────────────
    const [profile, setProfile] = useState(null);         // User's financial profile
    const [budget, setBudget] = useState(null);            // Current generated budget
    const [history, setHistory] = useState([]);             // Past budget history
    const [loading, setLoading] = useState(true);           // Initial page load
    const [generating, setGenerating] = useState(false);    // Budget generation in progress
    const [showHistory, setShowHistory] = useState(false);  // Toggle history section
    const [error, setError] = useState('');                 // Error messages

    // Form overrides (optional — user can tweak before generating)
    const [formData, setFormData] = useState({
        income: '',
        expenses: '',
        location: '',
        risk_profile: '',
    });

    const navigate = useNavigate();

    // ─── Fetch Profile & Latest Budget on Mount ─────────────
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Load user's saved profile
                const profileData = await authService.getProfile();
                setProfile(profileData);

                // Pre-fill the form with profile data
                setFormData({
                    income: profileData.monthly_income || '',
                    expenses: profileData.monthly_expenses || '',
                    location: profileData.location || '',
                    risk_profile: profileData.risk_profile || 'Moderate',
                });

                // Try to load the latest budget (may not exist yet)
                try {
                    const latestBudget = await budgetService.getLatestBudget();
                    setBudget(latestBudget);
                } catch {
                    // No budget yet — that's fine
                }

                // Load budget history
                try {
                    const historyData = await budgetService.getBudgetHistory();
                    setHistory(historyData.budgets || []);
                } catch {
                    // No history — also fine
                }
            } catch (err) {
                console.error('Failed to load data:', err);
                setError('Failed to load profile data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // ─── Generate Budget Handler ────────────────────────────
    const handleGenerate = async () => {
        setGenerating(true);
        setError('');
        try {
            // Send form data to the AI budget generator
            const result = await budgetService.generateBudget({
                income: parseFloat(formData.income) || undefined,
                expenses: parseFloat(formData.expenses) || undefined,
                location: formData.location || undefined,
                risk_profile: formData.risk_profile || undefined,
            });
            setBudget(result);

            // Refresh history to include the new budget
            const historyData = await budgetService.getBudgetHistory();
            setHistory(historyData.budgets || []);
        } catch (err) {
            const detail = err.response?.data?.detail || 'Failed to generate budget. Please try again.';
            setError(detail);
        } finally {
            setGenerating(false);
        }
    };

    // ─── Loading State ──────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
                <p className="text-slate-400 font-bold animate-pulse">Loading Budget Advisor...</p>
            </div>
        </div>
    );

    // ─── Savings Rate Calculation ───────────────────────────
    const savingsRate = profile?.monthly_income > 0
        ? Math.round(((profile.monthly_income - profile.monthly_expenses) / profile.monthly_income) * 100)
        : 0;

    // ─── Budget Allocation Cards Data ───────────────────────
    const allocationCards = budget ? [
        {
            label: 'Needs',
            amount: budget.needs_amount,
            pct: budget.needs_pct,
            icon: ShieldCheck,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            desc: 'Essentials like rent, food, utilities'
        },
        {
            label: 'Wants',
            amount: budget.wants_amount,
            pct: budget.wants_pct,
            icon: CreditCard,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            border: 'border-purple-100',
            desc: 'Entertainment, dining, subscriptions'
        },
        {
            label: 'Savings',
            amount: budget.savings_amount,
            pct: budget.savings_pct,
            icon: Banknote,
            color: 'text-accent',
            bg: 'bg-accent/10',
            border: 'border-accent/20',
            desc: 'Emergency fund & safety net'
        },
        {
            label: 'Investments',
            amount: budget.investments_amount,
            pct: budget.investments_pct,
            icon: TrendingUp,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            desc: 'Wealth growth & future returns'
        },
    ] : [];

    return (
        <div className="min-h-screen bg-slate-50 flex">

            {/* ─── Sidebar (same as Dashboard) ─────────────────── */}
            <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col p-8 fixed h-full z-10">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-black text-2xl tracking-tighter text-slate-900">
                        Finance <span className="text-accent">Advisor</span>
                    </span>
                </div>

                <nav className="flex-1 space-y-2">
                    {[
                        { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
                        { icon: PieChart, label: 'Budget', path: '/budget', active: true },
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

                {/* Global status indicator */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status</span>
                    </div>
                    <p className="text-xs text-slate-600 font-bold">
                        Saving: <span className="text-accent">{savingsRate}%</span>
                    </p>
                </div>

                <button
                    onClick={() => { authService.logout(); window.location.href = '/login'; }}
                    className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm mt-auto"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </aside>

            {/* ─── Main Content ────────────────────────────────── */}
            <main className="flex-1 lg:ml-72 p-6 lg:p-12">
                <div className="max-w-5xl mx-auto space-y-10">

                    {/* Header */}
                    <header className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-all lg:hidden"
                                >
                                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                                </button>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full">
                                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                                    <span className="text-[10px] font-black text-accent uppercase tracking-widest">AI Powered</span>
                                </div>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 leading-tight">Budget Planner</h1>
                            <p className="text-slate-500 font-medium">Generate your personalized monthly budget with AI.</p>
                        </div>
                    </header>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-semibold flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            {error}
                        </div>
                    )}

                    {/* ─── Input Section ───────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Income & Expenses */}
                        <section className="premium-card p-8 bg-white lg:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-accent/10 rounded-xl">
                                    <Wallet className="w-5 h-5 text-accent" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900">Financial Inputs</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Monthly Income (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.income}
                                        onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                                        className="input-premium text-accent font-black text-xl"
                                        placeholder="₹ 0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Monthly Expenses (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.expenses}
                                        onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
                                        className="input-premium text-red-600 font-black text-xl"
                                        placeholder="₹ 0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="input-premium pl-12"
                                            placeholder="e.g. Mumbai, Delhi"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Risk Appetite</label>
                                    <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                                        {['Conservative', 'Moderate', 'Aggressive'].map((level) => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, risk_profile: level })}
                                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.risk_profile === level
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

                        {/* Generate Button Card */}
                        <section className="flex flex-col justify-between">
                            <div className="bg-slate-900 p-8 rounded-[2rem] flex flex-col items-center justify-center gap-6 shadow-2xl shadow-primary/20 h-full text-center">
                                <div className="p-4 bg-accent/20 rounded-2xl">
                                    <Sparkles className="w-8 h-8 text-accent" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white mb-1">AI Budget</h3>
                                    <p className="text-slate-400 text-sm font-medium">Generate your optimal allocation</p>
                                </div>
                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="btn-accent w-full py-4 shadow-2xl hover:scale-105 active:scale-95"
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-5 h-5" />
                                            Generate Budget
                                        </>
                                    )}
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* ─── Budget Results ───────────────────────────── */}
                    {budget && (
                        <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">

                            {/* Section Header */}
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-slate-200" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Budget Plan</span>
                                <div className="h-px flex-1 bg-slate-200" />
                            </div>

                            {/* Income Summary Bar */}
                            <div className="premium-card p-6 bg-white flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Budget For</span>
                                    <div className="text-3xl font-black text-slate-900 mt-1">₹{budget.income?.toLocaleString('en-IN')}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Generated</span>
                                    <div className="text-sm font-bold text-slate-500 mt-1">
                                        {new Date(budget.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Allocation Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {allocationCards.map((card, i) => (
                                    <div
                                        key={card.label}
                                        className={`premium-card p-6 bg-white border ${card.border} hover:shadow-elevated transition-all duration-300 group`}
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`p-2.5 rounded-xl ${card.bg}`}>
                                                <card.icon className={`w-5 h-5 ${card.color}`} />
                                            </div>
                                            <span className={`text-2xl font-black ${card.color}`}>
                                                {card.pct}%
                                            </span>
                                        </div>
                                        <div className="text-2xl font-black text-slate-900 mb-1">
                                            ₹{card.amount?.toLocaleString('en-IN')}
                                        </div>
                                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                            {card.label}
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">
                                            {card.desc}
                                        </p>

                                        {/* Visual percentage bar */}
                                        <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${card.label === 'Needs' ? 'bg-blue-500' :
                                                        card.label === 'Wants' ? 'bg-purple-500' :
                                                            card.label === 'Savings' ? 'bg-emerald-500' :
                                                                'bg-amber-500'
                                                    }`}
                                                style={{ width: `${card.pct}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* AI Explanation Card */}
                            <div className="premium-card p-8 bg-white">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2.5 bg-accent/10 rounded-xl">
                                        <Sparkles className="w-5 h-5 text-accent" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900">AI Explanation</h3>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                    <p className="text-slate-700 font-medium leading-relaxed">
                                        {budget.explanation}
                                    </p>
                                </div>
                            </div>

                            {/* Visual Breakdown Bar */}
                            <div className="premium-card p-6 bg-white">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Allocation Breakdown</h4>
                                <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                                    <div className="bg-blue-500 rounded-l-full transition-all duration-700" style={{ width: `${budget.needs_pct}%` }} title={`Needs: ${budget.needs_pct}%`} />
                                    <div className="bg-purple-500 transition-all duration-700" style={{ width: `${budget.wants_pct}%` }} title={`Wants: ${budget.wants_pct}%`} />
                                    <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${budget.savings_pct}%` }} title={`Savings: ${budget.savings_pct}%`} />
                                    <div className="bg-amber-500 rounded-r-full transition-all duration-700" style={{ width: `${budget.investments_pct}%` }} title={`Investments: ${budget.investments_pct}%`} />
                                </div>
                                <div className="flex justify-between mt-3 text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-blue-600">Needs {budget.needs_pct}%</span>
                                    <span className="text-purple-600">Wants {budget.wants_pct}%</span>
                                    <span className="text-emerald-600">Savings {budget.savings_pct}%</span>
                                    <span className="text-amber-600">Invest {budget.investments_pct}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Budget History ───────────────────────────── */}
                    {history.length > 0 && (
                        <div className="premium-card bg-white overflow-hidden">
                            {/* Toggle button */}
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-slate-100 rounded-xl">
                                        <Clock className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-black text-slate-900">Budget History</h3>
                                        <p className="text-xs text-slate-500 font-medium">{history.length} budget{history.length > 1 ? 's' : ''} generated</p>
                                    </div>
                                </div>
                                {showHistory
                                    ? <ChevronUp className="w-5 h-5 text-slate-400" />
                                    : <ChevronDown className="w-5 h-5 text-slate-400" />
                                }
                            </button>

                            {/* History entries */}
                            {showHistory && (
                                <div className="border-t border-slate-100">
                                    {history.map((entry, index) => (
                                        <div
                                            key={entry.id}
                                            className={`p-6 flex items-center justify-between hover:bg-slate-50 transition-all ${index < history.length - 1 ? 'border-b border-slate-100' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                                                    <PieChart className="w-5 h-5 text-accent" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900">
                                                        ₹{entry.income?.toLocaleString('en-IN')}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-medium">
                                                        {new Date(entry.created_at).toLocaleDateString('en-IN', {
                                                            day: 'numeric', month: 'short', year: 'numeric'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 text-xs font-black uppercase tracking-widest">
                                                <span className="text-blue-600">N:{entry.needs_pct}%</span>
                                                <span className="text-purple-600">W:{entry.wants_pct}%</span>
                                                <span className="text-emerald-600">S:{entry.savings_pct}%</span>
                                                <span className="text-amber-600">I:{entry.investments_pct}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty State — no budget generated yet */}
                    {!budget && !generating && (
                        <div className="premium-card p-16 bg-white text-center">
                            <div className="inline-flex p-4 bg-accent/10 rounded-2xl mb-6">
                                <PieChart className="w-10 h-10 text-accent" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">No Budget Yet</h3>
                            <p className="text-slate-500 font-medium max-w-md mx-auto">
                                Fill in your financial details above and click <span className="text-accent font-bold">Generate Budget</span> to
                                get your personalized AI-powered budget plan.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Budget;
