from fastapi import FastAPI

def add_health_check(app: FastAPI):
    @app.get("/health")
    async def health_check():
        return {"status": "ok"} 