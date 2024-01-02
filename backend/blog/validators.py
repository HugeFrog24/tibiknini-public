from django.core.validators import RegexValidator

hex_color_validator = RegexValidator(
    regex=r'^#(?:[0-9a-fA-F]{3}){1,2}$',
    message=(
        "Please provide a valid HEX color code. "
        "HEX color codes consist of a hash sign (#) followed by 3 or 6 hexadecimal digits (0-9, A-F). "
        "Examples: '#FF5733' or '#F53'."
    )
)

tag_name_validator = RegexValidator(
    regex=r'^[A-Za-z0-9]+$',
    message="Tag names can only consist of letters and numbers and must not have spaces."
)
