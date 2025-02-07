FROM python:3.9-slim
WORKDIR /app

# Copy and install requirements.
COPY ./services/notification/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the notification service main application.
COPY ./services/notification/main.py /app/

# Expose port 8020 for the notification service.
EXPOSE 8020

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8020"] 