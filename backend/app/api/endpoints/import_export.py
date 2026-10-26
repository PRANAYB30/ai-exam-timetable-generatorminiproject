"""CSV Import and Export API Endpoints."""
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.services.import_export import import_csv_data

router = APIRouter(prefix="/import", tags=["Import / Export"])


@router.post("/csv")
async def import_csv_endpoint(
    entity_type: str = Form(..., description="exams, rooms, or groups"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a valid .csv file.",
        )

    content = await file.read()
    decoded = content.decode("utf-8", errors="replace")

    try:
        result = import_csv_data(db, entity_type, decoded)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
