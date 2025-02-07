FROM python:3.9-slim
WORKDIR /app

# Copy the common directory first
COPY common ./common

# Copy service-specific files from the repository root to /app
COPY ./services/dashboard/requirements.txt /app/
COPY ./services/dashboard/main.py /app/
COPY ./services/dashboard/templates ./templates

RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"] 