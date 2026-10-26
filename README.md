# Happy Bank

Happy Bank is an educational project that can be used to explain and demonstrate various concepts and approaches relevant to different roles in software development. Through the workshop, the project will slightly evolve to showcase best practices in API design, database management, testing, and deployment.

The chosen technologies for this project, although it is not intended to be focused on them, are:
- **FastAPI**: A modern, fast (high-performance) web framework for building APIs with Python 3.7+ based on standard Python type hints.
- **SQLite**: A C-language library that implements a small, fast, self-contained SQL database engine.
- **SQLAlchemy**: The Python SQL toolkit and Object Relational Mapper that gives application developers the full power and flexibility of SQL.
- **Pydantic**: Data validation and settings management using Python type annotations.
- **Pytest**: A framework that makes building simple and scalable test cases easy.

## Setup the Environment

There are two ways to setup the project - the native way using `venv` and `pip`, or using `uv`.

You can ask your AI assistant:

> Setup the environment by following the instructions in INSTALL.md

Or you can do that by executing commands in [INSTALL.md](INSTALL.md) manually.

## Run the Server - uv

If you have `uv` (unlikely in restricted environments):

```bash
uv run uvicorn app.main:app --reload
```

## Run the Server - Windows

If you are in Windows OS, you need to activate the virtual environment first:

```bash
venv\Scripts\activate
```

Then, start the server:

```bash
uvicorn app.main:app --reload
```

## Run the Server - MacOS or Linux

If you are in MacOS or Linux, you need to activate the virtual environment first:

```bash
source .venv/bin/activate
```

Then, start the server:

```bash
uvicorn app.main:app --reload
```

## Access the Server

Open your browser and type `localhost:8000`. You will see the web frontend once it is built (see below). The API documentation (Swagger) is at `localhost:8000/docs`.

## Frontend

The web frontend lives in `resources/web` (React, TypeScript, Vite) and needs Node.js. Its build is not part of the repository, so build it before the server above can serve it:

```bash
cd resources/web
npm install
npm run build
```

The build goes to `resources/web/dist`; run `npm run build` again after every change. Until the frontend is built, `localhost:8000` answers with an error, while the API and `localhost:8000/docs` work.

While working on the frontend, use the development server instead — it reloads on every change:

```bash
npm run dev
```

It runs on `localhost:5173` and forwards `/api` calls to the backend on `localhost:8000`, so keep the backend running. Other commands:

- `npm test` — run the tests
- `npm run lint` — check the code

> Hint: you can try browser in VS Code
