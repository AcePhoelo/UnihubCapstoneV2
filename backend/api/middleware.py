# api/middleware.py
import json
from django.http import JsonResponse

class InputValidationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only check POST/PUT/PATCH requests with JSON content
        if request.method in ['POST', 'PUT', 'PATCH'] and 'application/json' in request.headers.get('Content-Type', ''):
            try:
                # Try to parse JSON body
                if request.body:
                    json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON format'}, status=400)
            
            # Check for oversized payloads
            if len(request.body) > 1024 * 1024:  # 1MB limit
                return JsonResponse({'error': 'Request payload too large'}, status=413)
                
        response = self.get_response(request)
        return response