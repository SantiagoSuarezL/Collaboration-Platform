import React, { useState, useEffect, useCallback } from 'react';
import { X, History, User, Calendar, MessageSquare, ArrowRight, PlusCircle, Trash2, Edit3 } from 'lucide-react';
import api from '../services/api';

const ActivityLog = ({ isOpen, onClose, lastEvent }) => {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchActivities = useCallback(async () => {
        try {
            const response = await api.get('activity/');
            setActivities(response.data);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchActivities();
        }
    }, [isOpen, fetchActivities]);

    // Update list dynamically when a new event happens
    useEffect(() => {
        if (lastEvent) {
            fetchActivities();
        }
    }, [lastEvent, fetchActivities]);

    const getActionIcon = (action) => {
        const lowerAction = action.toLowerCase();
        if (lowerAction.includes('creada') || lowerAction.includes('creado')) return <PlusCircle size={14} className="text-green-500" />;
        if (lowerAction.includes('eliminada') || lowerAction.includes('eliminado')) return <Trash2 size={14} className="text-red-500" />;
        if (lowerAction.includes('movió') || lowerAction.includes('movido')) return <ArrowRight size={14} className="text-blue-500" />;
        return <Edit3 size={14} className="text-amber-500" />;
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: 'short'
        });
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            <div className={`fixed top-0 right-0 h-full w-[380px] bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-white/10 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full text-white">

                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-900/20">
                                <History size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">History</h2>
                                <p className="text-xs text-gray-400 font-medium">Real-time board activity</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                                <p className="text-sm">Loading activity...</p>
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6 text-center">
                                <MessageSquare size={48} className="mb-4 opacity-20" />
                                <p className="text-sm font-medium">No activity recorded yet.</p>
                                <p className="text-xs mt-1">Task movements and changes will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activities.map((item) => (
                                    <div key={item.id} className="group p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-200 backdrop-blur-sm">
                                        <div className="flex gap-3">
                                            <div className="mt-1">
                                                {getActionIcon(item.action)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-300 leading-relaxed break-words">
                                                    <span className="font-bold text-white">
                                                        {item.user?.username || 'System'}
                                                    </span>{' '}
                                                    {item.action}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                                                        <Calendar size={10} />
                                                        <span>{formatTimestamp(item.timestamp)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/10 bg-black/20">
                        <p className="text-[10px] text-center text-gray-500 font-bold uppercase tracking-[0.1em]">
                            Hintro Collaboration Platform v1.0
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ActivityLog;
