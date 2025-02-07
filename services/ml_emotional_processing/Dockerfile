FROM python:3.9-slim
WORKDIR /app

# Copy the common directory first
COPY common ./common

# Copy service-specific files from the repository root to /app
COPY ./services/knowledge_graph/requirements.txt /app/
COPY ./services/knowledge_graph/main.py /app/

RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]