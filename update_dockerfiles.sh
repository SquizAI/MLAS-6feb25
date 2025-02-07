#!/bin/bash

# List of all services
SERVICES=(
    "video_analysis"
    "voice_workflow"
    "document_management"
    "dashboard"
    "agent_interaction"
    "knowledge_graph"
    "task_management"
    "ml_emotional_processing"
)

# Update each service's Dockerfile
for service in "${SERVICES[@]}"; do
    cat > "services/$service/Dockerfile" << EOF
FROM python:3.9-slim
WORKDIR /app

# Copy the common directory first
COPY common ./common

# Copy service-specific files
COPY services/$service/requirements.txt .
COPY services/$service/main.py .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
done 