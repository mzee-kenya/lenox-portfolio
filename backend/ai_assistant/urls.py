from django.urls import path

from ai_assistant import views

app_name = "ai_assistant"

urlpatterns = [
    path("ai/assist/", views.AssistView.as_view(), name="ai-assist"),
    path("ai/analyze/", views.AnalyzeView.as_view(), name="ai-analyze"),
    path("ai/history/", views.HistoryView.as_view(), name="ai-history"),
]