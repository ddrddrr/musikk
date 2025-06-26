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

        StreamingProfile.objects.for_user(user=user)
        if self.cleaned_data.get("is_artist"):
            ArtistProfile.objects.for_user(user=user)

        return user


class BaseUserSerializer(BaseModelSerializer):
    class Meta(BaseModelSerializer.Meta):
        model = BaseUser
        fields = BaseModelSerializer.Meta.fields + ["email", "is_active"]


class BaseProfileSerializer(BaseModelSerializer):
    display_name = serializers.CharField()
    bio = serializers.CharField()
    avatar = serializers.ImageField()

    class Meta(BaseModelSerializer.Meta):
        model = BaseProfile
        fields = BaseModelSerializer.Meta.fields + ["display_name", "bio", "avatar"]
