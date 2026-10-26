"""Pytest fixtures and test environment setup."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.services.demo_data import seed_demo_data

from sqlalchemy.pool import StaticPool

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Provides a clean in-memory database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Provides FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_csp_data():
    """Provides standard dataset for pure CSP scheduler testing."""
    groups = [
        {"id": 1, "code": "CS-1", "name": "CS Year 1", "student_count": 50, "shared_conflict_groups": ["CS-ELEC"]},
        {"id": 2, "code": "IT-1", "name": "IT Year 1", "student_count": 40, "shared_conflict_groups": []},
        {"id": 3, "code": "CS-ELEC", "name": "CS Elective", "student_count": 30, "shared_conflict_groups": ["CS-1"]},
    ]
    rooms = [
        {
            "id": 1,
            "room_number": "R101",
            "name": "Hall 101",
            "capacity": 60,
            "room_type": "Classroom",
            "facilities": ["Projector"],
            "available_dates": [],
            "unavailable_slots": [],
            "is_active": True,
        },
        {
            "id": 2,
            "room_number": "R102",
            "name": "Hall 102",
            "capacity": 55,
            "room_type": "Classroom",
            "facilities": [],
            "available_dates": [],
            "unavailable_slots": [],
            "is_active": True,
        },
        {
            "id": 3,
            "room_number": "LAB1",
            "name": "Computing Lab",
            "capacity": 45,
            "room_type": "Computer Lab",
            "facilities": ["Computers"],
            "available_dates": [],
            "unavailable_slots": [],
            "is_active": True,
        },
    ]
    slots = [
        {"id": 1, "slot_number": 1, "name": "Slot 1", "start_time": "09:00", "end_time": "12:00", "is_active": True},
        {"id": 2, "slot_number": 2, "name": "Slot 2", "start_time": "14:00", "end_time": "17:00", "is_active": True},
    ]
    dates = ["2026-11-16", "2026-11-17", "2026-11-18"]
    exams = [
        {
            "id": 1,
            "code": "CS101",
            "name": "Programming I",
            "student_group_codes": ["CS-1"],
            "student_count": 50,
            "duration_slots": 1,
            "permitted_dates": [],
            "permitted_slots": [],
            "required_room_type": None,
            "required_facilities": [],
        },
        {
            "id": 2,
            "code": "CS102",
            "name": "Data Structures",
            "student_group_codes": ["CS-1"],
            "student_count": 50,
            "duration_slots": 1,
            "permitted_dates": [],
            "permitted_slots": [],
            "required_room_type": None,
            "required_facilities": [],
        },
        {
            "id": 3,
            "code": "IT101",
            "name": "Web Basics",
            "student_group_codes": ["IT-1"],
            "student_count": 40,
            "duration_slots": 1,
            "permitted_dates": [],
            "permitted_slots": [],
            "required_room_type": None,
            "required_facilities": [],
        },
        {
            "id": 4,
            "code": "CS103-LAB",
            "name": "Programming Lab",
            "student_group_codes": ["CS-1"],
            "student_count": 45,
            "duration_slots": 1,
            "permitted_dates": [],
            "permitted_slots": [],
            "required_room_type": "Computer Lab",
            "required_facilities": ["Computers"],
        },
    ]
    config = {
        "weight_gap": 10.0,
        "weight_distribution": 5.0,
        "weight_utilization": 3.0,
        "max_search_seconds": 10.0,
        "max_backtracks": 5000,
    }
    return {
        "groups": groups,
        "rooms": rooms,
        "slots": slots,
        "dates": dates,
        "exams": exams,
        "config": config,
    }
