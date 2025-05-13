from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.response import Response
from .brain_tumour_detection import predict_tumor_type
from groq import Groq
import os
import json

@api_view(['POST'])
@parser_classes([MultiPartParser])
def predict_tumor(request):
    """API endpoint for tumor prediction"""
    if 'image' not in request.FILES:
        return Response({'error': 'No image file provided'}, status=400)

    image_file = request.FILES['image']

    if image_file.size > 10 * 1024 * 1024:  # 10MB limit
        return Response({'error': 'File too large (max 10MB)'}, status=400)

    try:
        result = predict_tumor_type(image_file)
        return Response(result)

    except Exception as e:
        return Response({
            'error': 'Image processing or prediction failed',
            'detail': str(e)
        }, status=500)


# Use environment variable for API key in production
from django.conf import settings

client = Groq(api_key=settings.GROQ_API_KEY)

@api_view(['POST'])
@parser_classes([JSONParser])
def chatbot(request):
    try:
        data = json.loads(request.body) if isinstance(request.body, bytes) else request.data
        user_message = data.get('message', '').strip()
        context = data.get('context', {})
        
        if not user_message:
            return Response({'error': 'Empty message'}, status=400)

        # Build system prompt based on context
        system_prompt = """You are a medical assistant specializing in neurology and brain tumors. 
        Provide accurate, helpful information about brain conditions and tumors.
        
        Important guidelines:
        - Keep responses concise but thorough (about 3 or less paragraphs)
        - Use simple language that patients can understand
        - Avoid making definitive diagnoses
        - Remind users to consult healthcare professionals for medical advice
        - For tumor information, mention detection confidence when relevant
        """
        
        # Add tumor context if available
        if context.get('tumor_type'):
            confidence = context.get('confidence', 'N/A')
            system_prompt += f"\n\nCurrent scan analysis: {context['tumor_type']} detected with {confidence}% confidence."
            
            # Add probability breakdown if available
            if context.get('probabilities'):
                probs = context.get('probabilities')
                system_prompt += "\n\nProbability breakdown:\n"
                for tumor_type, prob in probs.items():
                    system_prompt += f"- {tumor_type}: {prob}%\n"

        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            model="llama3-8b-8192",
            temperature=0.3,  # Lower temperature for more factual responses
            max_tokens=400,   # Increased token limit for more comprehensive answers
            top_p=0.9
        )

        return Response({
            'reply': response.choices[0].message.content
        })

    except Exception as e:
        return Response({
            'error': 'Failed to generate response',
            'detail': str(e)
        }, status=500)