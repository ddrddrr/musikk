from rest_framework import serializers

from base.models import BaseModel


class BaseModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseModel
        fields = ["uuid", "date_added", "date_modified"]
