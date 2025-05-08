from faker import Faker

from users.models import StreamingUser, Artist, Label

fake = Faker()

USER_CLASSES = {
    "streaming": StreamingUser,
    "artist": Artist,
    "label": Label,
}


def create_user_with_password(
    user_type: str, email: str = None
) -> tuple[StreamingUser | Artist | Label, str]:
    user_type = user_type.lower()
    if user_type not in USER_CLASSES:
        raise ValueError(f"Invalid user type: {user_type}")

    email = email or fake.ascii_email()
    password = fake.password(length=12, special_chars=True, digits=True)
    display_name = fake.user_name()

    UserClass = USER_CLASSES[user_type]
    user = UserClass.objects.create_user(
        email=email, password=password, display_name=display_name
    )

    return user, password
