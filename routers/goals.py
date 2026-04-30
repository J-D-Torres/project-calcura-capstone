from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from databasev1 import get_connection
import time

router = APIRouter(prefix="/goals", tags=["Goals"])


class GoalCreate(BaseModel):
    user_id: int
    name: str
    target_amount: float
    target_date: str | None = None   # YYYY-MM-DD
    apr: float | None = None
    down_payment: float | None = None
    interest: float | None = None
    goal_type: str | None = None


class GoalUpdate(BaseModel):
    name: str | None = None
    target_amount: float | None = None
    target_date: str | None = None
    priority: int | None = None
    status: str | None = None
    apr: float | None = None
    down_payment: float | None = None
    interest: float | None = None
    goal_type: str | None = None


def now():
    return time.strftime("%Y-%m-%d %H:%M:%S")


@router.get("/")
def list_goals():
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM goals").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


@router.get("/{goal_id}")
def get_goal(goal_id: int):
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM goals WHERE goal_id = ?", (goal_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Goal not found")
        return dict(row)
    finally:
        conn.close()


@router.post("/")
def create_goal(g: GoalCreate):
    ts = now()
    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT INTO goals (user_id, name, target_amount, target_date, apr, down_payment, interest, goal_type, priority, status, created_on, updated_on)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'active', ?, ?)
            """,
            (g.user_id, g.name, g.target_amount, g.target_date, g.apr, g.down_payment, g.interest, g.goal_type, ts, ts),
        )
        conn.commit()
        goal_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        return {"message": "Goal created", "goal_id": goal_id}
    finally:
        conn.close()


@router.put("/{goal_id}")
def update_goal(goal_id: int, update: GoalUpdate):
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM goals WHERE goal_id = ?", (goal_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Goal not found")
        current = dict(row)

        conn.execute(
            """
            UPDATE goals
            SET name = ?, target_amount = ?, target_date = ?, apr = ?, down_payment = ?, interest = ?, goal_type = ?, priority = ?, status = ?, updated_on = ?
            WHERE goal_id = ?
            """,
            (
                update.name if update.name is not None else current["name"],
                update.target_amount if update.target_amount is not None else current["target_amount"],
                update.target_date if update.target_date is not None else current["target_date"],
                update.apr if update.apr is not None else current["apr"],
                update.down_payment if update.down_payment is not None else current["down_payment"],
                update.interest if update.interest is not None else current["interest"],
                update.goal_type if update.goal_type is not None else current["goal_type"],
                update.priority if update.priority is not None else current["priority"],
                update.status if update.status is not None else current["status"],
                now(),
                goal_id,
            ),
        )
        conn.commit()
        return {"message": "Goal updated"}
    finally:
        conn.close()


@router.delete("/{goal_id}")
def delete_goal(goal_id: int):
    conn = get_connection()
    try:
        conn.execute("DELETE FROM goals WHERE goal_id = ?", (goal_id,))
        conn.commit()
        return {"message": "Goal deleted"}
    finally:
        conn.close()
