from django.contrib import admin
from .models import Board, BoardMember, List, Task, ActivityLog


class BoardMemberInline(admin.TabularInline):
    """Inline para mostrar los miembros dentro del admin de Board"""
    model = BoardMember
    extra = 1


@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['name', 'description', 'owner__username']
    inlines = [BoardMemberInline]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(BoardMember)
class BoardMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'board', 'role', 'joined_at']
    list_filter = ['role', 'joined_at']
    search_fields = ['user__username', 'board__name']


@admin.register(List)
class ListAdmin(admin.ModelAdmin):
    list_display = ['title', 'board', 'position', 'created_at']
    list_filter = ['created_at', 'board']
    search_fields = ['title', 'board__name']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['board', 'position']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'list', 'position', 'due_date', 'created_at']
    list_filter = ['created_at', 'due_date', 'list__board']
    search_fields = ['title', 'description']
    filter_horizontal = ['assigned_to']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['list', 'position']


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'content_type', 'object_id', 'timestamp']
    list_filter = ['timestamp', 'content_type']
    search_fields = ['user__username', 'action']
    readonly_fields = ['user', 'action', 'content_type', 'object_id', 'timestamp']
    ordering = ['-timestamp']
    
    def has_add_permission(self, request):
        """No permitir agregar manualmente registros de actividad"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """No permitir editar registros de actividad"""
        return False
