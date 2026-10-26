"""FastAPI Application Entry Point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.app.database import engine, Base, SessionLocal
from backend.app.api.api_router import api_router
from backend.app.models.exam import ExamModel
from backend.app.services.demo_data import seed_demo_data
from backend.app.services.timetable_service import generate_timetable


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed sample data if database is brand new
    db: Session = SessionLocal()
    try:
        exam_count = db.query(ExamModel).count()
        if exam_count == 0:
            print("Database empty. Initializing college demo dataset & generating initial timetable...")
            seed_demo_data(db)
            generate_timetable(
                db=db,
                name="Fall 2026 Examination Timetable",
                academic_term="Autumn 2026-27",
                enforce_locked=False,
            )
            print("Initial timetable ready.")
    finally:
        db.close()
    
    yield


app = FastAPI(
    title="AI-Based Exam Timetable Generator — PBL-I",
    description="Intelligent academic timetable generation using CSP Backtracking, MRV, Degree Heuristic, LCV, and Forward Checking.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "AI Exam Timetable Generator",
        "algorithm": "CSP Backtracking with MRV, Degree Heuristic, LCV, and Forward Checking",
        "version": "1.0.0",
    }


# Include main API router
app.include_router(api_router)
