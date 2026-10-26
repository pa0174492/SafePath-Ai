from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apps.api.config import settings
from apps.api.routers import health, route, counterfactual, resilience, context, accessibility, research, config_router, hotspots, incidents, safehavens

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SafePath-AI: An Uncertainty-Aware, Context-Adaptive Multi-Objective Routing Framework for Safe and Accessible Urban Mobility",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all modular routers
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(route.router, prefix=settings.API_PREFIX)
app.include_router(counterfactual.router, prefix=settings.API_PREFIX)
app.include_router(resilience.router, prefix=settings.API_PREFIX)
app.include_router(context.router, prefix=settings.API_PREFIX)
app.include_router(accessibility.router, prefix=settings.API_PREFIX)
app.include_router(research.router, prefix=settings.API_PREFIX)
app.include_router(config_router.router, prefix=settings.API_PREFIX)
app.include_router(hotspots.router, prefix=settings.API_PREFIX)
app.include_router(incidents.router, prefix=settings.API_PREFIX)
app.include_router(safehavens.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "message": "Welcome to SafePath-AI Research API Gateway",
        "docs": "/api/v1/docs",
        "version": settings.VERSION,
        "mode": settings.EXECUTION_MODE
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host="0.0.0.0", port=8000, reload=True)
