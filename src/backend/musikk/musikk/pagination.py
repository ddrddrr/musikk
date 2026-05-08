from rest_framework.pagination import LimitOffsetPagination


class BaseLimitOffsetPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 20
