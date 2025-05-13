from rest_framework.throttling import SimpleRateThrottle

class AuthRateThrottle(SimpleRateThrottle):
    scope = 'auth'
    
    def get_cache_key(self, request, view):
        """
        Use the IP address and username (if available) as a unique cache key.
        This prevents brute force attacks from the same IP or against the same username.
        """
        ident = self.get_ident(request)
        
        if request.data and 'username' in request.data:
            username = request.data.get('username')
            return f"{self.scope}_{ident}_{username}"
        return f"{self.scope}_{ident}"