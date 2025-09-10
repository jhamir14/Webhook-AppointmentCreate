from django.contrib import admin
from django.urls import path
from django.urls import include
from calendario import views


urlpatterns = [
    path('calendars/', views.calendario, name='calendars'),
    path('calendars/webhooks/calendars/appointments/api/', views.calendario_create_api, name='calendars_create_api'),
    path('calendars/<str:id>/', views.calendario_detail, name='calendars_detail'),
]