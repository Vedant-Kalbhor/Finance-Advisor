import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import {
    LayoutDashboard, PieChart, Target, Briefcase,
    Settings, Shield, LogOut
} from 'lucide-react';

const Sidebar = ({ savingsRate }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
        { icon: PieChart, label: 'Budget', path: '/budget' },
        { icon: Briefcase, label: 'Investments', path: '/investments' },
        { icon: Target, label: 'Goals', path: '#' },
        { icon: Settings, label: 'Preferences', path: '#' },
    ];

    return (
        <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col p-8 fixed h-full z-10">
            <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                    <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="font-black text-2xl tracking-tighter text-slate-900">Finance <span className="text-accent">Advisor</span></span>
            </div>

            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => item.path !== '#' && navigate(item.path)}
                        className={location.pathname === item.path ? 'nav-item-active w-full' : 'nav-item w-full'}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-bold text-sm">{item.label}</span>
                    </button>
                ))}
            </nav>

            {savingsRate !== undefined && (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status</span>
                    </div>
                    <p className="text-xs text-slate-600 font-bold">Saving: <span className="text-accent">{savingsRate}%</span></p>
                </div>
            )}

            <button
                onClick={() => { authService.logout(); window.location.href = '/login'; }}
                className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm mt-auto"
            >
                <LogOut className="w-5 h-5" />
                Logout
            </button>
        </aside>
    );
};

export default Sidebar;
