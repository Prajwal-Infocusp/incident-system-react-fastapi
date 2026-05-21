from sqlalchemy import Column, String, DateTime, Text, Enum, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class Role(enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class Severity(enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IncidentStatus(enum.Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"

class ActivityAction(enum.Enum):
    CREATED = "CREATED"
    ASSIGNED = "ASSIGNED"
    STATUS_CHANGED = "STATUS_CHANGED"
    COMMENTED = "COMMENTED"
    UPDATED = "UPDATED"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: __import__('uuid').uuid4().hex)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True)
    password = Column(String, nullable=True)
    role = Column(Enum(Role), default=Role.USER)
    createdAt = Column(DateTime, server_default=func.now())
    updatedAt = Column(DateTime, server_default=func.now(), onupdate=func.now())

    createdIncidents = relationship("Incident", back_populates="createdBy", foreign_keys="Incident.createdById")
    assignedIncidents = relationship("Incident", back_populates="assignedTo", foreign_keys="Incident.assignedToId")
    activities = relationship("IncidentActivity", back_populates="createdBy")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, default=lambda: __import__('uuid').uuid4().hex)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(Enum(Severity), default=Severity.MEDIUM)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.OPEN)
    createdById = Column(String, ForeignKey("users.id"), nullable=False)
    assignedToId = Column(String, ForeignKey("users.id"), nullable=True)
    createdAt = Column(DateTime, server_default=func.now())
    updatedAt = Column(DateTime, server_default=func.now(), onupdate=func.now())
    readAt = Column(DateTime, nullable=True)

    createdBy = relationship("User", back_populates="createdIncidents", foreign_keys=[createdById])
    assignedTo = relationship("User", back_populates="assignedIncidents", foreign_keys=[assignedToId])
    activities = relationship("IncidentActivity", back_populates="incident", cascade="all, delete-orphan")

class IncidentActivity(Base):
    __tablename__ = "incident_activities"

    id = Column(String, primary_key=True, default=lambda: __import__('uuid').uuid4().hex)
    action = Column(Enum(ActivityAction), nullable=False)
    message = Column(Text, nullable=False)
    incidentId = Column(String, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    createdById = Column(String, ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, server_default=func.now())

    incident = relationship("Incident", back_populates="activities")
    createdBy = relationship("User", back_populates="activities")