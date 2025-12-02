import json

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class ReportReason(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_report_reasons",
    )
    last_modified_at = models.DateTimeField(auto_now=True)
    last_modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="modified_report_reasons",
    )

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]
        verbose_name = "Report Reason"
        verbose_name_plural = "Report Reasons"


class ContentReport(models.Model):
    VERDICT_CHOICES = [
        ("pending", "Pending Review"),
        ("upheld_hidden", "Upheld - Content Hidden"),
        ("upheld_warning", "Upheld - Warning Issued"),
        ("upheld_banned", "Upheld - User Banned"),
        ("rejected", "Rejected - Content Follows Rules"),
    ]

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="reported_content",
    )
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    reason = models.ForeignKey(
        ReportReason, on_delete=models.PROTECT, related_name="reports"
    )
    description = models.TextField(blank=True)
    reported_at = models.DateTimeField(default=timezone.now)

    # Review information
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="reviewed_reports",
    )
    verdict = models.CharField(
        max_length=20, choices=VERDICT_CHOICES, default="pending"
    )
    verdict_note = models.TextField(blank=True)
    action_taken = models.BooleanField(default=False)

    class Meta:
        ordering = ["-reported_at"]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]
        verbose_name = "Content Report"
        verbose_name_plural = "Content Reports"

    def __str__(self):
        return f"Report #{self.id} - {self.get_verdict_display()}"

    def review(self, reviewer, verdict, note=""):
        if not self.action_taken and verdict.startswith("upheld"):
            raise ValidationError(
                "Must take moderation action before marking report as upheld"
            )

        self.reviewed_by = reviewer
        self.verdict = verdict
        self.verdict_note = note
        self.reviewed_at = timezone.now()
        self.save()

    def take_action(self, moderator, action_type):
        """
        Take moderation action on the reported content.
        """
        content_obj = self.content_type.get_object_for_this_type(id=self.object_id)
        user = None  # Initialize user variable

        if action_type == "hide":
            # Deactivate the content
            if hasattr(content_obj, "is_active"):
                content_obj.is_active = False
                content_obj.save()
            elif hasattr(content_obj, "hidden"):
                content_obj.hidden = True
                content_obj.save()
            else:
                raise ValidationError("Content object doesn't support hiding")

        elif action_type == "warning":
            if hasattr(content_obj, "author") or hasattr(content_obj, "user"):
                user = getattr(content_obj, "author", None) or getattr(
                    content_obj, "user"
                )
                UserWarning.objects.create(
                    user=user, issued_by=moderator, reason=self.reason.name, report=self
                )
            else:
                raise ValidationError("Content object doesn't have an associated user")

        elif action_type == "ban":
            if hasattr(content_obj, "author") or hasattr(content_obj, "user"):
                user = getattr(content_obj, "author", None) or getattr(
                    content_obj, "user"
                )
                user.is_active = False
                user.save()
            else:
                raise ValidationError("Content object doesn't have an associated user")

        self.action_taken = True
        self.save()

        # Create appropriate state tracking based on action type
        if action_type == "hide":
            previous_state = {"hidden": False}
            new_state = {"hidden": True}
            notes = f"Content hidden due to report #{self.id}"
        elif action_type == "warning" and user:
            previous_state = {"warnings_count": user.warnings.count() - 1}
            new_state = {"warnings_count": user.warnings.count()}
            notes = f"Warning issued to user {user.username} due to report #{self.id}"
        elif action_type == "ban" and user:
            previous_state = {"is_active": True}
            new_state = {"is_active": False}
            notes = f"User {user.username} banned due to report #{self.id}"
        else:
            previous_state = {}
            new_state = {"action": action_type}
            notes = f"Action {action_type} taken due to report #{self.id}"

        ModerationAction.objects.create(
            action_type=f"content_{action_type}d",
            performed_by=moderator,
            report=self,
            previous_state=previous_state,
            new_state=new_state,
            notes=notes,
        )


class UserWarning(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="warnings"
    )
    issued_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="issued_warnings",
    )
    reason = models.CharField(max_length=200)
    report = models.ForeignKey(
        ContentReport,
        on_delete=models.SET_NULL,
        null=True,
        related_name="resulting_warnings",
    )
    issued_at = models.DateTimeField(auto_now_add=True)
    acknowledged = models.BooleanField(default=False)

    class Meta:
        ordering = ["-issued_at"]

    def __str__(self):
        return f"Warning to {self.user} - {self.reason}"


class ModerationAction(models.Model):
    ACTION_TYPES = [
        ("report_created", "Report Created"),
        ("report_reviewed", "Report Reviewed"),
        ("content_hidden", "Content Hidden"),
        ("content_warned", "Warning Issued"),
        ("content_banned", "User Banned"),
        ("reason_created", "Report Reason Created"),
        ("reason_modified", "Report Reason Modified"),
        ("reason_deactivated", "Report Reason Deactivated"),
    ]

    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="moderation_actions",
    )
    performed_at = models.DateTimeField(auto_now_add=True)

    # Related objects
    report = models.ForeignKey(
        ContentReport,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="actions",
    )
    report_reason = models.ForeignKey(
        ReportReason,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="actions",
    )

    # Store the complete state at the time of action
    previous_state = models.JSONField(null=True, blank=True)
    new_state = models.JSONField()
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-performed_at"]
        verbose_name = "Moderation Action"
        verbose_name_plural = "Moderation Actions"

    def __str__(self):
        return f"{self.get_action_type_display()} by {self.performed_by} at {self.performed_at}"


class BadWord(models.Model):
    """
    Model to store words/phrases that should be flagged in content moderation.
    """
    SEVERITY_CHOICES = [
        ('low', 'Low - Warning'),
        ('medium', 'Medium - Content Hidden'),
        ('high', 'High - User Warning'),
        ('critical', 'Critical - User Ban'),
    ]
    
    word = models.CharField(max_length=100, unique=True)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='medium')
    is_active = models.BooleanField(default=True)
    is_regex = models.BooleanField(default=False, help_text="Whether this word should be treated as a regex pattern")
    description = models.TextField(blank=True, help_text="Optional description of why this word is flagged")
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_bad_words",
    )
    last_modified_at = models.DateTimeField(auto_now=True)
    last_modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="modified_bad_words",
    )

    class Meta:
        ordering = ['word']
        verbose_name = "Bad Word"
        verbose_name_plural = "Bad Words"

    def __str__(self):
        return f"{self.word} ({self.get_severity_display()})"


class ContentAnalysisResult(models.Model):
    """
    Model to store results of content analysis.
    """
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    
    # Analysis results
    flagged_words = models.JSONField(default=list, help_text="List of flagged words found in content")
    severity_score = models.IntegerField(default=0, help_text="Overall severity score (0-100)")
    max_severity = models.CharField(max_length=10, choices=BadWord.SEVERITY_CHOICES, null=True, blank=True)
    
    # Metadata
    analyzed_at = models.DateTimeField(auto_now_add=True)
    content_length = models.IntegerField(default=0)
    language_detected = models.CharField(max_length=10, blank=True)
    
    # Actions taken
    action_required = models.BooleanField(default=False)
    action_taken = models.BooleanField(default=False)
    auto_hidden = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-analyzed_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['severity_score']),
            models.Index(fields=['action_required']),
        ]
        verbose_name = "Content Analysis Result"
        verbose_name_plural = "Content Analysis Results"

    def __str__(self):
        return f"Analysis for {self.content_type} #{self.object_id} - Score: {self.severity_score}"
