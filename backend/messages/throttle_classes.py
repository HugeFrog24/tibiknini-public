from rest_framework.throttling import SimpleRateThrottle


class ContactMessageThrottle(SimpleRateThrottle):
    rate = '2/hour'
    scope = 'contact_message'

    def get_cache_key(self, request, view):
        if not request.user.is_authenticated:
            ip = request.META.get('REMOTE_ADDR', None)
            return self.cache_format % {
                'scope': self.scope,
                'ident': ip
            }
        return self.cache_format % {
            'scope': self.scope,
            'ident': request.user.pk
        }
