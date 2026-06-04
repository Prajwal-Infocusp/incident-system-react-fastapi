from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.models import User, Incident, IncidentStatus
from app.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

# Schema to match Next.js response structure
class NotificationItem(BaseModel):
    id: str
    title: str
    severity: str
    status: str
    assignedToId: Optional[str]

class NotificationsResponse(BaseModel):
    notifications: List[NotificationItem]
    currentUserId: Optional[str]

@router.get("", response_model=NotificationsResponse)
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find all unresolved incidents assigned to the current user where readAt is None/null
    incidents = db.query(Incident).filter(
        Incident.assignedToId == current_user.id,
        Incident.status != IncidentStatus.RESOLVED,
        Incident.readAt == None
    ).order_by(
        Incident.createdAt.desc()
    ).limit(10).all()

    notifications_list = []
    for inc in incidents:
        notifications_list.append(NotificationItem(
            id=inc.id,
            title=inc.title,
            severity=inc.severity.name,
            status=inc.status.name,
            assignedToId=inc.assignedToId
        ))

    return NotificationsResponse(
        notifications=notifications_list,
        currentUserId=current_user.id
    )

@router.post("/{incident_id}")
def mark_notification_read(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
        
    if incident.assignedToId != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    incident.readAt = datetime.now()
    db.commit()
    return {"success": True}
