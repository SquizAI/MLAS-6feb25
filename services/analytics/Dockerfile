FROM python:3.9-slim
WORKDIR /app

# Copy and install requirements.
COPY ./services/analytics/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code.
COPY ./services/analytics/main.py /app/

# Expose port 8040.
EXPOSE 8040

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8040"]
