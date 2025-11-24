from faker import Faker
from users.models import BaseUser, StreamingProfile, ArtistProfile

fake = Faker()


def create_user_with_password(
    user_type: str, email: str = None
) -> tuple[BaseUser, str]:
    user_type = user_type.lower()
    if user_type not in ("streaming", "artist"):
        raise ValueError(f"Invalid user type: {user_type}")

    email = email or fake.ascii_email()
    password = fake.password(length=12, special_chars=True, digits=True)

    user = BaseUser.objects.create_user(email=email, password=password)

    StreamingProfile.objects.get_or_create_for_user(user=user)
    if user_type == "artist":
        ArtistProfile.objects.get_or_create_for_user(user=user)

    return user, password
