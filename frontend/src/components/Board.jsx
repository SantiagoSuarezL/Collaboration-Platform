import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Layout, Plus, MoreHorizontal, Users, Filter, Loader2, LogOut, History, Search, X, Check, Save, Edit3, Trash2 } from 'lucide-react';
import DraggableTask from './DraggableTask';
import BoardColumn from './BoardColumn';
import { useAuth } from '../store/AuthContext';
import ActivityLog from './ActivityLog';
import Sidebar from './Sidebar';
import useWebsocket from '../hooks/useWebsocket';
import api from '../services/api';

const Board = () => {
    // Board State
    const [board, setBoard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTask, setActiveTask] = useState(null);
    const [originalTaskState, setOriginalTaskState] = useState(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [lastActivityEvent, setLastActivityEvent] = useState(null);

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [activeListMenu, setActiveListMenu] = useState(null);

    // Task Creation/Editing State
    const [creatingInList, setCreatingInList] = useState(null);
    const [taskFormData, setTaskFormData] = useState({ title: '', description: '', assigned_to: [], priority: 'medium' });
    const [isSavingTask, setIsSavingTask] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    // List Management State
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [editingList, setEditingList] = useState(null);
    const [editListTitle, setEditListTitle] = useState('');

    const boardId = 1;
    const { user, logout } = useAuth();
    const { isConnected, lastMessage } = useWebsocket(boardId);

    // Auth & Permissions
    const canDeleteTask = useMemo(() => {
        if (!user || !board || !board.members) return false;
        // Check if user is the owner (super-admin for the board) or has 'admin' role in members
        // Also allow Django staff/superusers to delete if needed, but let's stick to board logic first.
        if (board.owner && board.owner.id === user.id) return true;
        const member = board.members.find(m => m.id === user.id);
        return member && member.role === 'admin';
    }, [user, board]);

    const fetchBoardData = useCallback(async () => {
        try {
            const response = await api.get(`boards/${boardId}/`);
            setBoard(response.data);
        } catch (error) {
            console.error('Error fetching board:', error);
        } finally {
            setIsLoading(false);
        }
    }, [boardId]);

    useEffect(() => {
        fetchBoardData();
    }, [fetchBoardData]);

    const [onlineUsers, setOnlineUsers] = useState(new Set());

    useEffect(() => {
        if (!lastMessage) return;
        const types = ['task_updated', 'task_created', 'task_deleted', 'task_moved', 'list_created', 'list_updated', 'list_deleted', 'member_added'];
        if (types.includes(lastMessage.type)) {
            fetchBoardData();
            setLastActivityEvent(lastMessage);
        }

        if (lastMessage.type === 'present_users') {
            setOnlineUsers(new Set(lastMessage.users));
        } else if (lastMessage.type === 'user_joined') {
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.add(lastMessage.user);
                return newSet;
            });
        } else if (lastMessage.type === 'user_left') {
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(lastMessage.user);
                return newSet;
            });
        }
    }, [lastMessage, fetchBoardData]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const filteredLists = useMemo(() => {
        if (!board) return [];
        const lowerSearch = searchTerm.toLowerCase();
        return board.lists.map(list => ({
            ...list,
            tasks: (list.tasks || []).filter(t =>
                t && t.title && (
                    t.title.toLowerCase().includes(lowerSearch) ||
                    (t.description && t.description.toLowerCase().includes(lowerSearch))
                )
            )
        }));
    }, [board, searchTerm]);

    // Task Handlers
    const handleCreateTask = async (listId) => {
        if (!taskFormData.title.trim()) return;
        setIsSavingTask(true);
        try {
            const list = board.lists.find(l => l.id === listId);
            const maxPos = list.tasks.length > 0 ? Math.max(...list.tasks.map(t => parseFloat(t.position))) : 0;
            const newPos = maxPos + 1000;

            await api.post('tasks/', {
                title: taskFormData.title,
                description: taskFormData.description,
                list: listId,
                position: newPos.toFixed(5),
                assigned_to_ids: taskFormData.assigned_to.map(u => u.id),
                priority: taskFormData.priority
            });

            setTaskFormData({ title: '', description: '', assigned_to: [], priority: 'medium' });
            setCreatingInList(null);
            fetchBoardData();
        } catch (err) { console.error(err); } finally { setIsSavingTask(false); }
    };

    const handleUpdateTask = async () => {
        if (!taskFormData.title.trim()) return;
        setIsSavingTask(true);
        try {
            await api.patch(`tasks/${taskFormData.id}/`, {
                title: taskFormData.title,
                description: taskFormData.description,
                assigned_to_ids: taskFormData.assigned_to.map(u => u.id),
                priority: taskFormData.priority
            });
            setEditingTask(null);
            setTaskFormData({ title: '', description: '', assigned_to: [], priority: 'medium' });
            fetchBoardData();
        } catch (err) { console.error(err); } finally { setIsSavingTask(false); }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await api.delete(`tasks/${taskId}/`);
            fetchBoardData();
        } catch (err) { console.error(err); }
    };

    // List Handlers
    const handleCreateList = async () => {
        if (!newListTitle.trim()) return;
        try {
            const maxPos = board.lists.length > 0 ? Math.max(...board.lists.map(l => parseFloat(l.position))) : 0;
            await api.post('lists/', {
                board: boardId,
                title: newListTitle,
                position: maxPos + 1000
            });
            setNewListTitle('');
            setIsCreatingList(false);
            fetchBoardData();
        } catch (err) { console.error(err); }
    };

    const handleDeleteList = async (listId) => {
        if (!window.confirm('Are you sure you want to delete this list and all its tasks?')) return;
        try {
            await api.delete(`lists/${listId}/`);
            setActiveListMenu(null);
            fetchBoardData();
        } catch (err) { console.error(err); }
    };

    const handleRenameList = async () => {
        if (!editListTitle.trim()) return;
        try {
            await api.patch(`lists/${editingList.id}/`, { title: editListTitle });
            setEditingList(null);
            fetchBoardData();
        } catch (err) { console.error(err); }
    };

    const findContainer = (id) => {
        if (!board) return null;
        if (board.lists.find(l => l.id === id)) return id;
        const list = board.lists.find(l => (l.tasks || []).some(t => t && t.id === id));
        return list ? list.id : null;
    };

    const handleDragStart = ({ active }) => {
        const task = board.lists.flatMap(l => l.tasks).find(t => t && t.id === active.id);
        setActiveTask(task);
        if (task) {
            setOriginalTaskState({
                listId: findContainer(active.id),
                position: task.position
            });
        }
    };

    const handleDragOver = ({ active, over }) => {
        if (!over) return;
        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(over.id);
        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        setBoard(prev => {
            const activeList = prev.lists.find(l => l.id === activeContainer);
            const overList = prev.lists.find(l => l.id === overContainer);
            if (!activeList || !overList) return prev;

            const activeItems = activeList.tasks;
            const overItems = overList.tasks;
            const activeIndex = activeItems.findIndex(t => t && t.id === active.id);
            const overIndex = overItems.findIndex(t => t && t.id === over.id);

            let newIndex = overIndex === -1 ? overItems.length : overIndex;
            const taskToMove = activeItems[activeIndex];
            if (!taskToMove) return prev;

            return {
                ...prev,
                lists: prev.lists.map(list => {
                    if (list.id === activeContainer) return { ...list, tasks: list.tasks.filter(t => t && t.id !== active.id) };
                    if (list.id === overContainer) {
                        const newTasks = [...list.tasks];
                        newTasks.splice(newIndex, 0, { ...taskToMove, list: overContainer });
                        return { ...list, tasks: newTasks };
                    }
                    return list;
                })
            };
        });
    };

    const handleDragEnd = async ({ active, over }) => {
        setActiveTask(null);
        if (!over) {
            fetchBoardData();
            return;
        }

        const activeId = active.id;
        const overId = over.id;
        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer) return;

        const currentList = board.lists.find(l => l.id === overContainer);
        const tasks = currentList.tasks;
        const activeIndex = tasks.findIndex(t => t && t.id === activeId);
        const overIndex = tasks.findIndex(t => t && t.id === overId);

        let newPos = 0;
        const prev = tasks[overIndex - 1];
        const next = tasks[overIndex + 1];

        if (!prev && !next) newPos = 1000;
        else if (!prev) newPos = parseFloat(next.position) / 2;
        else if (!next) newPos = parseFloat(prev.position) + 1000;
        else newPos = (parseFloat(prev.position) + parseFloat(next.position)) / 2;

        const formattedPos = newPos.toFixed(5);

        // Skip if position and list haven't effectively changed
        if (activeContainer === originalTaskState?.listId &&
            Math.abs(parseFloat(formattedPos) - parseFloat(originalTaskState?.position)) < 0.0001) {
            console.log("No-op move detected, skipping API call");
            fetchBoardData(); // Restore optimistic state
            return;
        }

        try {
            await api.patch(`tasks/${activeId}/`, {
                list: overContainer,
                position: formattedPos
            });
            fetchBoardData();
        } catch (err) {
            console.error(err);
            fetchBoardData();
        }
    };

    return (
        <div className="flex h-screen w-screen bg-slate-900 font-sans overflow-hidden">
            <style>{`
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `}</style>
            <Sidebar
                boardName={board?.name}
                onCreateList={() => setIsCreatingList(true)}
                user={user}
                logout={logout}
                isConnected={isConnected}
                isHistoryOpen={isHistoryOpen}
                setIsHistoryOpen={setIsHistoryOpen}
            />

            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Background FX */}
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-900/20 via-blue-900/10 to-slate-900 pointer-events-none" />
                <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Top Bar */}
                <header className="h-16 flex items-center justify-between px-8 relative z-10 border-b border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-white tracking-tight">{board?.name || 'Project Board'}</h2>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex -space-x-2">
                            {(board?.members || []).map(m => (
                                <div key={m.id} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white">
                                    {m.username.substring(0, 2).toUpperCase()}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`flex items-center bg-white/5 rounded-xl transition-all duration-300 border border-white/5 hover:bg-white/10 ${showSearch ? 'w-64 px-3' : 'w-10 h-10 justify-center'}`}>
                            <button onClick={() => setShowSearch(!showSearch)} className="text-white/60 hover:text-white">
                                <Search size={18} />
                            </button>
                            {showSearch && (
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search tasks..."
                                    className="bg-transparent border-none outline-none text-white text-sm w-full ml-2 placeholder:text-white/30 h-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            )}
                        </div>
                        <button onClick={() => setIsHistoryOpen(true)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white border border-white/5 transition-colors">
                            <History size={18} />
                        </button>
                    </div>
                </header>

                <ActivityLog isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} lastEvent={lastActivityEvent} />

                {/* Board Area */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-8 flex gap-6 items-start z-10 custom-scrollbar">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        {filteredLists.map((list) => (
                            <BoardColumn
                                key={list.id}
                                list={list}
                                tasks={list.tasks}
                                activeListMenu={activeListMenu}
                                setActiveListMenu={setActiveListMenu}
                                setEditingList={setEditingList}
                                setEditListTitle={setEditListTitle}
                                handleDeleteList={handleDeleteList}
                                creatingInList={creatingInList}
                                setCreatingInList={setCreatingInList}
                                taskFormData={taskFormData}
                                setTaskFormData={setTaskFormData}
                                handleCreateTask={handleCreateTask}
                                isSavingTask={isSavingTask}
                                handleDeleteTask={handleDeleteTask}
                                setEditingTask={setEditingTask}
                                boardMembers={board?.members || []}
                                canDeleteTask={canDeleteTask}
                                handleAssignTask={async (taskId, userId) => {
                                    const currentTask = board.lists.flatMap(l => l.tasks).find(t => t.id === taskId);
                                    const isAssigned = currentTask.assigned_to.some(u => u.id === userId);
                                    const newAssignedIds = isAssigned
                                        ? currentTask.assigned_to.filter(u => u.id !== userId).map(u => u.id)
                                        : [...currentTask.assigned_to.map(u => u.id), userId];

                                    try {
                                        await api.patch(`tasks/${taskId}/`, { assigned_to_ids: newAssignedIds });
                                        fetchBoardData();
                                    } catch (err) { console.error(err); }
                                }}
                            />
                        ))}

                        <DragOverlay dropAnimation={{
                            sideEffects: defaultDropAnimationSideEffects({
                                styles: { active: { opacity: '0.8' } }
                            })
                        }}>
                            {activeTask ? <div className="w-[340px]"><DraggableTask task={activeTask} isOverlay /></div> : null}
                        </DragOverlay>
                    </DndContext >

                    {/* List Creation Modal (If active) or similar */}
                    {isCreatingList && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                                <h3 className="text-white font-bold mb-4">Create New List</h3>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="List Name..."
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-blue-500 mb-4"
                                    value={newListTitle}
                                    onChange={(e) => setNewListTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                                />
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setIsCreatingList(false)} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white">Cancel</button>
                                    <button onClick={handleCreateList} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm">Create List</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Rename List Modal */}
            {editingList && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Rename List</h2>
                            <button onClick={() => setEditingList(null)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <input
                                autoFocus
                                type="text"
                                className="w-full px-4 py-3 bg-black/20 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none font-bold text-white transition-all"
                                value={editListTitle}
                                onChange={(e) => setEditListTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleRenameList()}
                            />
                        </div>
                        <div className="p-6 bg-black/20 flex gap-3">
                            <button onClick={() => setEditingList(null)} className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-white">Cancel</button>
                            <button onClick={handleRenameList} className="flex-2 bg-blue-600 text-white px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-500 shadow-xl shadow-blue-900/20 transition-all">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {editingTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
                        {/* Header - Fixed */}
                        <div className="p-8 pb-4 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400"><Edit3 size={24} /></div>
                                <h2 className="text-xl font-black text-white tracking-tight">Edit Task</h2>
                            </div>
                            <button onClick={() => setEditingTask(null)} className="p-2.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-4 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 ml-1">Title</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-4 bg-black/20 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-white transition-all"
                                    value={taskFormData.title}
                                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 ml-1">Priority</label>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setTaskFormData({ ...taskFormData, priority: p })}
                                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all border-2 ${taskFormData.priority === p
                                                ? (p === 'high' ? 'bg-red-500/10 border-red-500 text-red-500' : p === 'medium' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-green-500/10 border-green-500 text-green-500')
                                                : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 ml-1">Description</label>
                                <textarea
                                    className="w-full px-5 py-4 bg-black/20 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none text-gray-300 text-sm min-h-[150px] resize-none transition-all leading-relaxed"
                                    value={taskFormData.description}
                                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 ml-1">Assigned Members</label>
                                <div className="flex flex-wrap gap-2">
                                    {(board?.members || []).map(member => {
                                        const isAssigned = (taskFormData.assigned_to || []).some(u => u.id === member.id);
                                        return (
                                            <button
                                                key={member.id}
                                                onClick={() => {
                                                    const newAssigned = isAssigned
                                                        ? taskFormData.assigned_to.filter(u => u.id !== member.id)
                                                        : [...taskFormData.assigned_to, member];
                                                    setTaskFormData({ ...taskFormData, assigned_to: newAssigned });
                                                }}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${isAssigned
                                                    ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-sm'
                                                    : 'bg-white/5 border-transparent text-gray-400 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${isAssigned ? 'bg-blue-600 text-white border-blue-400' : 'bg-white/10 text-gray-400 border-white/10'
                                                    }`}>
                                                    {member.username.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-xs font-bold">{member.username}</span>
                                                {isAssigned && <Check size={12} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer - Fixed */}
                        <div className="p-8 bg-black/20 flex items-center justify-end gap-3 flex-shrink-0 border-t border-white/5">
                            <button onClick={() => setEditingTask(null)} className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-white">Cancel</button>
                            <button
                                disabled={isSavingTask}
                                onClick={handleUpdateTask}
                                className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all flex items-center gap-2"
                            >
                                {isSavingTask ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {creatingInList && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
                        {/* Header - Fixed */}
                        <div className="p-8 pb-4 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400"><Plus size={24} /></div>
                                <h2 className="text-xl font-black text-white tracking-tight">Create Task</h2>
                            </div>
                            <button onClick={() => setCreatingInList(null)} className="p-2.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-4 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 ml-1">Title</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full px-5 py-4 bg-black/20 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-white transition-all"
                                    value={taskFormData.title}
                                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                                    placeholder="Task title..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 ml-1">Priority</label>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setTaskFormData({ ...taskFormData, priority: p })}
                                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all border-2 ${taskFormData.priority === p
                                                ? (p === 'high' ? 'bg-red-500/10 border-red-500 text-red-500' : p === 'medium' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-green-500/10 border-green-500 text-green-500')
                                                : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 ml-1">Description</label>
                                <textarea
                                    className="w-full px-5 py-4 bg-black/20 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none text-gray-300 text-sm min-h-[150px] resize-none transition-all leading-relaxed"
                                    value={taskFormData.description}
                                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                                    placeholder="Detailed description..."
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 ml-1">Assigned Members</label>
                                <div className="flex flex-wrap gap-2">
                                    {(board?.members || []).map(member => {
                                        const isAssigned = (taskFormData.assigned_to || []).some(u => u.id === member.id);
                                        return (
                                            <button
                                                key={member.id}
                                                onClick={() => {
                                                    const newAssigned = isAssigned
                                                        ? taskFormData.assigned_to.filter(u => u.id !== member.id)
                                                        : [...taskFormData.assigned_to, member];
                                                    setTaskFormData({ ...taskFormData, assigned_to: newAssigned });
                                                }}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${isAssigned
                                                    ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-sm'
                                                    : 'bg-white/5 border-transparent text-gray-400 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${isAssigned ? 'bg-blue-600 text-white border-blue-400' : 'bg-white/10 text-gray-400 border-white/10'
                                                    }`}>
                                                    {member.username.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-xs font-bold">{member.username}</span>
                                                {isAssigned && <Check size={12} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer - Fixed */}
                        <div className="p-8 bg-black/20 flex items-center justify-end gap-3 flex-shrink-0 border-t border-white/5">
                            <button onClick={() => setCreatingInList(null)} className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-white">Cancel</button>
                            <button
                                disabled={!taskFormData.title.trim() || isSavingTask}
                                onClick={() => handleCreateTask(creatingInList)}
                                className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-500 shadow-2xl shadow-blue-500/30 transition-all flex items-center gap-2"
                            >
                                {isSavingTask ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                <span>Create Task</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Board;
