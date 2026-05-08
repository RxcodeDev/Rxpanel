# app/services/proxy_client.py
import httpx
from fastapi import HTTPException
from app.core.encryption import decrypt


def build_headers(api_token: str) -> dict:
    """Construye headers con Authorization Bearer a partir del token en claro."""
    return {
        "Authorization": f"Bearer {api_token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def _get_headers(encrypted_token: str | None) -> dict:
    """Helper interno: desencripta y construye headers."""
    if encrypted_token:
        raw_token = decrypt(encrypted_token)
        return build_headers(raw_token)
    return {}


async def _handle_errors(coro):
    """Ejecuta una corrutina httpx y mapea errores a HTTPException."""
    try:
        response = await coro
        response.raise_for_status()
        return response
    except httpx.ConnectTimeout:
        raise HTTPException(status_code=504, detail="El sitio externo no respondió a tiempo (timeout 10s)")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Error del sitio externo: {e.response.text}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"No se pudo conectar al sitio externo: {str(e)}")


async def proxy_get(url: str, encrypted_token: str | None, timeout: float = 10.0) -> dict:
    headers = _get_headers(encrypted_token)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await _handle_errors(client.get(url, headers=headers))
        return response.json()


async def proxy_put(url: str, encrypted_token: str | None, body: dict, timeout: float = 10.0) -> dict:
    headers = _get_headers(encrypted_token)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await _handle_errors(client.put(url, headers=headers, json=body))
        return response.json()


async def proxy_delete(url: str, encrypted_token: str | None, timeout: float = 10.0) -> None:
    headers = _get_headers(encrypted_token)
    async with httpx.AsyncClient(timeout=timeout) as client:
        await _handle_errors(client.delete(url, headers=headers))
