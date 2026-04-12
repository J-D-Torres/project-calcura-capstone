# Lines 1 - 39 written by Emma Wikingstad
# Updated by Jonathan Torres
from fastapi import FastAPI
from routers import users, roles, permissions, user_roles, budgets, sessions, categories, templates, template_items
from fastapi.middleware.cors import CORSMiddleware

from db.database import engine, Base
import db.models  # registers all ORM models with Base.metadata

app = FastAPI()

# Create all tables on startup (no-op if they already exist)
Base.metadata.create_all(bind=engine)

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

@app.get("/")
def root():
    return {"message": "Welcome to the Calcura API"}

# To run the app, use the command: uvicorn testapp:app --reload
# If this command does not work, use "python -m uvicorn testapp:app --reload" instead

# If nothing wors try cd project-calcura-capstone and then run the command again

# http://127.0.0.1:8000/docs#/ to access the API documentation and test the endpoints. 
# THIS NEEDS TO BE OPEN TO TEST API ENDPOINTS FROM THE FRONTEND    