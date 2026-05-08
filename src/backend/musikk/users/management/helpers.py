from faker import Faker

from users.models import BaseUser, UserRole

fake = Faker()


def create_user_with_password(user_type: str, email: str | None = None):
    user_type = user_type.lower()
    if user_type not in ("streaming", "artist"):
        raise ValueError(f"Invalid user type: {user_type}")

    email = email or fake.ascii_email()
    password = fake.password(length=12, special_chars=True, digits=True)

    role = UserRole.ARTIST if user_type == "artist" else UserRole.BASE

    user = BaseUser.objects.create_user(email=email, password=password, role=role)
    return user, password
