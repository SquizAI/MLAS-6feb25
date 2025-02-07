FROM python:3.9-slim
WORKDIR /app

# Copy the common directory first
COPY common ./common

# Copy service-specific files from the repository root to /app
COPY ./services/task_management/requirements.txt /app/
COPY ./services/task_management/main.py /app/

RUN pip install --no-cache-dir -r requirements.txt

# Expose port 8007.
EXPOSE 8007

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8007"] 