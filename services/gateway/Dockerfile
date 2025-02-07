FROM python:3.9-slim
WORKDIR /app

# Copy and install requirements.
COPY ./services/gateway/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the gateway main application.
COPY ./services/gateway/main.py /app/

# Expose port 8010 for the gateway.
EXPOSE 8010

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8010"] 