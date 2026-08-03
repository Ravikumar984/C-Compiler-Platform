# Online C Code Editor + Compiler

A browser-based C editor (CodeMirror) with a Node.js/Express backend that compiles and
runs code using `gcc`, plus MySQL for saving snippets.

```
c-compiler-web/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── db/schema.sql
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

## 1. Prerequisites

Install these on your machine (or server):

| Tool   | Check with        | Notes                                  |
|--------|--------------------|-----------------------------------------|
| Node.js (v18+) | `node -v`   | https://nodejs.org                     |
| gcc            | `gcc --version` | Ubuntu/Debian: `sudo apt install gcc`; Mac: `xcode-select --install`; Windows: use WSL |
| MySQL (v8+)    | `mysql --version` | https://dev.mysql.com/downloads |

**Important — Windows users:** `gcc` and the `timeout` command used to kill runaway
programs are Linux tools. On Windows, run the backend inside **WSL** (Windows Subsystem
for Linux), not directly in PowerShell/cmd.

## 2. Database setup

Log into MySQL and run the schema file:

```bash
mysql -u root -p < backend/db/schema.sql
```

This creates the `c_compiler_db` database and a `snippets` table (`id`, `title`, `code`,
`created_at`). You don't need to create anything manually beyond running this once.

## 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your real MySQL credentials:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=c_compiler_db
```

Start the server:

```bash
npm start
```

You should see:

```
C compiler backend running on http://localhost:5000
```

Verify it's alive: open `http://localhost:5000/api/health` in a browser — it should
return `{"status":"ok"}`.

## 4. Frontend setup

No build step needed — it's plain HTML/CSS/JS. Simplest way to run it:

```bash
cd frontend
npx serve .
```

(or just open `index.html` directly in a browser — but serving it avoids some browsers'
restrictions on local file requests). Then visit the URL it prints (e.g.
`http://localhost:3000`).

Make sure `API_BASE` at the top of `app.js` matches wherever your backend is actually
running (default: `http://localhost:5000/api`).

## 5. Using it

1. Write C code in the left editor pane.
2. Add any `scanf` input into the **stdin** box (one value per line).
3. Click **Run** (or press Ctrl/Cmd+Enter).
4. Output, compiler errors, or runtime errors show in the terminal panel on the right.
5. Give it a filename in the title box and click **Save** to store the snippet in
   MySQL; reload it later from the **Load snippet…** dropdown.

## 6. How compilation works (and its safety limits)

For each run, the backend:
1. Writes your code to a temp `.c` file with a random UUID name.
2. Runs `gcc file.c -o file.out`. If this fails, compiler errors are sent back as-is.
3. Runs the resulting binary with your stdin, wrapped in `timeout 5s` so infinite loops
   get killed instead of hanging the server.
4. Deletes the temp source/binary/stdin files afterward, whether it succeeded or not.

This is a **reasonable setup for personal use, a college project, or a small trusted
group** (e.g. your coding club). It is not a full production-grade sandbox — the
compiled program still runs directly on your server's OS with your server's
permissions. If you plan to expose this publicly on the internet where anyone could
submit code, you'd want to additionally:
- Run compilation/execution inside a **Docker container** or a tool like **Judge0** /
  **isolate**, so a malicious program can't touch the host filesystem or network.
- Add per-user rate limiting.
- Cap memory usage (e.g. via `ulimit -v` or a cgroup) in addition to the time limit.

I kept the current version dependency-light and easy to run locally, since your setup
sounds like it's for a club or personal portfolio project — happy to add the Docker
sandboxing layer if you want to open it up publicly later.

## 7. Troubleshooting

- **"Could not reach the backend"** in the browser → backend isn't running, or
  `API_BASE` in `app.js` points to the wrong port.
- **Compile works but "gcc: command not found"** → gcc isn't installed / not on PATH
  where Node is running.
- **MySQL errors on save/load** → double check `.env` credentials and that you ran
  `schema.sql`.
- **Program hangs / "timed out"** → this is expected behavior for infinite loops; it's
  the 5-second safety timeout in `server.js` (`EXEC_TIMEOUT_MS`), not a bug.
