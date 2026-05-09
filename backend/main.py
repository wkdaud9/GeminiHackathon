from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import router

app = FastAPI(title="Ego-Mirror API", version="1.0.0")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to Ego-Mirror API"}
