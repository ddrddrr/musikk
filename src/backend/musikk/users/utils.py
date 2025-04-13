from django.contrib.auth.tokens import (
    PasswordResetTokenGenerator as DjangoPwdResetTokenGenerator,
)

password_reset_token_generator = DjangoPwdResetTokenGenerator()
