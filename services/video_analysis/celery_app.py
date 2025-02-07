from celery import Celery

# Configure Celery to use Redis as both broker and result backend
celery_app = Celery(
    "video_analysis",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0"
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
) 