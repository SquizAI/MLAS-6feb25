FROM python:3.9-slim
WORKDIR /app

# Copy and install requirements.
COPY ./services/integration/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application.
COPY ./services/integration/main.py /app/

# Expose port 8041.
EXPOSE 8041

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8041"]
