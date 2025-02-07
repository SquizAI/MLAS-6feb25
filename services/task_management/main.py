import logging
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import threading

logger = logging.getLogger("task_management")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Task Management Service", debug=False)

# Thread-safe in-memory store (for production use a persistent DB)
task_lock = threading.Lock()
tasks: List["Task"] = []
next_id = 1

class Task(BaseModel):
    id: int = 0
    title: str
    description: Optional[str] = None
    created_at: datetime = None
    due_date: Optional[datetime] = None
    completed: bool = False

@app.get("/health", summary="Health Check")
async def health_check():
    return {"status": "ok"}

@app.post("/tasks", response_model=Task)
async def create_task(task: Task):
    global next_id
    with task_lock:
        task.id = next_id
        next_id += 1
        if task.created_at is None:
            task.created_at = datetime.utcnow()
        tasks.append(task)
        logger.info(f"Task created: {task.id} - {task.title}")
    return task

@app.get("/tasks", response_model=List[Task])
async def get_tasks():
    with task_lock:
        return tasks.copy()

@app.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: int, updated_task: Task):
    with task_lock:
        for i, task in enumerate(tasks):
            if task.id == task_id:
                updated_task.id = task_id
                tasks[i] = updated_task
                logger.info(f"Task updated: {task_id}")
                return updated_task
    raise HTTPException(status_code=404, detail="Task not found")

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: int):
    global tasks
    with task_lock:
        initial_count = len(tasks)
        tasks = [task for task in tasks if task.id != task_id]
        if len(tasks) == initial_count:
            raise HTTPException(status_code=404, detail="Task not found")
        logger.info(f"Task deleted: {task_id}")
    return {"detail": "Task deleted"}

@app.get("/", response_class=HTMLResponse)
async def task_page():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Task Management</title>
        <script>
            async function fetchTasks() {
                try {
                    const response = await fetch('/tasks');
                    const data = await response.json();
                    const taskList = document.getElementById('taskList');
                    taskList.innerHTML = '';
                    data.forEach(task => {
                        const li = document.createElement('li');
                        li.innerHTML = `<strong>${task.title}</strong> - ${task.description || ''} 
                        (Due: ${task.due_date ? new Date(task.due_date).toLocaleString() : 'N/A'}) 
                        [${task.completed ? 'Completed' : 'Pending'}]`;
                        taskList.appendChild(li);
                    });
                } catch (err) {
                    console.error("Error fetching tasks:", err);
                }
            }
            async function addTask(event) {
                event.preventDefault();
                const titleInput = document.getElementById('title');
                const descInput = document.getElementById('description');
                const dueDateInput = document.getElementById('due_date');
                const payload = {
                    title: titleInput.value,
                    description: descInput.value,
                    due_date: dueDateInput.value
                };
                try {
                    await fetch('/tasks', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload)
                    });
                    titleInput.value = '';
                    descInput.value = '';
                    dueDateInput.value = '';
                    fetchTasks();
                } catch(err) {
                    console.error("Error adding task:", err);
                }
            }
            window.onload = fetchTasks;
        </script>
    </head>
    <body>
        <h1>Task Management</h1>
        <ul id="taskList"></ul>
        <form onsubmit="addTask(event)">
            <input id="title" placeholder="Task Title" required /><br>
            <input id="description" placeholder="Task Description" /><br>
            <input id="due_date" placeholder="Due Date (ISO format)" /><br>
            <button type="submit">Add Task</button>
        </form>
    </body>
    </html>
    """
    return HTMLResponse(html_content)

if __name__ == "__main__":
    uvicorn.run("services.task_management.main:app", host="0.0.0.0", port=8007, reload=False) 