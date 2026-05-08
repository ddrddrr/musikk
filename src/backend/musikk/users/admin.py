from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from users.models import BaseUser


# TODO: user artist stuff
class BaseUserChangeForm(UserChangeForm):
    class Meta:
        model = BaseUser
        fields = [
            "email",
        ]


class BaseUserCreationForm(UserCreationForm):
    class Meta:
        model = BaseUser
        fields = [
            "email",
        ]


@admin.register(BaseUser)
class BaseUserAdmin(UserAdmin):
    add_form = BaseUserCreationForm
    form = BaseUserChangeForm
    model = BaseUser

    list_display = (
        "email",
        "is_active",
        "is_staff",
        "is_superuser",
        "uuid",
    )
    list_filter = ("is_active", "is_staff", "is_superuser", "groups")
    search_fields = ("email",)
    ordering = ("email",)
    list_display_links = ("email",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login",)}),
        ("Other", {"fields": ("uuid",)}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                ),
            },
        ),
    )

    readonly_fields = ("uuid", "last_login")
