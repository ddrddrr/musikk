from faker import Faker
from users.models import BaseUser, Artist

fake = Faker()


def create_user_with_password(
    user_type: str, email: str = None
) -> tuple[BaseUser, str]:
    user_type = user_type.lower()
    if user_type not in ("streaming", "artist"):
        raise ValueError(f"Invalid user type: {user_type}")

    email = email or fake.ascii_email()
    password = fake.password(length=12, special_chars=True, digits=True)

    if user_type == "artist":
        user = Artist.objects.create(email=email, password=password)
    else:
        user = BaseUser.objects.create_user(email=email, password=password)

    return user, password
