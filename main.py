# Lines 1 - 39 written by Emma Wikingstad
import os # Added by Jonathan Torres
from fastapi import FastAPI
from routers import users, roles, permissions, user_roles, budgets, sessions, categories, templates, template_items, goals
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # Added by Jonathan Torres
from fastapi.responses import FileResponse # Added by Jonathan Torres

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_headers=["*"],
    allow_methods=["*"],
    allow_credentials=True,
)

app.include_router(users.router)
app.include_router(roles.router)
app.include_router(permissions.router)
app.include_router(user_roles.router)
app.include_router(budgets.router)
app.include_router(sessions.router)
app.include_router(categories.router)
app.include_router(templates.router)
app.include_router(template_items.router)
app.include_router(goals.router)

# Modified by Jonathan Torres to serve the React frontend from the FastAPI backend
BUILD_DIR = os.path.join(os.path.dirname(__file__), "build")
if os.path.isdir(BUILD_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(BUILD_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        return FileResponse(os.path.join(BUILD_DIR, "index.html"))

# To run the app, use the command: uvicorn main:app --reload
# If this command does not work, use "python -m uvicorn main:app --reload" instead

# If nothing wors try cd project-calcura-capstone and then run the command again

# http://127.0.0.1:8000/docs#/ to access the API documentation and test the endpoints. 
# THIS NEEDS TO BE OPEN TO TEST API ENDPOINTS FROM THE FRONTEND    