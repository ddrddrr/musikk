from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm

from users.models import BaseUser, BaseProfile


class BaseProfileInline(admin.StackedInline):
    model = BaseProfile
    can_delete = False
    verbose_name_plural = "Profile"


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
    inlines = [BaseProfileInline]

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


@admin.register(BaseProfile)
class BaseProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "display_name", "bio")
    search_fields = ("user__email", "display_name")
    raw_id_fields = ("user",)
