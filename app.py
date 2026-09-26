from flask import Flask, request
import sqlite3

app = Flask(__name__)

DATABASE = "lost_found.db"


def init_db():
    conn = sqlite3.connect(DATABASE)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            status TEXT NOT NULL,
            item TEXT NOT NULL,
            brand TEXT,
            location TEXT,
            date TEXT,
            description TEXT
        )
    """)

    conn.commit()
    conn.close()


@app.route("/api/test")
def test():
    return {"message": "Backend is working!"}


@app.route("/api/reports", methods=["POST"])
def create_report():
    data = request.json

    conn = sqlite3.connect(DATABASE)

    cursor = conn.execute("""
        INSERT INTO reports
        (status, item, brand, location, date, description)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data.get("status"),
        data.get("item"),
        data.get("brand"),
        data.get("location"),
        data.get("date"),
        data.get("description")
    ))

    conn.commit()

    report_id = cursor.lastrowid
    conn.close()

    return {
        "message": "Report saved successfully!",
        "report_id": report_id,
        "report": data
    }


if __name__ == "__main__":
    init_db()
    app.run(debug=True)