import logging
from typing import Any

from fastmcp import FastMCP
from sqlalchemy import inspect
from sqlalchemy.exc import SQLAlchemyError

from app.db import engine

logger = logging.getLogger(__name__)

mcp = FastMCP(name="happy-bank-sqlite-inspector")


def _inspector() -> Any:
    return inspect(engine)


def _table_exists(table_name: str) -> bool:
    tables = set(_inspector().get_table_names())
    return table_name in tables


def list_tables() -> dict[str, list[str]]:
    """List all table names from the SQLite database."""
    logger.info("Operation started: list_tables")
    try:
        table_names = sorted(_inspector().get_table_names())
        logger.debug("Fetched table names count=%s", len(table_names))
        logger.info("Operation completed successfully: list_tables")
        return {"tables": table_names}
    except SQLAlchemyError as exc:
        logger.error("Operation failed: list_tables: %s", exc, exc_info=True)
        return {
            "tables": [],
            "error": "database_access_error",
            "message": "Failed to inspect table names.",
        }


def describe_table(table_name: str, include_details: bool = False) -> dict[str, Any]:
    """Describe columns for a table.

    With include_details=False, returns only column name and type.
    With include_details=True, also returns PK, FK, indexes, defaults and nullability.
    """
    logger.info(
        "Operation started: describe_table table_name=%s include_details=%s",
        table_name,
        include_details,
    )
    try:
        if not _table_exists(table_name):
            logger.warning("Table not found: %s", table_name)
            return {
                "table": table_name,
                "error": "table_not_found",
                "message": f"Table '{table_name}' does not exist.",
            }

        inspector = _inspector()
        raw_columns = inspector.get_columns(table_name)

        columns = []
        for column in raw_columns:
            column_type = str(column["type"])
            columns.append({"name": column["name"], "type": column_type})

        response: dict[str, Any] = {
            "table": table_name,
            "columns": columns,
        }

        if include_details:
            detailed_columns = []
            for column in raw_columns:
                detailed_columns.append(
                    {
                        "name": column["name"],
                        "type": str(column["type"]),
                        "nullable": bool(column.get("nullable", True)),
                        "default": column.get("default"),
                    }
                )

            pk = inspector.get_pk_constraint(table_name)
            foreign_keys = inspector.get_foreign_keys(table_name)
            indexes = inspector.get_indexes(table_name)

            response.update(
                {
                    "columns": detailed_columns,
                    "primary_key": {
                        "name": pk.get("name"),
                        "columns": pk.get("constrained_columns", []),
                    },
                    "foreign_keys": [
                        {
                            "name": fk.get("name"),
                            "constrained_columns": fk.get("constrained_columns", []),
                            "referred_table": fk.get("referred_table"),
                            "referred_columns": fk.get("referred_columns", []),
                            "options": fk.get("options", {}),
                        }
                        for fk in foreign_keys
                    ],
                    "indexes": [
                        {
                            "name": idx.get("name"),
                            "columns": idx.get("column_names", []),
                            "unique": bool(idx.get("unique", False)),
                        }
                        for idx in indexes
                    ],
                }
            )

            logger.debug(
                "Detailed metadata: columns=%s foreign_keys=%s indexes=%s",
                len(detailed_columns),
                len(foreign_keys),
                len(indexes),
            )

        logger.info("Operation completed successfully: describe_table")
        return response
    except SQLAlchemyError as exc:
        logger.error("Operation failed: describe_table: %s", exc, exc_info=True)
        return {
            "table": table_name,
            "error": "database_access_error",
            "message": "Failed to inspect table metadata.",
        }


@mcp.tool(name="list_tables")
def list_tables_tool() -> dict[str, list[str]]:
    """MCP tool wrapper for listing all table names."""
    return list_tables()


@mcp.tool(name="describe_table")
def describe_table_tool(table_name: str, include_details: bool = False) -> dict[str, Any]:
    """MCP tool wrapper for describing table metadata."""
    return describe_table(table_name=table_name, include_details=include_details)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    mcp.run()
