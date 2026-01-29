"""
Statistics Service - חישוב מדדים סטטיסטיים
ממוצע, סטיית תקן, אחוזי סיום, התפלגויות
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from statistics import mean, stdev, median
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from app.db.models import Task, Room, Category, User
from app.core.logging import logger


class StatisticsService:
    """Service for calculating statistics"""

    @staticmethod
    def calculate_completion_rate(tasks: List[Task]) -> Dict[str, Any]:
        """
        חישוב אחוזי סיום משימות
        Returns: {
            "total": int,
            "completed": int,
            "pending": int,
            "completion_rate": float (0-100),
            "completion_percentage": float (0-100)
        }
        """
        total = len(tasks)
        if total == 0:
            return {
                "total": 0,
                "completed": 0,
                "pending": 0,
                "completion_rate": 0.0,
                "completion_percentage": 0.0,
            }

        completed = sum(1 for task in tasks if task.completed)
        pending = total - completed
        completion_rate = (completed / total) * 100

        return {
            "total": total,
            "completed": completed,
            "pending": pending,
            "completion_rate": round(completion_rate, 2),
            "completion_percentage": round(completion_rate, 2),
        }

    @staticmethod
    def calculate_task_statistics_by_room(
        db: Session, user_id: int, room_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        סטטיסטיקות משימות לפי חדר
        """
        query = db.query(Task).filter(Task.user_id == user_id)
        
        if room_id:
            query = query.filter(Task.room_id == room_id)

        tasks = query.all()
        completion_stats = StatisticsService.calculate_completion_rate(tasks)

        # חישוב ממוצע משימות לחדר
        rooms_with_tasks = (
            db.query(Room.id, func.count(Task.id).label("task_count"))
            .join(Task, Room.id == Task.room_id)
            .filter(Room.owner_id == user_id)
            .group_by(Room.id)
            .all()
        )

        if rooms_with_tasks:
            task_counts = [count for _, count in rooms_with_tasks]
            avg_tasks_per_room = mean(task_counts)
            if len(task_counts) > 1:
                std_tasks_per_room = stdev(task_counts)
            else:
                std_tasks_per_room = 0.0
            if task_counts:
                median_tasks_per_room = median(task_counts)
            else:
                median_tasks_per_room = 0.0
        else:
            avg_tasks_per_room = 0.0
            std_tasks_per_room = 0.0
            median_tasks_per_room = 0.0

        return {
            **completion_stats,
            "avg_tasks_per_room": round(avg_tasks_per_room, 2),
            "std_tasks_per_room": round(std_tasks_per_room, 2),
            "median_tasks_per_room": round(median_tasks_per_room, 2),
            "rooms_count": len(rooms_with_tasks),
        }

    @staticmethod
    def calculate_task_statistics_by_category(
        db: Session, user_id: int, category_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        סטטיסטיקות משימות לפי קטגוריה
        """
        query = db.query(Task).filter(Task.user_id == user_id)
        
        if category_id:
            query = query.filter(Task.category_id == category_id)

        tasks = query.all()
        completion_stats = StatisticsService.calculate_completion_rate(tasks)

        # חישוב ממוצע משימות לקטגוריה
        categories_with_tasks = (
            db.query(Category.id, func.count(Task.id).label("task_count"))
            .join(Task, Category.id == Task.category_id)
            .filter(Category.user_id == user_id)
            .group_by(Category.id)
            .all()
        )

        if categories_with_tasks:
            task_counts = [count for _, count in categories_with_tasks]
            avg_tasks_per_category = mean(task_counts)
            if len(task_counts) > 1:
                std_tasks_per_category = stdev(task_counts)
            else:
                std_tasks_per_category = 0.0
            if task_counts:
                median_tasks_per_category = median(task_counts)
            else:
                median_tasks_per_category = 0.0
        else:
            avg_tasks_per_category = 0.0
            std_tasks_per_category = 0.0
            median_tasks_per_category = 0.0

        return {
            **completion_stats,
            "avg_tasks_per_category": round(avg_tasks_per_category, 2),
            "std_tasks_per_category": round(std_tasks_per_category, 2),
            "median_tasks_per_category": round(median_tasks_per_category, 2),
            "categories_count": len(categories_with_tasks),
        }

    @staticmethod
    def calculate_time_based_statistics(
        db: Session, user_id: int, days: int = 30
    ) -> Dict[str, Any]:
        """
        סטטיסטיקות לפי זמן (למשל: משימות שנוצרו/הושלמו בשבוע/חודש האחרון)
        """
        now = datetime.utcnow()
        start_date = now - timedelta(days=days)

        # משימות שנוצרו בתקופה
        created_tasks = (
            db.query(Task)
            .filter(
                Task.user_id == user_id,
                Task.created_at >= start_date,
            )
            .all()
        )

        # משימות שהושלמו בתקופה
        completed_tasks = (
            db.query(Task)
            .filter(
                Task.user_id == user_id,
                Task.completed == True,
                Task.updated_at >= start_date,
            )
            .all()
        )

        # משימות עם due_date בתקופה
        due_tasks = (
            db.query(Task)
            .filter(
                Task.user_id == user_id,
                Task.due_date >= start_date,
                Task.due_date <= now + timedelta(days=7),  # עד שבוע קדימה
            )
            .all()
        )

        created_count = len(created_tasks)
        completed_count = len(completed_tasks)
        due_count = len(due_tasks)

        # חישוב ממוצע יומי
        if days > 0:
            avg_created_per_day = created_count / days
            avg_completed_per_day = completed_count / days
        else:
            avg_created_per_day = 0.0
            avg_completed_per_day = 0.0

        return {
            "period_days": days,
            "period_start": start_date.isoformat(),
            "period_end": now.isoformat(),
            "tasks_created": created_count,
            "tasks_completed": completed_count,
            "tasks_due": due_count,
            "avg_created_per_day": round(avg_created_per_day, 2),
            "avg_completed_per_day": round(avg_completed_per_day, 2),
            "completion_rate_in_period": (
                round((completed_count / created_count * 100), 2)
                if created_count > 0
                else 0.0
            ),
        }

    @staticmethod
    def calculate_room_distribution(db: Session, user_id: int) -> List[Dict[str, Any]]:
        """
        התפלגות משימות לפי חדרים
        """
        distribution = (
            db.query(
                Room.id,
                Room.name,
                func.count(Task.id).label("task_count"),
                func.sum(func.cast(Task.completed, func.Integer)).label("completed_count"),
            )
            .outerjoin(Task, Room.id == Task.room_id)
            .filter(Room.owner_id == user_id)
            .group_by(Room.id, Room.name)
            .all()
        )

        result = []
        for room_id, room_name, task_count, completed_count in distribution:
            completion_rate = (
                (completed_count / task_count * 100) if task_count > 0 else 0.0
            )
            result.append({
                "room_id": room_id,
                "room_name": room_name,
                "task_count": task_count or 0,
                "completed_count": completed_count or 0,
                "pending_count": (task_count or 0) - (completed_count or 0),
                "completion_rate": round(completion_rate, 2),
            })

        return result

    @staticmethod
    def calculate_category_distribution(
        db: Session, user_id: int
    ) -> List[Dict[str, Any]]:
        """
        התפלגות משימות לפי קטגוריות
        """
        distribution = (
            db.query(
                Category.id,
                Category.name,
                func.count(Task.id).label("task_count"),
                func.sum(func.cast(Task.completed, func.Integer)).label("completed_count"),
            )
            .outerjoin(Task, Category.id == Task.category_id)
            .filter(Category.user_id == user_id)
            .group_by(Category.id, Category.name)
            .all()
        )

        result = []
        for cat_id, cat_name, task_count, completed_count in distribution:
            completion_rate = (
                (completed_count / task_count * 100) if task_count > 0 else 0.0
            )
            result.append({
                "category_id": cat_id,
                "category_name": cat_name,
                "task_count": task_count or 0,
                "completed_count": completed_count or 0,
                "pending_count": (task_count or 0) - (completed_count or 0),
                "completion_rate": round(completion_rate, 2),
            })

        return result

    @staticmethod
    def calculate_overall_statistics(db: Session, user_id: int) -> Dict[str, Any]:
        """
        סטטיסטיקות כלליות - סיכום כל המדדים
        """
        # משימות כלליות
        all_tasks = db.query(Task).filter(Task.user_id == user_id).all()
        completion_stats = StatisticsService.calculate_completion_rate(all_tasks)

        # סטטיסטיקות לפי חדר
        room_stats = StatisticsService.calculate_task_statistics_by_room(db, user_id)

        # סטטיסטיקות לפי קטגוריה
        category_stats = StatisticsService.calculate_task_statistics_by_category(
            db, user_id
        )

        # סטטיסטיקות לפי זמן (30 יום)
        time_stats = StatisticsService.calculate_time_based_statistics(db, user_id, 30)

        # התפלגויות
        room_distribution = StatisticsService.calculate_room_distribution(db, user_id)
        category_distribution = StatisticsService.calculate_category_distribution(
            db, user_id
        )

        # חישוב ממוצע וסטיית תקן של completion rates
        if room_distribution:
            room_completion_rates = [
                room["completion_rate"] for room in room_distribution
            ]
            avg_room_completion = mean(room_completion_rates)
            if len(room_completion_rates) > 1:
                std_room_completion = stdev(room_completion_rates)
            else:
                std_room_completion = 0.0
        else:
            avg_room_completion = 0.0
            std_room_completion = 0.0

        if category_distribution:
            category_completion_rates = [
                cat["completion_rate"] for cat in category_distribution
            ]
            avg_category_completion = mean(category_completion_rates)
            if len(category_completion_rates) > 1:
                std_category_completion = stdev(category_completion_rates)
            else:
                std_category_completion = 0.0
        else:
            avg_category_completion = 0.0
            std_category_completion = 0.0

        return {
            "overall": {
                **completion_stats,
            },
            "by_room": {
                **room_stats,
            },
            "by_category": {
                **category_stats,
            },
            "by_time": {
                **time_stats,
            },
            "distributions": {
                "rooms": room_distribution,
                "categories": category_distribution,
            },
            "averages": {
                "avg_room_completion_rate": round(avg_room_completion, 2),
                "std_room_completion_rate": round(std_room_completion, 2),
                "avg_category_completion_rate": round(avg_category_completion, 2),
                "std_category_completion_rate": round(std_category_completion, 2),
            },
        }

    @staticmethod
    def calculate_task_duration_statistics(
        db: Session, user_id: int
    ) -> Dict[str, Any]:
        """
        סטטיסטיקות על משך זמן ביצוע משימות (מ-created_at עד completed_at)
        """
        completed_tasks = (
            db.query(Task)
            .filter(
                Task.user_id == user_id,
                Task.completed == True,
                Task.created_at.isnot(None),
                Task.updated_at.isnot(None),
            )
            .all()
        )

        if not completed_tasks:
            return {
                "total_completed": 0,
                "avg_duration_hours": 0.0,
                "avg_duration_days": 0.0,
                "median_duration_hours": 0.0,
                "median_duration_days": 0.0,
                "std_duration_hours": 0.0,
                "min_duration_hours": 0.0,
                "max_duration_hours": 0.0,
            }

        durations = []
        for task in completed_tasks:
            if task.created_at and task.updated_at:
                duration = (task.updated_at - task.created_at).total_seconds() / 3600  # שעות
                durations.append(duration)

        if not durations:
            return {
                "total_completed": len(completed_tasks),
                "avg_duration_hours": 0.0,
                "avg_duration_days": 0.0,
                "median_duration_hours": 0.0,
                "median_duration_days": 0.0,
                "std_duration_hours": 0.0,
                "min_duration_hours": 0.0,
                "max_duration_hours": 0.0,
            }

        avg_hours = mean(durations)
        median_hours = median(durations)
        std_hours = stdev(durations) if len(durations) > 1 else 0.0
        min_hours = min(durations)
        max_hours = max(durations)

        return {
            "total_completed": len(completed_tasks),
            "avg_duration_hours": round(avg_hours, 2),
            "avg_duration_days": round(avg_hours / 24, 2),
            "median_duration_hours": round(median_hours, 2),
            "median_duration_days": round(median_hours / 24, 2),
            "std_duration_hours": round(std_hours, 2),
            "min_duration_hours": round(min_hours, 2),
            "max_duration_hours": round(max_hours, 2),
        }


# Global instance
statistics_service = StatisticsService()
