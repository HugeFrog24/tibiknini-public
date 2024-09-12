import json
from pathlib import Path

from django.core.management.base import BaseCommand
from core.models import SiteInfo, PrivacyPolicy, TermsOfService


class Command(BaseCommand):
    help = "Loads site information and updates the privacy policy and terms of service."

    def handle(self, *args, **options):
        # Load the initial JSON data
        with open("core/fixtures/site_info.json") as json_file:
            initial_data = json.load(json_file)[0]  # Access the first object in the array
            site_title = initial_data["fields"]["site_title"]
            site_description = initial_data["fields"]["site_description"]

        # Update SiteInfo
        SiteInfo.objects.update_or_create(
            id=1, defaults={"site_title": site_title, "site_description": site_description}
        )

        # Update Privacy Policy and Terms of Service
        privacy_policy_file = Path("core/fixtures/privacy_policy.md")
        terms_of_service_file = Path("core/fixtures/terms_of_service.md")

        privacy_policy = self.read_file(privacy_policy_file)
        terms_of_service = self.read_file(terms_of_service_file)

        PrivacyPolicy.objects.update_or_create(
            id=1, defaults={"content": privacy_policy}
        )
        TermsOfService.objects.update_or_create(
            id=1, defaults={"content": terms_of_service}
        )

    @staticmethod
    def read_file(file_path: Path) -> str:
        with file_path.open("r") as file:
            return file.read()
