FROM python:3.9-slim
WORKDIR /app

# Copy and install requirements.
COPY ./services/authentication/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code.
COPY ./services/authentication/main.py /app/

# Expose port 8000.
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
