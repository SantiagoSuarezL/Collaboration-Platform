import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, AlignLeft, Trash2, Edit2, UserPlus, Check } from 'lucide-react';

const DraggableTask = ({ task, isOverlay = false, onDelete, onEdit, boardMembers = [], onAssign, canDelete = false }) => {
    const [showAssignMenu, setShowAssignMenu] = React.useState(false);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: showAssignMenu ? 50 : undefined,
    };

    const containerClasses = `
        bg-black/20 backdrop-blur-md p-4 rounded-xl shadow-lg border transition-all duration-200 group relative
        ${isOverlay ? 'border-blue-400 shadow-2xl rotate-2 cursor-grabbing' : 'border-white/5 hover:border-blue-400/50 hover:bg-black/30 shadow-sm cursor-grab'}
        ${isDragging && !isOverlay ? 'opacity-30 border-dashed border-gray-500' : 'opacity-100'}
    `;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...(!isOverlay ? attributes : {})}
            {...(!isOverlay ? listeners : {})}
            className={containerClasses}
        >
            {/* Action Buttons */}
            {!isOverlay && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowAssignMenu(!showAssignMenu);
                            }}
                            className={`p-1 rounded transition-colors ${showAssignMenu ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600'}`}
                            title="Assign members"
                        >
                            <UserPlus size={14} />
                        </button>

                        {showAssignMenu && (
                            <div
                                className="absolute right-0 mt-1 w-48 bg-slate-800 rounded-xl shadow-2xl border border-white/10 py-2 z-[20] animate-in fade-in zoom-in-95 duration-200"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="px-3 py-1 mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">Board Members</span>
                                </div>
                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                    {boardMembers.map(member => {
                                        const isAssigned = (task.assigned_to || []).some(u => u.id === member.id);
                                        return (
                                            <button
                                                key={member.id}
                                                onClick={() => {
                                                    onAssign(task.id, member.id);
                                                    setShowAssignMenu(false);
                                                }}
                                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white border border-slate-600">
                                                        {member.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-200 truncate">{member.username}</span>
                                                </div>
                                                {isAssigned && <Check size={12} className="text-blue-400" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(task);
                        }}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 transition-colors"
                    >
                        <Edit2 size={14} />
                    </button>
                    {canDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(task.id);
                            }}
                            className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            )}

            <div className="flex justify-between items-start gap-2 mb-2 pr-12">
                <div className="flex flex-col gap-1 flex-1">
                    <h4 className="font-bold text-gray-200 text-sm leading-tight">
                        {task.title}
                    </h4>
                    {task.priority && (
                        <span className={`self-start text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-600' :
                            task.priority === 'medium' ? 'bg-orange-100 text-orange-600' :
                                'bg-green-100 text-green-600'
                            }`}>
                            {task.priority}
                        </span>
                    )}
                </div>
            </div>

            {task.description && (
                <div className="flex items-start gap-1.5 mb-3">
                    <AlignLeft size={14} className="text-gray-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {task.description}
                    </p>
                </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                <div className="flex items-center gap-3">
                    {task.due_date && (
                        <div className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-bold">
                            <Clock size={10} />
                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
                <div className="flex -space-x-1.5 overflow-hidden">
                    {(task.assigned_to || []).map(u => (
                        <div
                            key={u.id}
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white uppercase shadow-sm ring-1 ring-black/5"
                            title={u.username}
                        >
                            {u.username.substring(0, 2).toUpperCase()}
                        </div>
                    ))}
                    {(task.assigned_to || []).length === 0 && (
                        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-gray-500 group-hover:bg-white/10 transition-colors">
                            <UserPlus size={10} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DraggableTask;
