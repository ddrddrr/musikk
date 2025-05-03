from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm

from users.models import BaseUser


class BaseUserChangeForm(UserChangeForm):
    class Meta:
        model = BaseUser
        fields = [
            "display_name",
            "email",
            "bio",
            "avatar",
        ]


class BaseUserCreationForm(UserCreationForm):
    class Meta:
        model = BaseUser
        fields = [
            "display_name",
            "email",
            "bio",
            "avatar",
        ]


@admin.register(BaseUser)
class BaseUserAdmin(UserAdmin):
    add_form = BaseUserCreationForm
    form = BaseUserChangeForm
    model = BaseUser

    list_display = (
        "email",
        "display_name",
        "bio",
        "is_active",
        "is_admin",
        "is_superuser",
        "uuid",
    )
    list_filter = ("is_active", "is_admin", "is_superuser", "groups")
    search_fields = ("email", "display_name")
    ordering = ("email",)
    list_display_links = ("email",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Personal info",
            {"fields": ("bio", "display_name", "avatar")},
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_admin",
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
                    "display_name",
                    "avatar",
                    "password1",
                    "password2",
                ),
            },
        ),
    )

    readonly_fields = ("uuid", "last_login")
