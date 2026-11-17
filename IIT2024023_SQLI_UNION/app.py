import html
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

from database import init_db
from queries import search_courses


class UniversityPortalHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path != "/":
            self.send_response(404)
            self.end_headers()
            return

        params = parse_qs(parsed.query)
        search_term = params.get("q", [""])[0]

        executed_query, rows, error_msg = search_courses(search_term)

        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.end_headers()

        self.wfile.write(
            self.render_page(
                search_term,
                executed_query,
                rows,
                error_msg
            ).encode("utf-8")
        )

    def render_page(self, search_term, executed_query, rows, error_msg):
        if error_msg:
            results_html = f"""
            <div class="error-box">
                <strong>Database Error:</strong>
                {html.escape(error_msg)}
            </div>
            """

        elif not rows:
            results_html = """
            <p class="empty">
                No matching courses or faculty found.
            </p>
            """

        else:
            cards = []

            for r in rows:
                # Only Column 2 and Column 3 render on screen
                col2 = html.escape(str(r[1]))
                col3 = html.escape(str(r[2]))

                cards.append(f"""
                <div class="result-card">
                    <strong>{col2}</strong>
                    <span>{col3}</span>
                </div>
                """)

            results_html = "".join(cards)

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>University Course Search</title>

<style>
    body {{
        margin: 0;
        padding: 40px 20px;
        background: #f4f4f4;
        color: #222;
        font-family: Arial, Helvetica, sans-serif;
    }}

    .container {{
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
    }}

    .search-panel {{
        background: white;
        padding: 28px;
        border-radius: 8px;
        border: 1px solid #dddddd;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }}

    .search-panel h1 {{
        margin: 0 0 28px;
        text-align: center;
        font-size: 30px;
        color: #222;
    }}

    .search-label {{
        display: block;
        margin-bottom: 8px;
        font-size: 17px;
        font-weight: bold;
    }}

    input[type="text"] {{
        width: 100%;
        padding: 13px;
        font-size: 16px;
        border: 1px solid #d5d5d5;
        border-radius: 5px;
        outline: none;
        box-sizing: border-box;
    }}

    input[type="text"]:focus {{
        border-color: #28a745;
    }}

    button {{
        width: 100%;
        margin-top: 14px;
        padding: 13px;
        border: none;
        border-radius: 5px;
        background: #28a745;
        color: white;
        font-size: 16px;
        cursor: pointer;
    }}

    button:hover {{
        background: #218838;
    }}

    .query-box {{
        margin-top: 30px;
        color: #a52a2a;
        font-size: 17px;
        font-weight: bold;
        line-height: 1.35;
        word-break: break-word;
    }}

    .results-heading {{
        margin: 28px 0 14px;
        font-size: 24px;
    }}

    .result-card {{
        background: white;
        border: 1px solid #e1e1e1;
        padding: 15px;
        margin-bottom: 10px;
        font-size: 17px;
        line-height: 1.35;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }}

    .result-card strong {{
        color: #222;
    }}

    .result-card span {{
        color: #333;
        margin-left: 4px;
    }}

    .error-box {{
        margin-top: 20px;
        padding: 14px;
        color: #a94442;
        background: #f2dede;
        border: 1px solid #ebcccc;
        border-radius: 5px;
    }}

    .empty {{
        background: white;
        padding: 16px;
        color: #777;
        border: 1px solid #ddd;
    }}

    @media (max-width: 600px) {{
        body {{
            padding: 20px 12px;
        }}

        .search-panel {{
            padding: 22px;
        }}

        .search-panel h1 {{
            font-size: 25px;
        }}
    }}
</style>
</head>

<body>
    <div class="container">

        <div class="search-panel">
            <h1>Search Courses</h1>

            <form method="GET" action="/">
                <label class="search-label" for="search">
                    Search:
                </label>

                <input
                    id="search"
                    type="text"
                    name="q"
                    value="{html.escape(search_term)}"
                    placeholder="Search for courses..."
                >

                <button type="submit">Search</button>
            </form>

            <div class="query-box">
                The query that was used:
                {html.escape(executed_query)}
            </div>
        </div>

        <h2 class="results-heading">Search Results</h2>

        {results_html}

    </div>
</body>
</html>
"""


if __name__ == "__main__":
    init_db()

    server = HTTPServer(
        ("127.0.0.1", 8000),
        UniversityPortalHandler
    )

    print("Portal running at http://127.0.0.1:8000 (Press Ctrl+C to stop)")
    server.serve_forever()