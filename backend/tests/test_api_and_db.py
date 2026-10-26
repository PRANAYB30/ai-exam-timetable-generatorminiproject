"""Tests for API input validation, demo initialization, and endpoints."""
import pytest
from backend.app.models.exam import ExamModel
from backend.app.models.room import RoomModel
from backend.app.services.demo_data import seed_demo_data


def test_12_api_input_validation(client):
    """Scenario 12: API validates input schemas, rejects negative values and duplicates."""
    # Health check
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    # Reject room with negative or 0 capacity
    res = client.post("/api/rooms", json={
        "room_number": "BAD-ROOM",
        "name": "Bad Room",
        "capacity": 0,
        "room_type": "Classroom",
        "facilities": [],
    })
    assert res.status_code == 422, "Expected 422 Unprocessable Entity for capacity <= 0"

    # Create valid room
    res = client.post("/api/rooms", json={
        "room_number": "GOOD-101",
        "name": "Good Hall",
        "capacity": 50,
        "room_type": "Classroom",
        "facilities": ["Projector"],
    })
    assert res.status_code == 201

    # Duplicate room_number rejected
    res = client.post("/api/rooms", json={
        "room_number": "GOOD-101",
        "name": "Duplicate Hall",
        "capacity": 40,
        "room_type": "Classroom",
        "facilities": [],
    })
    assert res.status_code == 400

    # Create valid exam
    res = client.post("/api/exams", json={
        "code": "EXAM-101",
        "name": "Intro to AI",
        "student_group_codes": ["CS-Y1"],
        "student_count": 45,
    })
    assert res.status_code == 201

    # Duplicate exam code rejected
    res = client.post("/api/exams", json={
        "code": "EXAM-101",
        "name": "Another Subject",
        "student_group_codes": ["CS-Y1"],
        "student_count": 45,
    })
    assert res.status_code == 400


def test_13_sample_database_initialization(db_session, client):
    """Scenario 13: Sample database initialization and demo data endpoint."""
    # Seed data directly
    seed_demo_data(db_session)
    exam_count = db_session.query(ExamModel).count()
    room_count = db_session.query(RoomModel).count()
    assert exam_count >= 10, f"Expected at least 10 sample exams, got {exam_count}"
    assert room_count >= 5, f"Expected at least 5 sample rooms, got {room_count}"

    # Reset endpoint
    res = client.post("/api/demo/reset")
    assert res.status_code == 200

    # Verify reset cleared data
    assert db_session.query(ExamModel).count() == 0

    # Load demo data endpoint with auto-generation
    res = client.post("/api/demo/load?auto_generate=true")
    assert res.status_code == 200
    data = res.json()
    assert data["timetable_id"] is not None

    # Fetch dashboard data
    res = client.get("/api/dashboard")
    assert res.status_code == 200
    dash = res.json()
    assert dash["total_exams"] >= 10
    assert dash["latest_timetable"] is not None
    assert dash["latest_timetable"]["hard_violations_count"] == 0
