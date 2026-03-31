import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { authService } from '../services/authService';
import Sidebar from '../components/Sidebar';
import {
    AlertTriangle, CheckCircle2, ShieldAlert, Loader2,
    TrendingUp, TrendingDown, Search, RefreshCw, Brain, Info
} from 'lucide-react';

const severityConfig = {
    high: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: ShieldAlert, label: 'HIGH RISK' },
    medium: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, label: 'REVIEW' },
    low: { color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', icon: Info, label: 'LOW RISK' },
    normal: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2, label: 'NORMAL' },
    info: { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', icon: Info, label: 'INFO' },
};

const AnomalyDetection = () => {
    const [data, setData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all | anomalies | normal

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [anomalyData, profileData] = await Promise.all([
                analyticsService.getAnomalies(),
                authService.getProfile(),
            ]);
            setData(anomalyData);
            setProfile(profileData);
        } catch (err) {
            console.error('Anomaly fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto" />
                <p className="text-slate-500 font-medium">Running ML anomaly detection…</p>
            </div>
        </div>
    );

    const savingsRate = profile?.monthly_income > 0
        ? Math.round(((profile.monthly_income - profile.monthly_expenses) / profile.monthly_income) * 100)
        : 0;

    const items = data?.anomalies || [];
    const filteredItems = filter === 'anomalies'
        ? items.filter(i => i.is_anomaly)
        : filter === 'normal'
            ? items.filter(i => !i.is_anomaly)
            : items;

    const anomalyCount = data?.anomaly_count || 0;
    const hasHighRisk = items.some(i => i.severity === 'high');

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar savingsRate={savingsRate} />
            <div className="flex-1 lg:ml-72 p-6 lg:p-12">
                <div className="max-w-5xl mx-auto space-y-10">

                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-red-500" />
                                </div>
                                <h1 className="text-4xl font-black text-slate-900">Anomaly Radar</h1>
                            </div>
                            <p className="text-slate-500 font-medium ml-1">
                                ML-powered (Isolation Forest) fraud & mistake detection across your portfolio.
                            </p>
                        </div>
                        <button
                            onClick={fetchAll}
                            className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-bold text-sm text-slate-600"
                        >
                            <RefreshCw className="w-4 h-4" /> Re-scan
                        </button>
                    </header>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Scanned', value: data?.total || 0, color: 'text-slate-900' },
                            { label: 'Anomalies Found', value: anomalyCount, color: anomalyCount > 0 ? 'text-red-500' : 'text-emerald-500' },
                            { label: 'High Risk', value: items.filter(i => i.severity === 'high').length, color: 'text-red-500' },
                            { label: 'Clear', value: items.filter(i => !i.is_anomaly).length, color: 'text-emerald-500' },
                        ].map((card, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <div className={`text-3xl font-black ${card.color}`}>{card.value}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{card.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Alert Banner */}
                    {anomalyCount > 0 && (
                        <div className={`p-6 rounded-2xl border-2 flex items-start gap-4 ${hasHighRisk ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                            <ShieldAlert className={`w-6 h-6 mt-0.5 flex-shrink-0 ${hasHighRisk ? 'text-red-500' : 'text-amber-500'}`} />
                            <div>
                                <p className={`font-black text-base ${hasHighRisk ? 'text-red-700' : 'text-amber-700'}`}>
                                    {hasHighRisk ? '⚠️ High-Risk Transactions Detected' : 'Unusual Patterns Found'}
                                </p>
                                <p className="text-sm font-medium text-slate-600 mt-1">{data?.summary}</p>
                            </div>
                        </div>
                    )}

                    {anomalyCount === 0 && items.length > 0 && (
                        <div className="p-6 rounded-2xl border-2 bg-emerald-50 border-emerald-200 flex items-center gap-4">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                            <p className="font-bold text-emerald-700">{data?.summary}</p>
                        </div>
                    )}

                    {/* Filter Tabs */}
                    <div className="flex gap-2 flex-wrap">
                        {['all', 'anomalies', 'normal'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${filter === f
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'
                                    }`}
                            >
                                {f === 'all' ? `All (${items.length})` : f === 'anomalies' ? `Flagged (${anomalyCount})` : `Clean (${items.filter(i => !i.is_anomaly).length})`}
                            </button>
                        ))}
                    </div>

                    {/* Results List */}
                    {items.length === 0 ? (
                        <div className="bg-white rounded-3xl p-16 text-center border border-slate-100">
                            <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">No investment data to analyze. Add investments first.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredItems.map((item, idx) => {
                                const cfg = severityConfig[item.severity] || severityConfig.info;
                                const Icon = cfg.icon;
                                return (
                                    <div
                                        key={idx}
                                        className={`bg-white rounded-2xl p-6 border-2 transition-all ${item.is_anomaly ? cfg.border : 'border-slate-100'}`}
                                    >
                                        <div className="flex items-start justify-between gap-4 flex-wrap">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                                    <Icon className={`w-6 h-6 ${cfg.color}`} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 text-lg leading-tight">{item.name}</div>
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.type}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 flex-wrap">
                                                <div className="text-right">
                                                    <div className="text-2xl font-black text-slate-900">₹{Number(item.amount).toLocaleString('en-IN')}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</div>
                                                </div>
                                                <div className={`px-4 py-2 rounded-full ${cfg.bg} ${cfg.border} border`}>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        <div className={`mt-4 p-4 rounded-xl ${cfg.bg} text-sm font-medium ${item.is_anomaly ? cfg.color : 'text-slate-600'}`}>
                                            {item.reason}
                                        </div>

                                        {/* Confidence Bar */}
                                        {item.is_anomaly && item.confidence > 0 && (
                                            <div className="mt-3">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                                    <span>Anomaly Confidence</span>
                                                    <span className={cfg.color}>{item.confidence}%</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-700 ${item.severity === 'high' ? 'bg-red-500' : item.severity === 'medium' ? 'bg-amber-400' : 'bg-sky-400'}`}
                                                        style={{ width: `${item.confidence}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ML Explainability Note */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 flex gap-3">
                        <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-500 font-medium">
                            <span className="font-black text-slate-700">How it works:</span> This feature uses an{' '}
                            <span className="font-bold">Isolation Forest</span> ML algorithm trained on your own transaction amounts.
                            It identifies entries that are statistically "isolated" from your spending norm — a common pattern for fraud or data entry errors.
                            Minimum 3 transactions required for meaningful detection.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnomalyDetection;
