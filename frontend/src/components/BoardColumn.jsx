import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MoreHorizontal, Plus, Edit3, Trash2, Loader2 } from 'lucide-react';
import DraggableTask from './DraggableTask';

const BoardColumn = ({
    list,
    tasks,
    activeListMenu,
    setActiveListMenu,
    setEditingList,
    setEditListTitle,
    handleDeleteList,
    creatingInList,
    setCreatingInList,
    taskFormData,
    setTaskFormData,
    handleCreateTask,
    isSavingTask,
    handleDeleteTask,
    setEditingTask,
    boardMembers,
    handleAssignTask,
    canDeleteTask
}) => {
    const { setNodeRef } = useDroppable({
        id: list.id
    });

    return (
        <div ref={setNodeRef} className="w-[340px] flex-shrink-0 bg-white/10 backdrop-blur-md rounded-3xl flex flex-col h-full shadow-2xl border border-white/20 ring-1 ring-black/5 overflow-hidden transition-all duration-300">
            <div className="p-5 flex items-center justify-between relative border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                    <h3 className="font-black text-white text-xs tracking-widest uppercase py-1 px-3 bg-white/10 rounded-full shadow-sm border border-white/10 backdrop-blur-md">{list.title}</h3>
                    <span className="text-[10px] font-bold text-gray-300 bg-black/20 px-2 py-0.5 rounded-md border border-white/5">{tasks.length}</span>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setActiveListMenu(activeListMenu === list.id ? null : list.id)}
                        className="p-2 hover:bg-gray-200 rounded-xl text-gray-400 transition-colors"
                    >
                        <MoreHorizontal size={20} />
                    </button>

                    {activeListMenu === list.id && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveListMenu(null)} />
                            <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-2xl shadow-2xl border border-white/10 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => { setEditingList(list); setEditListTitle(list.title); setActiveListMenu(null); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-gray-300 hover:bg-white/5 transition-colors"
                                >
                                    <Edit3 size={14} /> <span>Rename List</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteList(list.id)}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 size={14} /> <span>Delete List</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar bg-gradient-to-b from-transparent to-black/5">
                <SortableContext id={list.id.toString()} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-4 min-h-[50px]">
                        {tasks.map((task) => (
                            <DraggableTask
                                key={task.id}
                                task={task}
                                onDelete={handleDeleteTask}
                                onEdit={(t) => {
                                    setEditingTask(t);
                                    setTaskFormData({ id: t.id, title: t.title, description: t.description || '', assigned_to: t.assigned_to || [] });
                                }}
                                boardMembers={boardMembers}
                                onAssign={handleAssignTask}
                                canDelete={canDeleteTask}
                            />
                        ))}
                    </div>
                </SortableContext>

                <button
                    onClick={() => { setCreatingInList(list.id); setTaskFormData({ id: null, title: '', description: '', assigned_to: [], priority: 'medium' }); }}
                    className="w-full flex items-center justify-center gap-2 p-4 mt-5 text-gray-400 hover:bg-white/5 hover:text-blue-400 rounded-2xl transition-all duration-300 text-xs font-black uppercase tracking-widest border-2 border-dashed border-white/5 hover:border-blue-400/30 hover:shadow-lg"
                >
                    <Plus size={16} />
                    <span>Add Task</span>
                </button>
            </div>
        </div>
    );
};

export default BoardColumn;
