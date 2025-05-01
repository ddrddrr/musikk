from django.contrib.auth import password_validation
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from base.serializers import BaseModelSerializer
from users.user_base import BaseUser


class BaseUserSerializer(BaseModelSerializer):
    class Meta(BaseModelSerializer.Meta):
        model = BaseUser
        fields = BaseModelSerializer.Meta.fields + [
            "email",
            "first_name",
            "last_name",
            "display_name",
            "avatar",
        ]


class ResetPasswordSerializer(serializers.ModelSerializer):
    password_main = serializers.CharField(write_only=True)
    password_repeat = serializers.CharField(write_only=True)

    class Meta:
        model = BaseUser
        fields = ["password_main", "password_repeat"]

    def validate(self, data):
        password_main = data.get("password_main")
        password_repeat = data.get("password_repeat")

        if password_main != password_repeat:
            raise serializers.ValidationError(
                {"password_repeat": "The passwords don't match."}
            )

        return data

    def validate_password_main(self, password):
        password_validation.validate_password(password, self.instance)

        return password

    def update(self, instance, validated_data):
        instance.set_password(validated_data["password_main"])
        instance.save()
        return instance


class TokenPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["display_name"] = user.display_name
        return token
