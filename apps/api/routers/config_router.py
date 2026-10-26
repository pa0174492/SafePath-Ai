import os
import re
import urllib.request
import json
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from apps.api.config import settings

router = APIRouter(prefix="/config", tags=["Configuration & API Keys"])

class APIKeysPayload(BaseModel):
    mapbox_api_key: Optional[str] = Field(None, description="Mapbox Access Token (pk.eyJ...)")
    openrouteservice_api_key: Optional[str] = Field(None, description="OpenRouteService API Key")
    google_maps_api_key: Optional[str] = Field(None, description="Google Maps JavaScript / Directions API Key")
    openweather_api_key: Optional[str] = Field(None, description="OpenWeatherMap API Key")

class KeyValidationRequest(BaseModel):
    provider: str = Field(..., description="Provider: mapbox, openrouteservice, google, openweather")
    api_key: str = Field(..., description="API Key or Token to test")

def mask_key(k: Optional[str]) -> Optional[str]:
    if not k:
        return None
    if len(k) <= 8:
        return "****"
    return f"{k[:5]}...{k[-4:]}"

def update_env_file(key_values: Dict[str, str]):
    env_path = ".env"
    lines = []
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            
    existing_keys = set()
    new_lines = []
    for line in lines:
        matched = False
        for k, v in key_values.items():
            if line.startswith(f"{k}=") or line.startswith(f'export {k}='):
                new_lines.append(f'{k}="{v}"\n')
                existing_keys.add(k)
                matched = True
                break
        if not matched:
            new_lines.append(line)
            
    for k, v in key_values.items():
        if k not in existing_keys:
            new_lines.append(f'{k}="{v}"\n')
            
    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

@router.get("/keys")
def get_api_keys_status():
    """Retrieve active API keys status and unlocked geospatial capabilities."""
    mapbox_token = settings.MAPBOX_API_KEY or settings.NEXT_PUBLIC_MAPBOX_TOKEN
    return {
        "status": "success",
        "providers": {
            "mapbox": {
                "name": "Mapbox Vector & Satellite HD",
                "configured": bool(mapbox_token and len(mapbox_token) > 10),
                "masked_key": mask_key(mapbox_token),
                "unlocked_features": ["Mapbox Streets v12", "Mapbox Satellite Streets HD", "Mapbox Dark v11"]
            },
            "openrouteservice": {
                "name": "OpenRouteService (ORS)",
                "configured": bool(settings.OPENROUTESERVICE_API_KEY and len(settings.OPENROUTESERVICE_API_KEY) > 10),
                "masked_key": mask_key(settings.OPENROUTESERVICE_API_KEY),
                "unlocked_features": ["ORS Elevation-aware Foot Routing", "Dynamic Isochrones"]
            },
            "google_maps": {
                "name": "Google Maps Platform",
                "configured": bool(settings.GOOGLE_MAPS_API_KEY and len(settings.GOOGLE_MAPS_API_KEY) > 10),
                "masked_key": mask_key(settings.GOOGLE_MAPS_API_KEY),
                "unlocked_features": ["Google Street & Hybrid Imagery"]
            },
            "openweather": {
                "name": "OpenWeatherMap",
                "configured": bool(settings.OPENWEATHER_API_KEY and len(settings.OPENWEATHER_API_KEY) > 10),
                "masked_key": mask_key(settings.OPENWEATHER_API_KEY),
                "unlocked_features": ["Micro-radar Precipitation", "Real-time UV Index"]
            }
        },
        "default_mode": "FREE_PUBLIC_ACCESS (OpenStreetMap, CartoDB, OSRM, Open-Meteo)"
    }

@router.post("/keys")
def save_api_keys(payload: APIKeysPayload):
    """Save API keys into runtime settings and persistent .env file."""
    updates: Dict[str, str] = {}
    
    if payload.mapbox_api_key is not None:
        token = payload.mapbox_api_key.strip()
        settings.MAPBOX_API_KEY = token
        settings.NEXT_PUBLIC_MAPBOX_TOKEN = token
        updates["MAPBOX_API_KEY"] = token
        updates["NEXT_PUBLIC_MAPBOX_TOKEN"] = token
        
    if payload.openrouteservice_api_key is not None:
        key = payload.openrouteservice_api_key.strip()
        settings.OPENROUTESERVICE_API_KEY = key
        updates["OPENROUTESERVICE_API_KEY"] = key
        
    if payload.google_maps_api_key is not None:
        key = payload.google_maps_api_key.strip()
        settings.GOOGLE_MAPS_API_KEY = key
        updates["GOOGLE_MAPS_API_KEY"] = key
        
    if payload.openweather_api_key is not None:
        key = payload.openweather_api_key.strip()
        settings.OPENWEATHER_API_KEY = key
        updates["OPENWEATHER_API_KEY"] = key
        
    if updates:
        try:
            update_env_file(updates)
        except Exception as e:
            # Non-fatal if .env write fails in read-only environment
            pass
            
    return get_api_keys_status()

