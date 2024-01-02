import json
from pathlib import Path
from django.core.management.base import BaseCommand
from core.models import SiteInfo, SiteInfoType


class Command(BaseCommand):
    help = "Loads site information from the core/fixtures/site_info.json file and updates the privacy policy and " \
           "terms of service from separate .md files"

    def handle(self, *args, **options):
        privacy_policy_file = Path("core/fixtures/privacy_policy.md")
        terms_of_service_file = Path("core/fixtures/terms_of_service.md")

        privacy_policy = self.read_file(privacy_policy_file)
        terms_of_service = self.read_file(terms_of_service_file)

        # Load the initial JSON data and extract the site_title
        with open("core/fixtures/site_info.json", "r") as json_file:
            initial_data = json.load(json_file)
            site_title = initial_data[0]["fields"]["site_title"]

        site_info_data = [
            {
                "type": SiteInfoType.PRIVACY_POLICY,
                "content": privacy_policy,
                "site_title": site_title,
            },
            {
                "type": SiteInfoType.TERMS_OF_SERVICE,
                "content": terms_of_service,
                "site_title": site_title,
            },
        ]

        for entry in site_info_data:
            site_info, created = SiteInfo.objects.update_or_create(
                type=entry["type"],
                defaults={"content": entry["content"], "site_title": entry["site_title"]},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created {entry['type']}"))
            else:
                self.stdout.write(self.style.SUCCESS(f"Updated {entry['type']}"))

    @staticmethod
    def read_file(file_path: Path) -> str:
        with file_path.open("r") as file:
            return file.read()
