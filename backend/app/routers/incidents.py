from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.models import User, Incident, IncidentActivity, ActivityAction, IncidentStatus as ModelIncidentStatus, Role
from app.schemas.schemas import (
    IncidentCreate, IncidentUpdate, IncidentResponse, 
    IncidentStats, ActivityCreate, ActivityResponse, UserSummary
)
from app.auth import get_current_user

router = APIRouter(prefix="/incidents", tags=["incidents"])

@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    assignee: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Incident)
    
    if current_user.role == Role.USER:
        query = query.filter(
            (Incident.createdById == current_user.id) | 
            (Incident.assignedToId == current_user.id)
        )
    
    if status:
        query = query.filter(Incident.status == ModelIncidentStatus[status])
    if severity:
        from app.models.models import Severity
        query = query.filter(Incident.severity == Severity[severity])
    if assignee:
        if assignee == "unassigned":
            query = query.filter(Incident.assignedToId.is_(None))
        else:
            query = query.filter(Incident.assignedToId == assignee)
    
    incidents = query.all()
    
    result = []
    for incident in incidents:
        incident_dict = {
            "id": incident.id,
            "title": incident.title,
            "description": incident.description,
            "severity": incident.severity,
            "status": incident.status,
            "createdById": incident.createdById,
            "assignedToId": incident.assignedToId,
            "createdAt": incident.createdAt,
            "updatedAt": incident.updatedAt,
            "createdBy": UserSummary(id=incident.createdBy.id, name=incident.createdBy.name, email=incident.createdBy.email) if incident.createdBy else None,
            "assignedTo": UserSummary(id=incident.assignedTo.id, name=incident.assignedTo.name, email=incident.assignedTo.email) if incident.assignedTo else None,
        }
        result.append(IncidentResponse(**incident_dict))
    
    return sorted(result, key=lambda x: (x.severity.value, x.createdAt), reverse=False)

@router.get("/stats", response_model=IncidentStats)
def get_incident_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total = db.query(Incident).count()
    open_count = db.query(Incident).filter(Incident.status == ModelIncidentStatus.OPEN).count()
    investigating_count = db.query(Incident).filter(Incident.status == ModelIncidentStatus.INVESTIGATING).count()
    resolved_count = db.query(Incident).filter(Incident.status == ModelIncidentStatus.RESOLVED).count()
    critical_count = db.query(Incident).filter(
        Incident.severity.name == "CRITICAL",
        Incident.status != ModelIncidentStatus.RESOLVED
    ).count()
    
    assigned_to_me = db.query(Incident).filter(
        Incident.assignedToId == current_user.id,
        Incident.status != ModelIncidentStatus.RESOLVED
    ).count()
    
    return IncidentStats(
        total=total,
        open=open_count,
        investigating=investigating_count,
        resolved=resolved_count,
        critical=critical_count,
        assignedToMe=assigned_to_me
    )

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
        
    if current_user.role == Role.USER and incident.createdById != current_user.id and incident.assignedToId != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this incident"
        )
    
    activities = db.query(IncidentActivity).filter(IncidentActivity.incidentId == incident_id).order_by(IncidentActivity.createdAt).all()
    
    return IncidentResponse(
        id=incident.id,
        title=incident.title,
        description=incident.description,
        severity=incident.severity,
        status=incident.status,
        createdById=incident.createdById,
        assignedToId=incident.assignedToId,
        createdAt=incident.createdAt,
        updatedAt=incident.updatedAt,
        createdBy=UserSummary(id=incident.createdBy.id, name=incident.createdBy.name, email=incident.createdBy.email) if incident.createdBy else None,
        assignedTo=UserSummary(id=incident.assignedTo.id, name=incident.assignedTo.name, email=incident.assignedTo.email) if incident.assignedTo else None,
        activities=[
            ActivityResponse(
                id=a.id,
                action=a.action,
                message=a.message,
                incidentId=a.incidentId,
                createdById=a.createdById,
                createdAt=a.createdAt,
                createdBy=UserSummary(id=a.createdBy.id, name=a.createdBy.name, email=a.createdBy.email) if a.createdBy else None
            ) for a in activities
        ] if activities else []
    )

@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    incident_data: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == Role.USER and incident_data.assignedToId is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Regular users cannot assign incidents"
        )
        
    incident = Incident(
        title=incident_data.title,
        description=incident_data.description,
        severity=incident_data.severity,
        createdById=current_user.id,
        assignedToId=incident_data.assignedToId if incident_data.assignedToId else None
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    
    activity = IncidentActivity(
        action=ActivityAction.CREATED,
        message=f"Incident created by {current_user.name or current_user.email}",
        incidentId=incident.id,
        createdById=current_user.id
    )
    db.add(activity)
    db.commit()
    
    return IncidentResponse(
        id=incident.id,
        title=incident.title,
        description=incident.description,
        severity=incident.severity,
        status=incident.status,
        createdById=incident.createdById,
        assignedToId=incident.assignedToId,
        createdAt=incident.createdAt,
        updatedAt=incident.updatedAt,
        createdBy=UserSummary(id=current_user.id, name=current_user.name, email=current_user.email),
        assignedTo=None,
        activities=[]
    )

@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: str,
    incident_data: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    
    update_data = incident_data.model_dump(exclude_unset=True)
    
    if current_user.role == Role.USER:
        if incident.createdById != current_user.id and incident.assignedToId != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this incident"
            )
            
        if "assignedToId" in update_data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Regular users cannot assign or reassign incidents"
            )
            
        if "severity" in update_data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Regular users cannot change incident priority or severity"
            )
            
        if "status" in update_data and update_data["status"] == ModelIncidentStatus.OPEN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Regular users cannot set incident status to Open"
            )
            
    for key, value in update_data.items():
        setattr(incident, key, value)
    
    db.commit()
    db.refresh(incident)
    
    activities = []
    
    if incident_data.status:
        activity = IncidentActivity(
            action=ActivityAction.STATUS_CHANGED,
            message=f"Status changed to {incident_data.status.value}",
            incidentId=incident.id,
            createdById=current_user.id
        )
        db.add(activity)
        activities.append(activity)
    
    if incident_data.assignedToId is not None:
        if incident_data.assignedToId:
            assignee = db.query(User).filter(User.id == incident_data.assignedToId).first()
            activity = IncidentActivity(
                action=ActivityAction.ASSIGNED,
                message=f"Assigned to {assignee.name or assignee.email if assignee else 'Unknown'}",
                incidentId=incident.id,
                createdById=current_user.id
            )
        else:
            activity = IncidentActivity(
                action=ActivityAction.ASSIGNED,
                message="Unassigned",
                incidentId=incident.id,
                createdById=current_user.id
            )
        db.add(activity)
        activities.append(activity)
    
    db.commit()
    
    return IncidentResponse(
        id=incident.id,
        title=incident.title,
        description=incident.description,
        severity=incident.severity,
        status=incident.status,
        createdById=incident.createdById,
        assignedToId=incident.assignedToId,
        createdAt=incident.createdAt,
        updatedAt=incident.updatedAt,
        createdBy=UserSummary(id=incident.createdBy.id, name=incident.createdBy.name, email=incident.createdBy.email) if incident.createdBy else None,
        assignedTo=UserSummary(id=incident.assignedTo.id, name=incident.assignedTo.name, email=incident.assignedTo.email) if incident.assignedTo else None,
        activities=[]
    )