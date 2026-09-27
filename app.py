from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)
DATABASE = "lost_found.db"


def init_db():
    conn = sqlite3.connect(DATABASE)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            status TEXT NOT NULL,
            category TEXT,
            item TEXT NOT NULL,
            brand TEXT,
            size TEXT,
            marks TEXT,
            location TEXT,
            date TEXT,
            high_priority INTEGER DEFAULT 0,
            drop_off_status TEXT,
            secret_question TEXT
        )
    """)

    existing_columns = {
        row[1] for row in conn.execute("PRAGMA table_info(reports)")
    }

    new_columns = {
        "category": "TEXT",
        "size": "TEXT",
        "marks": "TEXT",
        "high_priority": "INTEGER DEFAULT 0",
        "drop_off_status": "TEXT",
        "secret_question": "TEXT"
    }

    for column, definition in new_columns.items():
        if column not in existing_columns:
            conn.execute(
                f"ALTER TABLE reports ADD COLUMN {column} {definition}"
            )

    conn.commit()
    conn.close()


@app.route("/api/reports", methods=["GET", "POST"])
def handle_reports():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    
@app.route("/api/test")
def test():
    return {"message": "Backend is working!"}


@app.route("/api/reports", methods=["GET", "POST"])
def handle_reports():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row


    if request.method == "GET":
        cursor = conn.execute("SELECT * FROM reports ORDER BY id DESC")
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"reports": rows}

    if request.method == "POST":
        data = request.json

        # Dynamic Match Calculation
        opposite_status = "found" if data.get("status") == "lost" else "lost"
        cursor = conn.execute("SELECT * FROM reports WHERE status = ?", (opposite_status,))
        potential_matches = cursor.fetchall()

        best_match_score = 0
        for row in potential_matches:
            score = 0
            # +50% for same category, +30% for same brand, +20% for exact location
            if row["category"] == data.get("category"):
                score += 50
            if data.get("brand") and data.get("brand") != "Unspecified" and row["brand"] == data.get("brand"):
                score += 30
            if row["location"] == data.get("location"):
                score += 20

            if score > best_match_score:
                best_match_score = score

        # Insert into Database
        cursor = conn.execute("""
            INSERT INTO reports
            (status, category, item, brand, size, marks, location, date,
             high_priority, drop_off_status, secret_question)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get("status"),
            data.get("category"),
            data.get("item"),
            data.get("brand", "Unspecified"),
            data.get("size", "Standard"),
            data.get("marks", "None"),
            data.get("location"),
            data.get("date"),
            data.get("high_priority", 0),
            data.get("drop_off_status", "N/A"),
            data.get("secret_question", "")
        ))

        conn.commit()
        report_id = cursor.lastrowid
        conn.close()

        return {
            "message": "Report saved successfully!",
            "report_id": report_id,
            "match_score": best_match_score,
            "report": data
        }


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
    