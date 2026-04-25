import io
import random

from django.core.files import File
from PIL import Image


class ImageProvider:
    def get_image(
        self,
        width_range: tuple[int, int] = (300, 1920),
        height_range: tuple[int, int] = (200, 1080),
    ) -> File:
        size = (
            random.randint(*width_range),
            random.randint(*height_range),
        )
        return self._generate_placeholder(size)

    def _generate_placeholder(self, size: tuple[int, int]) -> File:
        color = (
            random.randint(30, 220),
            random.randint(30, 220),
            random.randint(30, 220),
        )
        img = Image.new("RGB", size, color)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return File(buf, name="placeholder.png")
