import re
import logging
from typing import Any
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from .models import BadWord, ContentAnalysisResult

logger = logging.getLogger(__name__)


class ContentAnalyzer:
    """
    Utility class for analyzing content for inappropriate material.
    """
    
    def __init__(self):
        self.bad_words = self._load_bad_words()
    
    def _load_bad_words(self) -> list[BadWord]:
        """Load active bad words from database."""
        return list(BadWord.objects.filter(is_active=True))
    
    def analyze_content(self, content: str, content_obj: Any = None) -> dict[str, Any]:
        """
        Analyze content for inappropriate material.
        
        Args:
            content: The text content to analyze
            content_obj: The Django model instance being analyzed (optional)
            
        Returns:
            Dictionary containing analysis results
        """
        if not content or not content.strip():
            return {
                'flagged_words': [],
                'severity_score': 0,
                'max_severity': None,
                'action_required': False,
                'content_length': 0,
                'analysis_summary': 'No content to analyze'
            }
        
        content_lower = content.lower()
        flagged_words = []
        severity_scores = {'low': 10, 'medium': 25, 'high': 50, 'critical': 100}
        total_score = 0
        max_severity = None
        max_severity_level = 0
        
        # Check each bad word
        for bad_word in self.bad_words:
            matches = self._find_matches(content_lower, bad_word)
            
            if matches:
                word_score = severity_scores.get(bad_word.severity, 0)
                match_count = len(matches)
                
                # Multiple occurrences increase the score
                adjusted_score = word_score * min(match_count, 3)  # Cap at 3x multiplier
                total_score += adjusted_score
                
                # Track the highest severity level
                current_severity_level = severity_scores.get(bad_word.severity, 0)
                if current_severity_level > max_severity_level:
                    max_severity_level = current_severity_level
                    max_severity = bad_word.severity
                
                flagged_words.append({
                    'word': bad_word.word,
                    'severity': bad_word.severity,
                    'matches': matches,
                    'match_count': match_count,
                    'score_contribution': adjusted_score,
                    'is_regex': bad_word.is_regex,
                    'description': bad_word.description
                })
        
        # Cap total score at 100
        total_score = min(total_score, 100)
        
        # Determine if action is required
        action_required = total_score >= 25 or max_severity in ['high', 'critical']
        
        # Auto-hide for critical content
        auto_hide = max_severity == 'critical' or total_score >= 75
        
        analysis_result = {
            'flagged_words': flagged_words,
            'severity_score': total_score,
            'max_severity': max_severity,
            'action_required': action_required,
            'auto_hide': auto_hide,
            'content_length': len(content),
            'flagged_word_count': len(flagged_words),
            'analysis_summary': self._generate_summary(flagged_words, total_score, max_severity or 'low')
        }
        
        # Save analysis result if content object is provided
        if content_obj:
            self._save_analysis_result(content_obj, analysis_result)
        
        return analysis_result
    
    def _find_matches(self, content: str, bad_word: BadWord) -> list[str]:
        """Find matches for a bad word in content."""
        matches = []
        
        try:
            if bad_word.is_regex:
                # Use regex pattern
                pattern = re.compile(bad_word.word, re.IGNORECASE)
                matches = [match.group() for match in pattern.finditer(content)]
            else:
                # Simple word matching with word boundaries
                word_pattern = r'\b' + re.escape(bad_word.word.lower()) + r'\b'
                pattern = re.compile(word_pattern, re.IGNORECASE)
                matches = [match.group() for match in pattern.finditer(content)]
        except re.error as e:
            logger.warning(f"Invalid regex pattern for bad word '{bad_word.word}': {e}")
        
        return matches
    
    def _generate_summary(
        self,
        flagged_words: list[dict[str, Any]],
        score: int,
        max_severity: str,
    ) -> str:
        """Generate a human-readable summary of the analysis."""
        if not flagged_words:
            return "Content appears clean - no inappropriate material detected."
        
        word_count = len(flagged_words)
        severity_text = {
            'low': 'minor issues',
            'medium': 'moderate concerns',
            'high': 'serious violations',
            'critical': 'critical violations'
        }.get(max_severity, 'issues')
        
        if score >= 75:
            return f"Content flagged for automatic hiding - {word_count} violations detected with {severity_text}."
        elif score >= 50:
            return f"Content requires review - {word_count} violations detected with {severity_text}."
        elif score >= 25:
            return f"Content flagged for attention - {word_count} potential issues detected."
        else:
            return f"Content has minor flags - {word_count} low-severity issues detected."
    
    def _save_analysis_result(
        self,
        content_obj: Any,
        analysis: dict[str, Any],
    ) -> None:
        """Save analysis result to database."""
        try:
            content_type = ContentType.objects.get_for_model(content_obj)
            
            # Update or create analysis result
            analysis_result, created = ContentAnalysisResult.objects.update_or_create(
                content_type=content_type,
                object_id=content_obj.pk,
                defaults={
                    'flagged_words': analysis['flagged_words'],
                    'severity_score': analysis['severity_score'],
                    'max_severity': analysis['max_severity'],
                    'content_length': analysis['content_length'],
                    'action_required': analysis['action_required'],
                    'auto_hidden': analysis['auto_hide'],
                }
            )
            
            # Auto-hide content if critical
            if analysis['auto_hide'] and hasattr(content_obj, 'hidden'):
                content_obj.hidden = True
                content_obj.save()
                analysis_result.action_taken = True
                analysis_result.save()
                
                logger.warning(f"Auto-hid content {content_type} #{content_obj.pk} due to critical violations")
                
                # Send notification email to the content author
                self._send_auto_hide_notification(content_obj, analysis)
            
        except Exception as e:
            logger.error(f"Failed to save analysis result: {e}")
    
    def get_analysis_for_content(self, content_obj: Any) -> ContentAnalysisResult | None:
        """Get existing analysis result for content object."""
        content_type = ContentType.objects.get_for_model(content_obj)
        try:
            return ContentAnalysisResult.objects.get(
                content_type=content_type,
                object_id=content_obj.pk
            )
        except ContentAnalysisResult.DoesNotExist:
            return None
    
    def _send_auto_hide_notification(
        self,
        content_obj: Any,
        analysis: dict[str, Any],
    ) -> None:
        """Send email notification when content is auto-hidden."""
        try:
            # Get the content author
            affected_user = None
            if hasattr(content_obj, 'author'):
                affected_user = content_obj.author
            elif hasattr(content_obj, 'user'):
                affected_user = content_obj.user
            
            if not affected_user or not affected_user.email:
                logger.info(f"No email to send auto-hide notification for content {content_obj.pk}")
                return
            
            # Import here to avoid circular imports
            from core.models import SiteInfo
            from core.tasks import send_scheduled_email
            
            # Get site information for email context
            site_info = SiteInfo.objects.first()
            site_title = site_info.site_title if site_info else "Our Platform"
            
            # Determine content type for user-friendly display
            content_type_display = {
                'comment': 'comment',
                'blogpost': 'blog post',
                'customuser': 'profile'
            }.get(content_obj.__class__.__name__.lower(), 'content')
            
            # Generate violation summary
            flagged_words = analysis.get('flagged_words', [])
            violation_summary = []
            for flagged in flagged_words:
                if flagged['severity'] in ['critical', 'high']:
                    violation_summary.append(f"• {flagged['description']} ({flagged['match_count']} occurrence{'s' if flagged['match_count'] > 1 else ''})")
            
            context = {
                'username': affected_user.username,
                'site_title': site_title,
                'content_type': content_type_display,
                'content_description': str(content_obj)[:100] + ('...' if len(str(content_obj)) > 100 else ''),
                'severity_score': analysis['severity_score'],
                'max_severity': analysis['max_severity'],
                'violation_summary': '\n'.join(violation_summary[:5]),  # Limit to 5 violations
                'total_violations': len(flagged_words),
                'action_taken': 'automatically hidden',
                'action_description': 'Your content has been automatically hidden due to policy violations',
                'review_date': timezone.now().strftime("%B %d, %Y at %I:%M %p %Z"),
                'reviewer': 'Automated Content Moderation System',
            }
            
            # Schedule the auto-hide notification email
            send_scheduled_email.delay(
                subject=f"Content Automatically Hidden - {site_title}",
                recipient_list=[affected_user.email],
                template_name="emails/moderation_notification.txt",
                context=context,
            )
            
            logger.info(f"Scheduled auto-hide notification email for user {affected_user.username}")
            
        except Exception as e:
            logger.error(f"Failed to send auto-hide notification email: {e}")

    def refresh_bad_words(self) -> None:
        """Refresh the bad words list from database."""
        self.bad_words = self._load_bad_words()
        logger.info(f"Refreshed bad words list - loaded {len(self.bad_words)} active words")


# Global analyzer instance
content_analyzer = ContentAnalyzer()