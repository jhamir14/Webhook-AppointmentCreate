from django.shortcuts import render
import requests
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

# Create your views here.

def get_headers():
    return {
        'Authorization': f'Bearer {settings.GHL_PRIVATE_TOKEN}',
        'Content-Type': 'application/json',
        'Version': '2021-07-28',  # Header de versión requerido por GoHighLevel
    }

def get_calendario():
    try:
        # Probar diferentes endpoints de la API
        endpoints_to_try = [
            "https://services.leadconnectorhq.com/calendars/",
            "https://services.leadconnectorhq.com/calendars",
            f"https://services.leadconnectorhq.com/calendars/?locationId={settings.GHL_LOCATION_ID}",
            f"https://services.leadconnectorhq.com/calendars?locationId={settings.GHL_LOCATION_ID}",
        ]
        
        for endpoint in endpoints_to_try:
            print(f"Trying endpoint: {endpoint}")
            print(f"Headers: {get_headers()}")
            
            response = requests.get(endpoint, headers=get_headers())
            
            print(f"Response status code: {response.status_code}")
            print(f"Response headers: {dict(response.headers)}")
            print(f"Response text: {response.text[:500]}...")  # Primeros 500 caracteres
            
            if response.status_code == 200:
                if response.text.strip():  # Verificar que no esté vacía
                    return response.json()
                else:
                    print("Empty response, trying next endpoint...")
                    continue
            elif response.status_code == 401:
                print("Unauthorized, trying next endpoint...")
                continue
            else:
                print(f"HTTP {response.status_code}, trying next endpoint...")
                continue
        
        # Si llegamos aquí, todos los endpoints fallaron
        return {'error': 'All endpoints failed', 'last_status': response.status_code}
        
    except requests.exceptions.RequestException as e:
        return {'error': f'Request failed: {str(e)}'}
    except ValueError as e:
        return {'error': f'Invalid JSON response: {str(e)}'}


def calendario(request):
    """Vista para obtener calendarios de GoHighLevel"""
    try:
        result = get_calendario()
        
        # Si hay error en la respuesta, devolverlo
        if 'error' in result:
            return JsonResponse(result, status=500)
        
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': f'Unexpected error: {str(e)}'}, status=500)

def calendario_detail(request, id):
    """Vista para obtener un calendario específico de GoHighLevel"""
    try:
        print(f"Looking for calendar with ID: {id}")
        result = get_calendario()
        
        # Si hay error en la respuesta, devolverlo
        if 'error' in result:
            return JsonResponse(result, status=500)
        
        # Filtrar por ID específico si existe
        if 'calendars' in result:
            print(f"Found {len(result['calendars'])} calendars")
            for calendar in result['calendars']:
                print(f"Checking calendar ID: {calendar.get('id')} against {id}")
                if calendar.get('id') == str(id):
                    print(f"Found matching calendar: {calendar.get('name')}")
                    return JsonResponse(calendar)
            
            print(f"Calendar with ID {id} not found")
            return JsonResponse({'error': f'Calendar with ID {id} not found'}, status=404)
        
        return JsonResponse({'error': 'No calendars found in response'}, status=404)
    except Exception as e:
        print(f"Error in calendario_detail: {str(e)}")
        return JsonResponse({'error': f'Unexpected error: {str(e)}'}, status=500)


@api_view(['GET', 'POST'])
def calendario_create_api(request):
    """Vista API para crear citas usando Django REST Framework"""
    if request.method == 'GET':
        return Response({
            'message': 'Endpoint para crear citas en GoHighLevel',
            'method': 'POST',
            'content_type': 'application/json',
            'required_fields': {
                'title': 'string - Título de la cita',
                'startTime': 'string - Hora de inicio (ISO 8601)',
                'endTime': 'string - Hora de fin (ISO 8601)',
                'calendarId': 'string - ID del calendario',
                'notes': 'string - Notas opcionales'
            },
            'example': {
                'title': 'Cita de prueba',
                'startTime': '2024-01-15T10:00:00Z',
                'endTime': '2024-01-15T11:00:00Z',
                'calendarId': '2Xm67bMv2DpdoL8LQQi8',
                'notes': 'Notas opcionales'
            },
            'note': 'El campo locationId se agrega automáticamente'
        })
    
    elif request.method == 'POST':
        try:
            data = request.data
            
            # URL para crear citas - probando con diferentes endpoints
            # Primero intentamos con el endpoint de eventos
            appointments_url = "https://services.leadconnectorhq.com/calendars/events/appointments"
            
            # Headers con versión
            headers = get_headers()
            headers['Version'] = '2021-07-28'
            
            # Agregar locationId a los datos
            data['locationId'] = settings.GHL_LOCATION_ID
            
            print(f"Creating appointment with data: {data}")
            print(f"URL: {appointments_url}")
            print(f"Headers: {headers}")
            
            response = requests.post(appointments_url, headers=headers, json=data)
            
            print(f"Response status code: {response.status_code}")
            print(f"Response text: {response.text[:500]}...")
            
            if response.status_code in [200, 201]:
                return Response(response.json(), status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'error': f'Failed to create appointment: {response.status_code}',
                    'details': response.text
                }, status=response.status_code)
                
        except Exception as e:
            return Response({'error': f'Unexpected error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
