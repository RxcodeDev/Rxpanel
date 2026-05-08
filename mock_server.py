# mock_server.py
from fastapi import FastAPI, Request

app = FastAPI()


@app.get("/content/{section}")
async def get_content(section: str, request: Request):
    print(">>> Headers:", dict(request.headers))
    return {"section": section, "data": f"Contenido de {section}", "items": [1, 2, 3]}


@app.put("/content/{section}")
async def put_content(section: str, body: dict, request: Request):
    print(">>> PUT /content/{section} body:", body)
    return {"section": section, "updated": True, "data": body}


@app.delete("/content/{section}", status_code=204)
async def delete_content(section: str, request: Request):
    print(f">>> DELETE /content/{section}")


@app.get("/colors")
async def get_colors(request: Request):
    print(">>> Headers:", dict(request.headers))
    return {"primary": "#1F5C99", "secondary": "#2E75B6", "accent": "#F0A500", "bg": "#FFFFFF", "text": "#333333"}


@app.put("/colors")
async def put_colors(body: dict, request: Request):
    print(">>> PUT /colors body:", body)
    return {"updated": True, "colors": body}


@app.get("/logos")
async def get_logos(request: Request):
    print(">>> Headers:", dict(request.headers))
    return {"logo_url": "https://misitio.com/logo.png", "favicon_url": "https://misitio.com/favicon.ico"}


@app.put("/logos")
async def put_logos(body: dict, request: Request):
    print(">>> PUT /logos body:", body)
    return {"updated": True, "logos": body}
