from fastapi import Depends, FastAPI
from .security import require_service_key
from .schemas import ForecastRequest, PromotionInput, ChatRequest, RecipeRequest, ComplaintRequest
from .promotions import recommend
from .knowledge import answer
from .recipes import suggest
from .complaints import classify

app = FastAPI(title="GreenPlus AI Assist", version="1.0.0", docs_url=None, redoc_url=None, openapi_url=None)

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

@app.post("/v1/forecast", dependencies=[Depends(require_service_key)])
def forecast_endpoint(body: ForecastRequest):
    # Import numpy / sklearn only for forecasting, not for HTTP readiness.
    from .forecast import forecast
    return forecast(body)

@app.post("/v1/promotion", dependencies=[Depends(require_service_key)])
def promotion_endpoint(body: PromotionInput):
    return recommend(body)

@app.post("/v1/chat", dependencies=[Depends(require_service_key)])
async def chat_endpoint(body: ChatRequest):
    return await answer(body)

@app.post("/v1/recipes", dependencies=[Depends(require_service_key)])
def recipe_endpoint(body: RecipeRequest):
    return suggest(body)

@app.post("/v1/complaints", dependencies=[Depends(require_service_key)])
def complaint_endpoint(body: ComplaintRequest):
    return classify(body)
