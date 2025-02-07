FROM python:3.9-slim
WORKDIR /app

# Copy the common directory first
COPY common ./common

# Copy service-specific files (note the path from repo root)
COPY services/agent_interaction/requirements.txt .
COPY services/agent_interaction/main.py .

RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8005"] 