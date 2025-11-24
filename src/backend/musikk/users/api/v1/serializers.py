from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers

from base.serializers import BaseModelSerializer
from users.models import BaseUser, StreamingProfile, ArtistProfile
from users.models.profiles import BaseProfile


class BaseRegisterSerializer(RegisterSerializer):
    username = None
    is_artist = serializers.BooleanField(write_only=True, default=False)

    def save(self, request):
        user = super().save(request)

        StreamingProfile.objects.get_or_create_for_user(user=user)
        if self.cleaned_data.get("is_artist"):
            ArtistProfile.objects.get_or_create_for_user(user=user)

        return user


class BaseUserSerializer(BaseModelSerializer):
    class Meta(BaseModelSerializer.Meta):
        model = BaseUser
        fields = BaseModelSerializer.Meta.fields + ["email"]
        extra_kwargs = {
            "email": {"read_only": True},
        }


class BaseProfileSerializer(BaseModelSerializer):
    display_name = serializers.CharField(required=False)
    bio = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta(BaseModelSerializer.Meta):
        model = BaseProfile
        fields = BaseModelSerializer.Meta.fields + ["display_name", "bio", "avatar"]

# TODO
# class StreamingProfileSerializer(BaseProfileSerializer):
#     class Meta(BaseModelSerializer.Meta):
#         model = StreamingProfile
#         fields = BaseModelSerializer.Meta.fields + ["display_name", "bio", "avatar"]
