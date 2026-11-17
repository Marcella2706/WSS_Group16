import sqlite3
from database import get_connection


def search_courses(search_term: str):
    conn = get_connection()
    cur = conn.cursor()

    # (a) VULNERABLE IMPLEMENTATION: Direct string concatenation
    # executed_query = (
    #     "SELECT id, course_info, syllabus_and_faculty, credits, semester "
    #     f"FROM courses WHERE course_info LIKE '%{search_term}%'"
    # )

    raw_sql = (
        "SELECT id, course_info, syllabus_and_faculty, credits, semester "
        "FROM courses WHERE course_info LIKE ?"
    )
    param_val = f"%{search_term}%"
    executed_query = f"{raw_sql}   -- Bound Parameter: {repr(param_val)}"

    rows = []
    error_msg = None
    try:
        # cur.execute(executed_query)
        cur.execute(raw_sql, (param_val,))
        rows = cur.fetchall()
    except sqlite3.Error as exc:
        error_msg = str(exc)
    finally:
        conn.close()

    return executed_query, rows, error_msg