"""
Recurring Tasks Service - ניהול משימות חוזרות עם RRULE
תומך בתזמון חזרתי מתקדם (כל 3 ימים, ראשון ראשון בחודש, וכו')
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from dateutil.rrule import rrulestr, rrule, DAILY, WEEKLY, MONTHLY, YEARLY
from dateutil.parser import parse as parse_date
from sqlalchemy.orm import Session
from app.db.models import Task
from app.core.logging import logger


class RecurringTasksService:
    """Service for managing recurring tasks with RRULE"""

    @staticmethod
    def parse_rrule(rrule_string: str, dtstart: datetime) -> rrule:
        """
        Parse RRULE string and create rrule object
        Examples:
        - "FREQ=DAILY;INTERVAL=3" - כל 3 ימים
        - "FREQ=WEEKLY;BYDAY=MO" - כל יום שני
        - "FREQ=MONTHLY;BYMONTHDAY=1" - ראשון ראשון בחודש
        - "FREQ=MONTHLY;BYDAY=1MO" - ראשון ראשון בחודש (יום שני)
        """
        try:
            # Add DTSTART if not present
            if "DTSTART" not in rrule_string.upper():
                rrule_string = f"DTSTART:{dtstart.strftime('%Y%m%dT%H%M%S')}\n{rrule_string}"
            
            rule = rrulestr(rrule_string, dtstart=dtstart)
            return rule
        except Exception as e:
            logger.error(f"Error parsing RRULE: {e}", extra={"rrule_string": rrule_string})
            raise ValueError(f"Invalid RRULE format: {e}")

    @staticmethod
    def generate_occurrences(
        rrule_string: str,
        start_date: datetime,
        end_date: Optional[datetime] = None,
        count: Optional[int] = 100,
    ) -> List[datetime]:
        """
        Generate list of occurrence dates based on RRULE
        """
        try:
            rule = RecurringTasksService.parse_rrule(rrule_string, start_date)
            
            # Set end date or count
            if end_date:
                occurrences = list(rule.between(start_date, end_date, inc=True))
            elif count:
                occurrences = list(rule)[:count]
            else:
                # Default: next 100 occurrences
                occurrences = list(rule)[:100]
            
            return occurrences
        except Exception as e:
            logger.error(f"Error generating occurrences: {e}")
            return []

    @staticmethod
    def create_recurring_instances(
        db: Session,
        template_task: Task,
        until_date: Optional[datetime] = None,
        max_instances: int = 100,
    ) -> List[Task]:
        """
        Create task instances based on RRULE template
        """
        if not template_task.rrule_string or not template_task.rrule_start_date:
            logger.warning("Task is not a recurring template", extra={"task_id": template_task.id})
            return []

        try:
            # Generate occurrences
            occurrences = RecurringTasksService.generate_occurrences(
                rrule_string=template_task.rrule_string,
                start_date=template_task.rrule_start_date,
                end_date=until_date or template_task.rrule_end_date,
                count=max_instances,
            )

            # Filter out past dates (only create future instances)
            now = datetime.utcnow()
            future_occurrences = [occ for occ in occurrences if occ >= now]

            if not future_occurrences:
                logger.info("No future occurrences to create", extra={"task_id": template_task.id})
                return []

            # Check existing instances to avoid duplicates
            existing_dates = {
                task.due_date.date()
                for task in db.query(Task)
                .filter(
                    Task.parent_task_id == template_task.id,
                    Task.completed == False,
                )
                .all()
                if task.due_date
            }

            # Create new instances
            new_instances = []
            for occurrence in future_occurrences:
                # Skip if instance already exists for this date
                if occurrence.date() in existing_dates:
                    continue

                # Create new task instance
                instance = Task(
                    title=template_task.title,
                    description=template_task.description,
                    due_date=occurrence,
                    category_id=template_task.category_id,
                    room_id=template_task.room_id,
                    user_id=template_task.user_id,
                    parent_task_id=template_task.id,
                    is_recurring_template=False,
                    completed=False,
                )
                db.add(instance)
                new_instances.append(instance)

            db.commit()
            
            logger.info(
                f"Created {len(new_instances)} recurring task instances",
                extra={
                    "template_task_id": template_task.id,
                    "instances_created": len(new_instances),
                }
            )

            return new_instances

        except Exception as e:
            logger.error(f"Error creating recurring instances: {e}", exc_info=True)
            db.rollback()
            return []

    @staticmethod
    def get_next_occurrence(rrule_string: str, start_date: datetime) -> Optional[datetime]:
        """Get the next occurrence date"""
        occurrences = RecurringTasksService.generate_occurrences(
            rrule_string, start_date, count=1
        )
        return occurrences[0] if occurrences else None

    @staticmethod
    def validate_rrule(rrule_string: str) -> tuple[bool, Optional[str]]:
        """
        Validate RRULE string
        Returns: (is_valid, error_message)
        """
        try:
            # Try to parse with a dummy date
            test_date = datetime.utcnow()
            RecurringTasksService.parse_rrule(rrule_string, test_date)
            return True, None
        except Exception as e:
            return False, str(e)

    @staticmethod
    def get_rrule_examples() -> List[Dict[str, str]]:
        """
        Get examples of common RRULE patterns
        """
        return [
            {
                "name": "כל יום",
                "rrule": "FREQ=DAILY",
                "description": "משימה חוזרת כל יום",
            },
            {
                "name": "כל 3 ימים",
                "rrule": "FREQ=DAILY;INTERVAL=3",
                "description": "משימה חוזרת כל 3 ימים",
            },
            {
                "name": "כל יום שני",
                "rrule": "FREQ=WEEKLY;BYDAY=MO",
                "description": "משימה חוזרת כל יום שני",
            },
            {
                "name": "כל שבוע",
                "rrule": "FREQ=WEEKLY",
                "description": "משימה חוזרת כל שבוע",
            },
            {
                "name": "ראשון ראשון בחודש",
                "rrule": "FREQ=MONTHLY;BYMONTHDAY=1",
                "description": "משימה חוזרת ב-1 לחודש",
            },
            {
                "name": "ראשון ראשון בחודש (יום שני)",
                "rrule": "FREQ=MONTHLY;BYDAY=1MO",
                "description": "משימה חוזרת ביום שני הראשון של כל חודש",
            },
            {
                "name": "כל חודש",
                "rrule": "FREQ=MONTHLY",
                "description": "משימה חוזרת כל חודש",
            },
            {
                "name": "כל שנה",
                "rrule": "FREQ=YEARLY",
                "description": "משימה חוזרת כל שנה",
            },
        ]


# Global instance
recurring_tasks_service = RecurringTasksService()
