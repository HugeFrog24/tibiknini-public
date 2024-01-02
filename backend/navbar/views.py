import json
from .models import NavbarItem


def load_default_navbar_items():
    # Check if there are any navbar items in the database
    if not NavbarItem.objects.exists():
        # Load the default navbar items from the JSON file
        with open('default_navbar_items.json', 'r') as f:
            default_items = json.load(f)

        # Create and save the default navbar items in the database
        for item in default_items:
            NavbarItem.objects.create(
                id=item['pk'],
                label=item['fields']['label'],
                destination_url=item['fields']['destination_url']
            )
