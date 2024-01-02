import random


def get_random_accent_color():
    # Generate a random subtle color in HEX format (e.g., #EFEFEF)
    r = random.randint(220, 255)
    g = random.randint(220, 255)
    b = random.randint(220, 255)
    return '#{:02X}{:02X}{:02X}'.format(r, g, b)
