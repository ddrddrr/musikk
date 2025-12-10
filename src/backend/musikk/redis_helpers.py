from django_redis import get_redis_connection


def get_default_redis():
    return get_redis_connection("default")
