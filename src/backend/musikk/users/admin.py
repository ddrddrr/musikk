from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm

from users.models import BaseUser

from django.contrib.auth.forms import UserChangeForm


class BaseUserChangeForm(UserChangeForm):
    class Meta:
        model = BaseUser
        fields = [
            "display_name",
            "email",
            "first_name",
            "last_name",
        ]


class BaseUserCreationForm(UserCreationForm):
    class Meta:
        model = BaseUser
        fields = ["display_name", "email", "first_name", "last_name"]


@admin.register(BaseUser)
class BaseUserAdmin(UserAdmin):
    add_form = BaseUserCreationForm
    form = BaseUserChangeForm

    model = BaseUser
    list_display = (
        "email",
        "first_name",
        "last_name",
        "display_name",
        "is_staff",
        "is_active",
        "is_admin",
        "uuid",
    )
    list_filter = (
        "email",
        "is_staff",
        "is_active",
    )
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Personal info",
            {"fields": ("first_name", "last_name", "display_name", "avatar")},
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_admin",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "display_name",
                    "first_name",
                    "last_name",
                    "password1",
                    "password2",
                ),
            },
        ),
    )
    search_fields = ("email",)
    ordering = ("email",)
    list_display_links = ("email",)
