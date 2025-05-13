from django.urls import path
from . import views

urlpatterns = [
    path('predict/', views.predict_tumor, name='predict-tumor'),
    path('chatbot/', views.chatbot, name='chatbot'),
]