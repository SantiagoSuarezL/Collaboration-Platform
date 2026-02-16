import React, { useState } from 'react';
import { Layout, Search, Clock, LogOut, Plus, Settings, BarChart2, Bell } from 'lucide-react';
import { useAuth } from '../store/AuthContext';

const Sidebar = ({
    boardName,
    onCreateList,
    user,
    logout,
    isConnected,
    isHistoryOpen,
    setIsHistoryOpen
}) => {
    return (
        <aside className="w-[280px] h-screen bg-slate-900 text-white flex flex-col border-r border-white/10 flex-shrink-0 z-50">
            {/* Logo Section */}
            <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
                <div className="p-2 bg-blue-600 rounded-lg">
                    <Layout size={20} className="text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight">HINTRO</span>
            </div>

            {/* Navigation Links (Mock) */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                <div className="px-2 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Workspace</div>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-blue-600/10 text-blue-400 rounded-xl font-medium transition-colors">
                    <Layout size={18} />
                    <span>Board View</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
                    <BarChart2 size={18} />
                    <span>Analytics</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
                    <Settings size={18} />
                    <span>Settings</span>
                </button>

                <div className="mt-8 px-2 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Projects</div>
                <div className="flex items-center gap-3 px-3 py-2 text-gray-300">
                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                    <span className="text-sm font-medium truncate">{boardName || 'Untitled Board'}</span>
                </div>
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-white/10 bg-black/20">
                {/* New List Button */}
                <button
                    onClick={onCreateList}
                    className="w-full flex items-center justify-center gap-2 p-3 mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus size={20} />
                    <span>New List</span>
                </button>

                {/* User Profile */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-sm font-bold shadow-lg">
                        {user?.username?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{user?.username}</div>
                        <div className="text-xs text-green-400 flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            {isConnected ? 'Online' : 'Offline'}
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
