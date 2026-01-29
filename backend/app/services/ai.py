"""
AI Service - OpenAI integration for suggestions, auto-tagging, and optimal ordering
"""
from typing import List, Dict, Any, Optional
from openai import OpenAI
from app.config import settings
from app.core.logging import logger
import json


class AIService:
    """Service for AI-powered features"""

    def __init__(self):
        self.client = None
        if settings.AI_ENABLED and settings.OPENAI_API_KEY:
            try:
                self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("AI Service initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize AI Service: {e}")
                self.client = None
        else:
            logger.warning("AI Service disabled - missing API key or disabled in config")

    def _call_openai(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        response_format: Optional[Dict] = None,
    ) -> Optional[str]:
        """
        Call OpenAI API with error handling
        """
        if not self.client:
            logger.warning("AI client not available")
            return None

        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            kwargs = {
                "model": settings.AI_MODEL,
                "messages": messages,
                "temperature": settings.AI_TEMPERATURE,
                "max_tokens": settings.AI_MAX_TOKENS,
            }

            if response_format:
                kwargs["response_format"] = response_format

            response = self.client.chat.completions.create(**kwargs)

            if response.choices and len(response.choices) > 0:
                return response.choices[0].message.content
            return None

        except Exception as e:
            logger.error(f"OpenAI API error: {e}", exc_info=True)
            return None

    def suggest_organization(
        self,
        room_name: str,
        tasks: List[Dict[str, Any]],
        categories: List[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        """
        Suggest organization for a room based on tasks and categories
        """
        if not self.client:
            return None

        system_prompt = """אתה עוזר AI לארגון בית. תפקידך להציע ארגון אופטימלי של חדרים וחפצים.
        תן הצעות מעשיות, מפורטות, ומותאמות לתרבות הישראלית. השב בעברית."""

        tasks_text = "\n".join([
            f"- {task.get('title', '')}: {task.get('description', '')}"
            for task in tasks[:20]  # Limit to 20 tasks
        ])

        categories_text = ", ".join([cat.get('name', '') for cat in categories])

        prompt = f"""חדר: {room_name}

משימות בחדר:
{tasks_text}

קטגוריות קיימות: {categories_text}

הצע:
1. ארגון אופטימלי של החדר
2. מיקום מומלץ לכל קטגוריה
3. טיפים לארגון יעיל
4. סדר עדיפויות לסידור

השב בפורמט JSON:
{{
  "suggestions": [
    {{
      "type": "organization",
      "title": "כותרת",
      "description": "תיאור מפורט",
      "priority": "high/medium/low"
    }}
  ],
  "optimal_categories": [
    {{
      "category": "שם קטגוריה",
      "location": "מיקום מומלץ",
      "reason": "סיבה"
    }}
  ],
  "tips": ["טיפ 1", "טיפ 2"]
}}"""

        response = self._call_openai(
            prompt=prompt,
            system_prompt=system_prompt,
            response_format={"type": "json_object"},
        )

        if response:
            try:
                return json.loads(response)
            except json.JSONDecodeError:
                logger.warning("Failed to parse AI response as JSON")
                return {"raw_response": response}

        return None

    def auto_tag_task(
        self,
        task_title: str,
        task_description: Optional[str] = None,
        existing_categories: Optional[List[str]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Auto-tag a task with category and tags
        """
        if not self.client:
            return None

        system_prompt = """אתה עוזר AI לתיוג משימות. תפקידך להציע קטגוריה ותגיות מתאימות למשימה.
        השתמש בקטגוריות קיימות אם הן מתאימות, או הצע קטגוריה חדשה.
        השב בעברית ובפורמט JSON."""

        categories_text = ""
        if existing_categories:
            categories_text = f"קטגוריות קיימות: {', '.join(existing_categories)}"

        prompt = f"""משימה:
כותרת: {task_title}
תיאור: {task_description or 'ללא תיאור'}

{categories_text}

הצע:
1. קטגוריה מתאימה (מהקיימות או חדשה)
2. תגיות רלוונטיות (2-5 תגיות)
3. רמת עדיפות (high/medium/low)
4. זמן משוער לביצוע (בדקות)

השב בפורמט JSON:
{{
  "category": "שם קטגוריה",
  "tags": ["תגית 1", "תגית 2"],
  "priority": "high/medium/low",
  "estimated_time_minutes": 30,
  "suggested_room": "שם חדר (אופציונלי)"
}}"""

        response = self._call_openai(
            prompt=prompt,
            system_prompt=system_prompt,
            response_format={"type": "json_object"},
        )

        if response:
            try:
                return json.loads(response)
            except json.JSONDecodeError:
                logger.warning("Failed to parse AI response as JSON")
                return None

        return None

    def calculate_optimal_order(
        self,
        tasks: List[Dict[str, Any]],
        rooms: List[Dict[str, Any]],
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Calculate optimal order for completing tasks
        """
        if not self.client:
            return None

        system_prompt = """אתה עוזר AI לחישוב סדר אופטימלי לביצוע משימות.
        חשב על:
        - יעילות (משימות באותו חדר יחד)
        - עדיפות
        - תלות בין משימות
        - זמן משוער
        השב בעברית ובפורמט JSON."""

        tasks_text = "\n".join([
            f"{i+1}. {task.get('title', '')} (חדר: {task.get('room_name', 'ללא')}, "
            f"עדיפות: {task.get('priority', 'medium')}, זמן: {task.get('estimated_time', 30)} דקות)"
            for i, task in enumerate(tasks)
        ])

        prompt = f"""רשימת משימות:
{tasks_text}

חשב סדר אופטימלי לביצוע המשימות.

השב בפורמט JSON:
{{
  "optimal_order": [
    {{
      "task_id": 1,
      "order": 1,
      "reason": "סיבה לבחירה בסדר זה",
      "estimated_start_time": "09:00",
      "estimated_end_time": "09:30"
    }}
  ],
  "total_time_minutes": 120,
  "efficiency_score": 0.85,
  "suggestions": ["הצעה 1", "הצעה 2"]
}}"""

        response = self._call_openai(
            prompt=prompt,
            system_prompt=system_prompt,
            response_format={"type": "json_object"},
        )

        if response:
            try:
                return json.loads(response)
            except json.JSONDecodeError:
                logger.warning("Failed to parse AI response as JSON")
                return None

        return None

    def suggest_room_improvements(
        self,
        room_name: str,
        tasks: List[Dict[str, Any]],
        completion_rate: float,
    ) -> Optional[Dict[str, Any]]:
        """
        Suggest improvements for a room based on tasks and completion rate
        """
        if not self.client:
            return None

        system_prompt = """אתה עוזר AI לשיפור ארגון חדרים. תן הצעות מעשיות לשיפור.
        השב בעברית ובפורמט JSON."""

        tasks_text = "\n".join([
            f"- {task.get('title', '')} ({'הושלם' if task.get('completed') else 'לא הושלם'})"
            for task in tasks[:15]
        ])

        prompt = f"""חדר: {room_name}
אחוז השלמה: {completion_rate:.0f}%

משימות:
{tasks_text}

הצע שיפורים:
1. ארגון מחדש
2. משימות נוספות
3. שיפור יעילות
4. טיפים כלליים

השב בפורמט JSON:
{{
  "improvements": [
    {{
      "type": "organization/task/efficiency",
      "title": "כותרת",
      "description": "תיאור",
      "impact": "high/medium/low"
    }}
  ],
  "new_task_suggestions": [
    {{
      "title": "כותרת משימה",
      "description": "תיאור",
      "category": "קטגוריה"
    }}
  ]
}}"""

        response = self._call_openai(
            prompt=prompt,
            system_prompt=system_prompt,
            response_format={"type": "json_object"},
        )

        if response:
            try:
                return json.loads(response)
            except json.JSONDecodeError:
                logger.warning("Failed to parse AI response as JSON")
                return None

        return None


# Global instance
ai_service = AIService()
