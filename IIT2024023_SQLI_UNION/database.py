import sqlite3

DB_NAME = "university_portal.db"


def get_connection():
    return sqlite3.connect(DB_NAME)


def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS courses")
    cur.execute("DROP TABLE IF EXISTS faculty_credentials")
    cur.execute("DROP TABLE IF EXISTS exam_vault")

    # Public table: 5 columns (only 2nd and 3rd are rendered on the student portal UI)
    cur.execute("""
        CREATE TABLE courses (
            id INTEGER PRIMARY KEY,
            course_info TEXT,
            syllabus_and_faculty TEXT,
            credits INTEGER,
            semester TEXT
        )
    """)
    cur.executemany(
        "INSERT INTO courses (course_info, syllabus_and_faculty, credits, semester) VALUES (?, ?, ?, ?)",
        [
            (
                "CS301 - Network & Web Security",
                "Prof. R. K. Sharma | Topics: SQL Injection, XSS, CSRF, TLS Handshakes",
                4,
                "Sem 5",
            ),
            (
                "IT304 - Database Management Systems",
                "Dr. Meenakshi Verma | Topics: Relational Algebra, Indexing, ACID Transactions",
                4,
                "Sem 5",
            ),
            (
                "CS308 - Operating Systems",
                "Prof. Arvind Nair | Topics: Process Scheduling, Deadlocks, Virtual Memory",
                4,
                "Sem 5",
            ),
            (
                "IT312 - Distributed Cloud Systems",
                "Dr. S. Kulkarni | Topics: Consensus, Raft, Container Orchestration",
                3,
                "Sem 6",
            ),
        ],
    )

    # Scary Table 1: Privileged faculty & exam controller login credentials
    cur.execute("""
        CREATE TABLE faculty_credentials (
            id INTEGER PRIMARY KEY,
            email TEXT,
            password_hash_or_plain TEXT,
            role TEXT
        )
    """)
    cur.executemany(
        "INSERT INTO faculty_credentials (email, password_hash_or_plain, role) VALUES (?, ?, ?)",
        [
            ("controller.exams@univ.edu.in", "ExamCtrl#2026_MasterKey!", "Controller of Examinations"),
            ("dean.academics@univ.edu.in", "DeanAcad@9912_Admin", "Dean of Academics"),
            ("rk.sharma@univ.edu.in", "SecProf_Pass2026!", "Course Coordinator (CS301)"),
        ],
    )

    # Scary Table 2: Unreleased End-Semester Question Papers & Answer Keys
    cur.execute("""
        CREATE TABLE exam_vault (
            id INTEGER PRIMARY KEY,
            exam_code TEXT,
            secret_paper_and_key TEXT,
            status TEXT
        )
    """)
    cur.executemany(
        "INSERT INTO exam_vault (exam_code, secret_paper_and_key, status) VALUES (?, ?, ?)",
        [
            (
                "CS301_ENDSEM_2026",
                "Paper: /internal/vault/CS301_Final_QP.pdf | Key: Q1=C, Q2=UNION_SELECT, Q3=PreparedStmt",
                "LOCKED - CONFIDENTIAL",
            ),
            (
                "IT304_ENDSEM_2026",
                "Paper: /internal/vault/IT304_Final_QP.pdf | Key: B+Tree_Order4_AnsKey_v2.pdf",
                "LOCKED - CONFIDENTIAL",
            ),
        ],
    )

    conn.commit()
    conn.close()