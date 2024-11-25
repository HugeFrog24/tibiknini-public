from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from .models import ContentReport, ReportReason


class ReportReasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportReason
        fields = ["id", "name", "description"]


class ContentReportSerializer(serializers.ModelSerializer):
    content_type = serializers.PrimaryKeyRelatedField(
        queryset=ContentType.objects.all()
    )
    object_id = serializers.IntegerField()
    reason = serializers.PrimaryKeyRelatedField(
        queryset=ReportReason.objects.filter(is_active=True)
    )
    reported_content_str = serializers.SerializerMethodField()
    content_type_str = serializers.SerializerMethodField()

    class Meta:
        model = ContentReport
        fields = [
            "id",
            "content_type",
            "content_type_str",
            "object_id",
            "reason",
            "description",
            "reported_at",
            "reported_content_str",
        ]
        read_only_fields = ["reported_at", "reported_content_str", "content_type_str"]

    def get_reported_content_str(self, obj):
        try:
            content_obj = obj.content_type.get_object_for_this_type(id=obj.object_id)
            return str(content_obj)
        except:
            return f"{obj.content_type} #{obj.object_id} (deleted)"

    def get_content_type_str(self, obj):
        return obj.content_type.model.title()

    def create(self, validated_data):
        validated_data["reporter"] = self.context["request"].user
        return super().create(validated_data)

    def validate(self, data):
        # Verify that the object exists
        try:
            content_obj = data["content_type"].get_object_for_this_type(
                id=data["object_id"]
            )
        except:
            raise serializers.ValidationError("The reported content does not exist")

        # Prevent self-reporting
        if (
            data["content_type"].model_class().__name__ == "CustomUser"
            and data["object_id"] == self.context["request"].user.id
        ):
            raise serializers.ValidationError("You cannot report yourself")

        return data
