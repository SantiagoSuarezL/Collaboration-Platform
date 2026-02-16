from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

User = get_user_model()


class Board(models.Model):
    """
    Modelo que representa un tablero de colaboración.
    """
    name = models.CharField(max_length=255, verbose_name="Nombre")
    description = models.TextField(blank=True, verbose_name="Descripción")
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='owned_boards',
        verbose_name="Propietario"
    )
    members = models.ManyToManyField(
        User,
        through='BoardMember',
        related_name='boards',
        verbose_name="Miembros"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        verbose_name = "Tablero"
        verbose_name_plural = "Tableros"
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class BoardMember(models.Model):
    """
    Modelo intermedio para la relación M2M entre Board y User,
    que incluye el rol del miembro.
    """
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('member', 'Miembro'),
    ]

    board = models.ForeignKey(
        Board,
        on_delete=models.CASCADE,
        related_name='board_members',
        verbose_name="Tablero"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='board_memberships',
        verbose_name="Usuario"
    )
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='member',
        verbose_name="Rol"
    )
    joined_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de ingreso")

    class Meta:
        verbose_name = "Miembro del tablero"
        verbose_name_plural = "Miembros del tablero"
        unique_together = ['board', 'user']
        ordering = ['board', 'role', 'joined_at']

    def __str__(self):
        return f"{self.user.username} - {self.board.name} ({self.get_role_display()})"


class List(models.Model):
    """
    Modelo que representa una lista dentro de un tablero.
    """
    board = models.ForeignKey(
        Board,
        on_delete=models.CASCADE,
        related_name='lists',
        verbose_name="Tablero"
    )
    title = models.CharField(max_length=255, verbose_name="Título")
    position = models.DecimalField(
        max_digits=10,
        decimal_places=5,
        default=0,
        verbose_name="Posición"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        verbose_name = "Lista"
        verbose_name_plural = "Listas"
        ordering = ['position']

    def __str__(self):
        return f"{self.title} ({self.board.name})"


class Task(models.Model):
    """
    Modelo que representa una tarea dentro de una lista.
    """
    list = models.ForeignKey(
        List,
        on_delete=models.CASCADE,
        related_name='tasks',
        verbose_name="Lista"
    )
    title = models.CharField(max_length=255, verbose_name="Título")
    description = models.TextField(blank=True, verbose_name="Descripción")
    assigned_to = models.ManyToManyField(
        User,
        blank=True,
        related_name='assigned_tasks',
        verbose_name="Asignado a"
    )
    position = models.DecimalField(
        max_digits=10,
        decimal_places=5,
        default=0,
        verbose_name="Posición"
    )
    due_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="DueDate"
    )
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        verbose_name="Priority"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        verbose_name = "Tarea"
        verbose_name_plural = "Tareas"
        ordering = ['position']

    def __str__(self):
        return self.title


class ActivityLog(models.Model):
    """
    Modelo para registrar el historial de actividades.
    Usa Generic Foreign Keys para poder apuntar a cualquier modelo.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
        verbose_name="Usuario"
    )
    action = models.CharField(max_length=255, verbose_name="Acción")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Fecha y hora")
    
    # Generic Foreign Key fields
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name="Tipo de contenido"
    )
    object_id = models.PositiveIntegerField(verbose_name="ID del objeto")
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        verbose_name = "Registro de actividad"
        verbose_name_plural = "Registros de actividad"
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user} - {self.action} - {self.timestamp}"
