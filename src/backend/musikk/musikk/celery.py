from celery import Celery

app = Celery('musikk', broker="")
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
