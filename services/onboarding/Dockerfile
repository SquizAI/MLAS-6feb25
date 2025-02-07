FROM python:3.9-slim
WORKDIR /app

# Copy and install requirements.
COPY ./services/onboarding/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the onboarding application.
COPY ./services/onboarding/main.py /app/

# Expose port 8042.
EXPOSE 8042

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8042"]
