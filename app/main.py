import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import SQLModel

from app.api.account_routes import router as account_router
from app.api.bank_routes import router as bank_router
from app.api.client_routes import router as client_router
from app.api.health_routes import router as health_router
from app.api.transaction_routes import router as transaction_router
from app.db import engine
from app.logging_config import setup_logging
from app.models import Client, Transaction  # noqa: F401 - ensure tables are registered
from app.startup import create_default_accounts, create_default_clients

# Setup logging first
setup_logging()
logger = logging.getLogger(__name__)

SQLModel.metadata.create_all(bind=engine)

app = FastAPI()

logger.info("Application starting up")

app.include_router(account_router, prefix="/api/v1", tags=["account"])
app.include_router(bank_router, prefix="/api/v1", tags=["bank"])
app.include_router(client_router, prefix="/api/v1", tags=["client"])
app.include_router(health_router, tags=["health"])
app.include_router(transaction_router, prefix="/api/v1", tags=["transaction"])

# Serve the built frontend (resources/web). Defined after the API routers so it doesn't shadow them.
WEB_DIST = Path("resources/web/dist").resolve()

app.mount("/assets", StaticFiles(directory=WEB_DIST / "assets", check_dir=False), name="assets")


@app.get("/{path:path}", include_in_schema=False)
def serve_frontend(path: str):
    if path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not Found")
    file = (WEB_DIST / path).resolve()
    if path and file.is_file() and file.is_relative_to(WEB_DIST):
        return FileResponse(file)
    # Any other path is a client-side route (e.g. /clients/1), so the frontend handles it.
    return FileResponse(WEB_DIST / "index.html")


create_default_clients()
create_default_accounts()
