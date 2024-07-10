import os
import sentry_sdk
from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from app.api.main import api_router
from app.core.config import settings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def custom_generate_unique_id(route: APIRoute) -> str:
    if route.tags:
        return f"{route.tags[0]}-{route.name}"
    return route.name  # Fallback if no tags are present

if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)

# Define the path to your static files directory
static_files_path = os.path.join(os.path.dirname(__file__), "../../frontend/dist")

# Serve static files
app.mount("/static", StaticFiles(directory=static_files_path), name="static")

# Serve the index.html for the root path
@app.get("/", include_in_schema=False)
async def serve_root():
    return FileResponse(os.path.join(static_files_path, "index.html"))

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)
