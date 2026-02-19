import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { User, Wallet, Target, Activity, Save, Loader2 } from 'lucide-react';

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
            alert('Profile updated successfully!');
        } catch (err) {
            alert('Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold gradient-text">Financial Profile</h1>
                        <p className="text-slate-400">Manage your financial foundation</p>
                    </div>
                    <button
                        onClick={() => { authService.logout(); window.location.href = '/login'; }}
                        className="text-slate-400 hover:text-white transition-all"
                    >
                        Logout
                    </button>
                </header>

                <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Info */}
                    <div className="glass-morphism p-6 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="w-5 h-5 text-primary-400" />
                            <h2 className="font-semibold text-lg">Personal Info</h2>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Age</label>
                            <input
                                type="number"
                                value={profile?.age || ''}
                                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                                className="w-full bg-slate-900/50 border border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Occupation</label>
                            <input
                                type="text"
                                value={profile?.occupation || ''}
                                onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                                className="w-full bg-slate-900/50 border border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Income & Expenses */}
                    <div className="glass-morphism p-6 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Wallet className="w-5 h-5 text-emerald-400" />
                            <h2 className="font-semibold text-lg">Financial Overview</h2>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Monthly Income (₹)</label>
                            <input
                                type="number"
                                value={profile?.monthly_income || ''}
                                onChange={(e) => setProfile({ ...profile, monthly_income: e.target.value })}
                                className="w-full bg-slate-900/50 border border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-emerald-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Monthly Expenses (₹)</label>
                            <input
                                type="number"
                                value={profile?.monthly_expenses || ''}
                                onChange={(e) => setProfile({ ...profile, monthly_expenses: e.target.value })}
                                className="w-full bg-slate-900/50 border border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-red-400"
                            />
                        </div>
                    </div>

                    {/* Risk Profile */}
                    <div className="glass-morphism p-6 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-5 h-5 text-indigo-400" />
                            <h2 className="font-semibold text-lg">Risk Profile</h2>
                        </div>
                        <select
                            value={profile?.risk_profile || 'Moderate'}
                            onChange={(e) => setProfile({ ...profile, risk_profile: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="Conservative">Conservative</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Aggressive">Aggressive</option>
                        </select>
                        <p className="text-xs text-slate-500 italic">
                            This helps the AI recommend investments that match your comfort level.
                        </p>
                    </div>

                    {/* Save Button */}
                    <div className="md:col-span-2 flex justify-end">
                        <button
                            disabled={updating}
                            onClick={handleUpdate}
                            className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl transition-all flex items-center gap-2 shadow-xl shadow-primary-900/30"
                        >
                            {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Dashboard;
