from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class Role(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IncidentStatus(str, Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"

class ActivityAction(str, Enum):
    CREATED = "CREATED"
    ASSIGNED = "ASSIGNED"
    STATUS_CHANGED = "STATUS_CHANGED"
    COMMENTED = "COMMENTED"
    UPDATED = "UPDATED"

class UserBase(BaseModel):
    name: Optional[str] = None
    email: EmailStr
    role: Role = Role.USER

class UserCreate(UserBase):
    password: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: Optional[str]
    email: str
    role: Role
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class UserSummary(BaseModel):
    id: str
    name: Optional[str]
    email: str

    class Config:
        from_attributes = True

class IncidentBase(BaseModel):
    title: str
    description: Optional[str] = None
    severity: Severity = Severity.MEDIUM

class IncidentCreate(IncidentBase):
    assignedToId: Optional[str] = None

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[Severity] = None
    status: Optional[IncidentStatus] = None
    assignedToId: Optional[str] = None

class ActivityResponse(BaseModel):
    id: str
    action: ActivityAction
    message: str
    incidentId: str
    createdById: str
    createdAt: datetime
    createdBy: Optional[UserSummary] = None

    class Config:
        from_attributes = True

class IncidentResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    severity: Severity
    status: IncidentStatus
    createdById: str
    assignedToId: Optional[str]
    createdAt: datetime
    updatedAt: datetime
    createdBy: Optional[UserSummary] = None
    assignedTo: Optional[UserSummary] = None
    activities: Optional[List[ActivityResponse]] = None

    class Config:
        from_attributes = True

class ActivityCreate(BaseModel):
    action: ActivityAction
    message: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class IncidentStats(BaseModel):
    total: int
    open: int
    investigating: int
    resolved: int
    critical: int
    assignedToMe: int = 0