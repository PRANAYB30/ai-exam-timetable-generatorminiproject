"""Main API Router assembling all sub-routers."""
from fastapi import APIRouter
from backend.app.api.endpoints.exams import router as exams_router
from backend.app.api.endpoints.rooms import router as rooms_router
from backend.app.api.endpoints.groups import router as groups_router
from backend.app.api.endpoints.slots import router as slots_router
from backend.app.api.endpoints.config import router as config_router
from backend.app.api.endpoints.timetables import router as timetables_router
from backend.app.api.endpoints.dashboard import router as dashboard_router
from backend.app.api.endpoints.demo import router as demo_router
from backend.app.api.endpoints.auth import router as auth_router
from backend.app.api.endpoints.import_export import router as import_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(timetables_router)
api_router.include_router(exams_router)
api_router.include_router(groups_router)
api_router.include_router(rooms_router)
api_router.include_router(slots_router)
api_router.include_router(config_router)
api_router.include_router(demo_router)
api_router.include_router(import_router)
