#Lines 1 - 45 written by Emma Wikingstad
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from databasev1 import get_connection
import hashlib
import time

router = APIRouter(prefix="/users", tags=["Users"])

#Using Pydantic Model for creation
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    age: int

#Helper Functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def now_timestamp() -> str:
    return time.strftime("%Y-%m-%d %H:%M:%S")

#Get Users
@router.get("/")
def list_users():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM Users").fetchall()
    conn.close()
    return [dict(row) for row in rows]

#Create user
@router.post("/")
def create_user(user: UserCreate):
    conn = get_connection()

    # Prevent race conditions and ensure consistent id assignment.
    # SQLite: use immediate transaction before SELECT/INSERT for write operations.
    conn.execute("BEGIN IMMEDIATE")

    # Enforce unique email at application layer for clearer error responses.
    existing = conn.execute("SELECT 1 FROM Users WHERE email = ?", (user.email,)).fetchone()
    if existing:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=409, detail="Email already in use")

    # Ensure name column exists on Users table (safe if already present)
    try:
        conn.execute("ALTER TABLE Users ADD COLUMN name VARCHAR(255)")
    except Exception:
        pass

    # Get next available user_id from existing rows
    result = conn.execute("SELECT MAX(user_id) AS max_id FROM Users").fetchone()
    max_id = result["max_id"] if result is not None and result["max_id"] is not None else 0
    next_user_id = max_id + 1

    password_hash = hash_password(user.password)
    timestamp = now_timestamp()

    conn.execute(
        "INSERT INTO Users (user_id, name, email, password_hash, mfa_secret, age, is_active, created_on, updated_on) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (next_user_id, user.name, user.email, password_hash, None, user.age, 1, timestamp, timestamp)
    )
    conn.commit()
    conn.close()
    return {"Message": "User created successfully", "user_id": next_user_id}

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

@router.delete("/{user_id}")
def delete_user(user_id: int):
    conn = get_connection()

    existing = conn.execute("SELECT 1 FROM Users WHERE user_id = ?", (user_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    # Delete template_items for all templates owned by this user
    template_rows = conn.execute(
        "SELECT template_id FROM templates WHERE user_id = ?", (user_id,)
    ).fetchall()
    for row in template_rows:
        conn.execute(
            "DELETE FROM template_items WHERE template_id = ?", (row["template_id"],)
        )

    # Delete all templates owned by this user
    conn.execute("DELETE FROM templates WHERE user_id = ?", (user_id,))

    # Delete all goals owned by this user
    conn.execute("DELETE FROM goals WHERE user_id = ?", (user_id,))

    # Delete the user
    conn.execute("DELETE FROM Users WHERE user_id = ?", (user_id,))

    conn.commit()
    conn.close()

    return {"message": "User deleted successfully"}

@router.put("/{user_id}")
def update_user(user_id: int, user: UserUpdate):
    if user.name is None and user.email is None:
        raise HTTPException(status_code=400, detail="No updatable fields provided")

    conn = get_connection()
    existing_user = conn.execute("SELECT * FROM Users WHERE user_id = ?", (user_id,)).fetchone()
    if not existing_user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    if user.email:
        existing_email = conn.execute("SELECT user_id FROM Users WHERE email = ? AND user_id != ?", (user.email, user_id)).fetchone()
        if existing_email:
            conn.close()
            raise HTTPException(status_code=409, detail="Email already in use")

    update_fields = []
    update_values = []

    if user.name is not None:
        update_fields.append("name = ?")
        update_values.append(user.name)

    if user.email is not None:
        update_fields.append("email = ?")
        update_values.append(user.email)

    update_fields.append("updated_on = ?")
    update_values.append(now_timestamp())

    update_values.append(user_id)

    conn.execute(
        f"UPDATE Users SET {', '.join(update_fields)} WHERE user_id = ?",
        update_values,
    )
    conn.commit()
    conn.close()

    return {"message": "User updated successfully", "user_id": user_id}

# Login Endpoint

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(data: LoginRequest):
    conn = get_connection()

    # 1. Look up the user by email
    user = conn.execute(
        "SELECT * FROM Users WHERE email = ?",
        (data.email,)
    ).fetchone()

    if not user:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # 2. Hash incoming password
    incoming_hash = hash_password(data.password)

    # 3. Compare with stored hash
    if incoming_hash != user["password_hash"]:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    conn.close()

    # 4. Return user info
    return {
        "message": "Login successful",
        "user_id": user["user_id"],
        "name": user["name"] if "name" in user.keys() else "",
        "email": user["email"]
    }
