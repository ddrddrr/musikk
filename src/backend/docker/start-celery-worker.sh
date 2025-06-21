# musikk==dir where the celery app is imported in __init__
# run this in the backend/musikk directory for local development
celery -A musikk worker -l INFO