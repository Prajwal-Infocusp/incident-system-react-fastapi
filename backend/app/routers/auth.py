from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import UserResponse, Token, GoogleLoginRequest
from app.auth import create_access_token, get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/google", response_model=Token)
def google_auth(login_data: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        # Verify Google Token
        id_info = id_token.verify_oauth2_token(
            login_data.credential,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        
        # ID token is valid. Get user's email and name.
        email = id_info.get("email")
        name = id_info.get("name")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google account."
            )
            
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )
        
    # Check if user already exists
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Register new user automatically since Google register is compulsory
        user = User(
            name=name,
            email=email,
            password=None  # No password for Google-only users
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user