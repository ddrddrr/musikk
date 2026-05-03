from django_redis import get_redis_connection


# cached by the lib itself, so fine to call everywhere instead
# of passing a single connection object
def get_default_redis_conn():
    return get_redis_connection("default")
