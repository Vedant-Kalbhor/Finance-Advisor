import React, { useState, useEffect } from 'react';
import { taxService } from '../services/advisoryService';
import { authService } from '../services/authService';
import Sidebar from '../components/Sidebar';
import {
    Calculator, Shield, TrendingUp, AlertCircle,
    ChevronRight, ArrowRight, Loader2, Info,
    CheckCircle2, Landmark, PieChart
} from 'lucide-react';

const TaxPlanner = () => {
    const [data, setData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSavingsInfo, setShowSavingsInfo] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [taxData, profileData] = await Promise.all([
                taxService.getEstimate(),
                authService.getProfile()
            ]);
            setData(taxData);
            setProfile(profileData);
        } catch (err) {
            console.error('Error fetching tax data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRegime = async (regime) => {
        try {
            await authService.updateProfile({ ...profile, tax_regime: regime });
            fetchData();
        } catch (err) {
            alert('Failed to update regime');
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

    const recommendedRegime = data?.recommendation;
    const isOptimized = profile?.tax_regime === recommendedRegime;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar savingsRate={savingsRate} />
            <div className="flex-1 lg:ml-72 p-6 lg:p-12">
                <div className="max-w-6xl mx-auto space-y-10">

                    <header className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 leading-tight">Tax Optimizer</h1>
                            <p className="text-slate-500 font-medium">Indian Income Tax planning & liability reduction.</p>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border ${isOptimized ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                            {isOptimized ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            <span className="text-xs font-black uppercase tracking-widest">
                                {isOptimized ? 'Optimized' : 'Action Required'}
                            </span>
                        </div>
                    </header>

                    {/* Regimes Comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <section className={`premium-card p-10 bg-white border-2 transition-all ${profile?.tax_regime === 'New' ? 'border-accent shadow-xl' : 'border-transparent opacity-60'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">New Regime</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Simplified Default (FY 24-25)</p>
                                </div>
                                {recommendedRegime === 'New' && (
                                    <span className="bg-accent text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Recommended</span>
                                )}
                            </div>
                            <div className="text-4xl font-black text-slate-900 mb-8">
                                ₹{data?.new_regime.final_tax.toLocaleString()}
                                <span className="text-sm font-bold text-slate-400 ml-2">yearly tax</span>
                            </div>
                            <div className="space-y-4 mb-8">
                                {data?.new_regime.breakdown.map((slab, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">{slab.slab} ({slab.rate})</span>
                                        <span className="font-bold text-slate-900">₹{slab.tax.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => handleUpdateRegime('New')}
                                disabled={profile?.tax_regime === 'New'}
                                className={`w-full py-4 rounded-2xl font-black transition-all ${profile?.tax_regime === 'New' ? 'bg-accent text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            >
                                {profile?.tax_regime === 'New' ? 'Current Regime' : 'Switch to New'}
                            </button>
                        </section>

                        <section className={`premium-card p-10 bg-white border-2 transition-all ${profile?.tax_regime === 'Old' ? 'border-accent shadow-xl' : 'border-transparent opacity-60'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">Old Regime</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Deductions allowed (80C, 80D)</p>
                                </div>
                                {recommendedRegime === 'Old' && (
                                    <span className="bg-accent text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Recommended</span>
                                )}
                            </div>
                            <div className="text-4xl font-black text-slate-900 mb-8">
                                ₹{data?.old_regime.final_tax.toLocaleString()}
                                <span className="text-sm font-bold text-slate-400 ml-2">yearly tax</span>
                            </div>
                            <div className="space-y-4 mb-8">
                                {data?.old_regime.breakdown.map((slab, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">{slab.slab} ({slab.rate})</span>
                                        <span className="font-bold text-slate-900">₹{slab.tax.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => handleUpdateRegime('Old')}
                                disabled={profile?.tax_regime === 'Old'}
                                className={`w-full py-4 rounded-2xl font-black transition-all ${profile?.tax_regime === 'Old' ? 'bg-accent text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            >
                                {profile?.tax_regime === 'Old' ? 'Current Regime' : 'Switch to Old'}
                            </button>
                        </section>
                    </div>

                    {/* Tax Savings Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 premium-card p-8 bg-slate-900 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-accent" />
                                    Optimization Insights
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="p-4 bg-white/10 rounded-2xl">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Taxable Income</div>
                                            <div className="text-2xl font-black">₹{data?.new_regime.taxable_income.toLocaleString()}</div>
                                        </div>
                                        <div className="p-4 bg-white/10 rounded-2xl">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cess (4%)</div>
                                            <div className="text-2xl font-black">₹{data?.new_regime.cess.toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                            {recommendedRegime === 'New'
                                                ? "Based on your income, the New Regime is more tax-efficient even without deductions."
                                                : "By utilizing Section 80C and 80D, you can save significant tax in the Old Regime."}
                                        </p>
                                        <button className="flex items-center gap-2 text-accent font-black uppercase text-xs tracking-widest hover:translate-x-2 transition-transform">
                                            Download Tax Report
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        </div>

                        <div className="premium-card p-8 bg-white border border-slate-100">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                <Landmark className="w-5 h-5 text-slate-400" />
                                Section 80C
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilized</span>
                                        <div className="text-xl font-black text-slate-900">₹{data?.savings_potential["80C_total"].toLocaleString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-black">limit 1.5L</span>
                                    </div>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent transition-all duration-1000"
                                        style={{ width: `${Math.min(100, (data?.savings_potential["80C_total"] / 150000) * 100)}%` }}
                                    />
                                </div>
                                <div className="space-y-1.5 pt-2">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-slate-400">Manual (Static)</span>
                                        <span className="text-slate-900">₹{profile?.deductions_80c.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-slate-400">Automated Assets</span>
                                        <span className="text-accent">₹{data?.savings_potential["80C_automated"].toLocaleString()}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 font-medium pt-2 border-t border-slate-50">
                                    Remaining: <span className="text-slate-900 font-black">₹{data?.savings_potential["80C_remaining"].toLocaleString()}</span>.
                                    Add more ELSS assets to automate this.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TaxPlanner;
