"""Authentication and Administrator Session Endpoints."""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str = Field(..., example="admin")
    password: str = Field(..., example="admin123")

class UserProfile(BaseModel):
    id: int
    name: str
    username: str
    email: str
    role: str
    designation: str
    department: str
    staff_id: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

DEMO_ADMIN = UserProfile(
    id=1,
    name="Dr. Ramesh K. Sharma",
    username="admin",
    email="coe@college.edu",
    role="ADMIN",
    designation="Controller of Examinations",
    department="Office of Academic Affairs & Examination Cell",
    staff_id="COE-2026-04",
)

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    # Accept standard admin credentials
    valid_usernames = ["admin", "coe@college.edu", "admin@college.edu", "coe"]
    valid_passwords = ["admin123", "admin", "college123", "password"]
    
    if payload.username.strip().lower() in valid_usernames and payload.password in valid_passwords:
        return LoginResponse(
            access_token="mock-college-admin-session-token-2026",
            user=DEMO_ADMIN,
        )
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials. Use admin / admin123 for authorized Examination Cell access.",
    )

@router.get("/me", response_model=UserProfile)
def get_current_user():
    return DEMO_ADMIN
