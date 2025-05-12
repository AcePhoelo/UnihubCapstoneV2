from django.test import TestCase
from api.utils import clean_input

class CleanInputTests(TestCase):
    def test_clean_input_string(self):
        """Test that clean_input properly escapes malicious strings"""
        malicious_input = '<script>alert("XSS Attack")</script>'
        sanitized = clean_input(malicious_input)
        self.assertEqual(sanitized, '&lt;script&gt;alert("XSS Attack")&lt;/script&gt;')
        
    def test_clean_input_dict(self):
        """Test that clean_input properly handles dictionaries"""
        malicious_dict = {
            'name': 'Normal Name',
            'comment': '<script>document.cookie</script>',
            'id': 123  # Non-string should be unchanged
        }
        sanitized = clean_input(malicious_dict)
        self.assertEqual(sanitized['name'], 'Normal Name')
        self.assertEqual(sanitized['comment'], '&lt;script&gt;document.cookie&lt;/script&gt;')
        self.assertEqual(sanitized['id'], 123)
        
    def test_clean_input_nested(self):
        """Test that clean_input handles nested structures"""
        nested_input = {
            'user': {
                'name': 'User',
                'bio': '<img src="x" onerror="alert(1)">'
            },
            'comments': ['Great!', '<script>evil()</script>']
        }
        sanitized = clean_input(nested_input)
        self.assertEqual(sanitized['user']['bio'], 
                        '&lt;img src="x" onerror="alert(1)"&gt;')
        self.assertEqual(sanitized['comments'][1], '&lt;script&gt;evil()&lt;/script&gt;')