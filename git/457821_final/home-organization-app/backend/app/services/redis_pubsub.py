import redis
import json
import logging
from typing import Callable, Optional
from app.config import settings

logger = logging.getLogger(__name__)


class RedisPubSubService:
    def __init__(self):
        self.redis_client = redis.from_url(
            settings.CELERY_BROKER_URL,
            decode_responses=True
        )
        self.pubsub = self.redis_client.pubsub()

    def publish(self, channel: str, message: dict):
        """Publish message to Redis channel"""
        try:
            self.redis_client.publish(channel, json.dumps(message))
            logger.debug(f"Published to channel {channel}: {message}")
        except Exception as e:
            logger.error(f"Error publishing to channel {channel}: {e}")

    def subscribe(self, channel: str, callback: Callable):
        """Subscribe to Redis channel"""
        try:
            self.pubsub.subscribe(channel)
            logger.info(f"Subscribed to channel: {channel}")
            
            for message in self.pubsub.listen():
                if message['type'] == 'message':
                    try:
                        data = json.loads(message['data'])
                        callback(data)
                    except json.JSONDecodeError as e:
                        logger.error(f"Error decoding message: {e}")
        except Exception as e:
            logger.error(f"Error subscribing to channel {channel}: {e}")

    def publish_task_update(self, user_id: int, task_data: dict):
        """Publish task update to user's channel"""
        channel = f"user:{user_id}:tasks"
        self.publish(channel, {
            "type": "task_update",
            "data": task_data
        })

    def publish_task_created(self, user_id: int, task_data: dict):
        """Publish task creation to user's channel"""
        channel = f"user:{user_id}:tasks"
        self.publish(channel, {
            "type": "task_created",
            "data": task_data
        })

    def publish_task_deleted(self, user_id: int, task_id: int):
        """Publish task deletion to user's channel"""
        channel = f"user:{user_id}:tasks"
        self.publish(channel, {
            "type": "task_deleted",
            "data": {"task_id": task_id}
        })

    def publish_notification(self, user_id: int, notification_data: dict):
        """Publish notification to user's channel"""
        channel = f"user:{user_id}:notifications"
        self.publish(channel, {
            "type": "notification",
            "data": notification_data
        })

    def close(self):
        """Close pubsub connection"""
        self.pubsub.close()
        self.redis_client.close()


# Global instance
redis_pubsub = RedisPubSubService()