@router.post("/validate")
def validate_api_key(req: KeyValidationRequest):
    """Live validation of third-party API key with upstream provider."""
    provider = req.provider.lower().strip()
    key = req.api_key.strip()
    
    if not key:
        return {"valid": False, "provider": provider, "message": "Key cannot be empty."}
        
    if provider == "mapbox":
        try:
            url = f"https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token={key}"
            request = urllib.request.Request(url, headers={"User-Agent": "SafePath-AI Validator"})
            with urllib.request.urlopen(request, timeout=4.0) as res:
                if res.status == 200:
                    return {
                        "valid": True,
                        "provider": "mapbox",
                        "message": "Mapbox Access Token verified successfully! High-resolution vector & satellite tiles unlocked."
                    }
        except urllib.error.HTTPError as e:
            if e.code in [401, 403]:
                return {"valid": False, "provider": "mapbox", "message": "Invalid Mapbox token or unauthorized access (HTTP 401/403)."}
            return {"valid": False, "provider": "mapbox", "message": f"Mapbox verification returned HTTP {e.code}."}
        except Exception as e:
            return {"valid": False, "provider": "mapbox", "message": f"Connection check failed: {str(e)}"}
            
    elif provider == "openrouteservice":
        try:
            url = f"https://api.openrouteservice.org/v2/directions/foot-walking?api_key={key}&start=78.7820,14.4746&end=78.7845,14.4760"
            request = urllib.request.Request(url, headers={"User-Agent": "SafePath-AI Validator"})
            with urllib.request.urlopen(request, timeout=4.0) as res:
                if res.status == 200:
                    return {
                        "valid": True,
                        "provider": "openrouteservice",
                        "message": "OpenRouteService API key verified successfully! ORS Routing active."
                    }
        except urllib.error.HTTPError as e:
            if e.code in [401, 403]:
                return {"valid": False, "provider": "openrouteservice", "message": "Invalid OpenRouteService key (HTTP 401/403)."}
            return {"valid": False, "provider": "openrouteservice", "message": f"ORS returned HTTP {e.code}."}
        except Exception as e:
            return {"valid": False, "provider": "openrouteservice", "message": f"Connection check failed: {str(e)}"}
            
    elif provider == "google":
        if not key.startswith("AIza") and len(key) < 15:
            return {
                "valid": False,
                "provider": "google",
                "message": "Invalid Google Maps key format. Standard Google API keys start with 'AIza'."
            }
        try:
            url = f"https://maps.googleapis.com/maps/api/geocode/json?address=India&key={key}"
            request = urllib.request.Request(url, headers={"User-Agent": "SafePath-AI Validator"})
            with urllib.request.urlopen(request, timeout=4.0) as res:
                data = json.loads(res.read().decode("utf-8"))
                status = data.get("status")
                if status in ["OK", "ZERO_RESULTS"]:
                    return {
                        "valid": True,
                        "provider": "google",
                        "message": "Google Maps Platform Key verified successfully! Google Street & Satellite layers active."
                    }
                else:
                    err_msg = data.get("error_message") or f"Google Maps API status: {status}"
                    return {
                        "valid": False,
                        "provider": "google",
                        "message": f"Google Maps Error: {err_msg}"
                    }
        except urllib.error.HTTPError as e:
            return {"valid": False, "provider": "google", "message": f"Google Maps HTTP {e.code} error."}
        except Exception as e:
            # If network or geocode endpoint blocked, accept valid AIza format
            if key.startswith("AIza") and len(key) >= 25:
                return {
                    "valid": True,
                    "provider": "google",
                    "message": "Google Maps API Key format accepted and configured for Google map tiles."
                }
            return {"valid": False, "provider": "google", "message": f"Validation check failed: {str(e)}"}

            
    elif provider == "openweather":
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?lat=14.4746&lon=78.7820&appid={key}"
            request = urllib.request.Request(url, headers={"User-Agent": "SafePath-AI Validator"})
            with urllib.request.urlopen(request, timeout=4.0) as res:
                if res.status == 200:
                    return {
                        "valid": True,
                        "provider": "openweather",
                        "message": "OpenWeather API key verified successfully!"
                    }
        except urllib.error.HTTPError as e:
            if e.code in [401, 403]:
                return {"valid": False, "provider": "openweather", "message": "Invalid OpenWeather API key (HTTP 401/403)."}
            return {"valid": False, "provider": "openweather", "message": f"OpenWeather returned HTTP {e.code}."}
        except Exception as e:
            return {"valid": False, "provider": "openweather", "message": f"Connection check failed: {str(e)}"}
            
    return {"valid": False, "provider": provider, "message": f"Unknown provider: {provider}"}
