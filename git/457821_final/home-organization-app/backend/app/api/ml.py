"""
API endpoints for ML (Machine Learning) features
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from app.db.session import get_db
from app.api.deps import get_current_user
from app.db.models import User
from app.services.ai import ai_service
from app.core.logging import logger
from app.config import settings
from pydantic import BaseModel


router = APIRouter(prefix="/ml", tags=["ml"])


class MLRecommendRequest(BaseModel):
    """Request for ML recommendation"""
    data: Dict[str, Any] = {}


class MLRecommendResponse(BaseModel):
    """Response for ML recommendation"""
    suggestion: str


@router.post("/recommend", response_model=MLRecommendResponse)
async def recommend_task(
    request: MLRecommendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get ML recommendation for next home organizing task
    """
    if not settings.AI_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML features are disabled",
        )
    
    if not ai_service.client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not available",
        )
    
    try:
        # GDPR: Sanitize data - remove PII (Personally Identifiable Information)
        # Only send minimal, non-identifying data to external API
        sanitized_data = {}
        if request.data:
            # Only include safe fields (no user_id, email, personal info)
            safe_fields = ['room_id', 'task_count', 'completion_rate']
            for key in safe_fields:
                if key in request.data:
                    sanitized_data[key] = request.data[key]
        
        # Build prompt for recommendation (without user_id - GDPR compliant)
        prompt = f"Suggest a next home-organising task based on the following data: {sanitized_data}"
        
        # Call AI service
        suggestion = ai_service._call_openai(
            prompt=prompt,
            system_prompt="אתה עוזר AI לארגון בית. תפקידך להציע משימות ארגון בית. השב בעברית, קצר ומעשי.",
        )
        
        if not suggestion:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to generate recommendation",
            )
        
        logger.info(
            "ML recommendation generated",
            extra={"user_id": current_user.id},
        )
        
        return MLRecommendResponse(suggestion=suggestion)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ML recommendation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate recommendation",
        )
