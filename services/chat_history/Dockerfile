FROM python:3.9-slim
WORKDIR /app

# Copy and install requirements.
COPY ./services/chat_history/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the chat history service source.
COPY ./services/chat_history/main.py /app/

# Expose port 8030 for the chat history service.
EXPOSE 8030

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8030"] 