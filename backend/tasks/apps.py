from django.apps import AppConfig


class TasksConfig(AppConfig):
    name = 'tasks'
    
    def ready(self):
        """
        Importa las señales cuando la aplicación está lista.
        Esto asegura que los signals se registren automáticamente.
        """
        import tasks.signals
