from django.utils.html import escape  # Make sure to import this


def clean_input(data):
    """Sanitize user input to prevent XSS attacks"""
    if isinstance(data, dict):
        return {k: clean_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_input(item) for item in data]
    elif isinstance(data, str):
        return escape(data)
    return data
