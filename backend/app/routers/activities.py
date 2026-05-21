from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, IncidentActivity
from app.schemas.schemas import ActivityCreate, ActivityResponse, UserSummary
from app.auth import get_current_user

router = APIRouter(prefix="/incidents/{incident_id}/activities", tags=["activities"])

@router.post("", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def add_activity(
    incident_id: str,
    activity_data: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.models import Incident
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    
    activity = IncidentActivity(
        action=activity_data.action,
        message=activity_data.message,
        incidentId=incident_id,
        createdById=current_user.id
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    
    return ActivityResponse(
        id=activity.id,
        action=activity.action,
        message=activity.message,
        incidentId=activity.incidentId,
        createdById=activity.createdById,
        createdAt=activity.createdAt,
        createdBy=UserSummary(id=current_user.id, name=current_user.name, email=current_user.email)
    )