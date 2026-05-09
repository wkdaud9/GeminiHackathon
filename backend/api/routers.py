from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from services.gemini_service import generate_egogo_roast, generate_persona_prompt, generate_morning_briefing
from services.supabase_service import (
    get_first_user, get_user, get_goals, upsert_goal, 
    get_or_create_daily_log, get_daily_log, get_daily_logs, get_log_messages, insert_log_message, get_user_prompt, upsert_user_prompt,
    signup_user, login_user, update_user_score
)

router = APIRouter()

# --- Pydantic Models ---
class AuthRequest(BaseModel):
    username: str
    password: str
    name: Optional[str] = None
    impulse_score: Optional[int] = 50
    laziness_score: Optional[int] = 50

class PromptRequest(BaseModel):
    user_id: Optional[str] = None
    persona_name: str
    system_prompt: str

class GoalRequest(BaseModel):
    user_id: Optional[str] = None
    goal_number: int
    title: str
    description: Optional[str] = ""

class ChatRequest(BaseModel):
    user_id: Optional[str] = None
    message: str
    image_base64: Optional[str] = None
    log_id: Optional[str] = None
    goal_number: Optional[int] = None

def _resolve_user_id(user_id: Optional[str]):
    """Auth가 미완성인 경우를 대비해 user_id가 없으면 첫 번째 유저를 반환합니다."""
    if user_id:
        return user_id
    user = get_first_user()
    if not user:
        raise HTTPException(status_code=404, detail="No users found in database.")
    return user["id"]

# --- Endpoints ---

@router.post("/signup")
async def signup(req: AuthRequest):
    try:
        user = signup_user(
            username=req.username,
            password=req.password,
            name=req.name or req.username,
            impulse_score=req.impulse_score,
            laziness_score=req.laziness_score
        )
        if not user:
            raise HTTPException(status_code=400, detail="Username already exists or creation failed.")
        
        # 회원가입 성공 시 AI에게 맞춤형 프롬프트를 생성하도록 요청
        custom_prompt = generate_persona_prompt({
            "name": user["name"],
            "impulse_score": user["impulse_score"],
            "laziness_score": user["laziness_score"]
        })
        
        # 생성된 프롬프트를 DB에 저장
        upsert_user_prompt(
            user_id=user["id"], 
            persona_name=f"{user['name']} 전용 에고고", 
            system_prompt=custom_prompt
        )

        return {"status": "success", "data": user}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login(req: AuthRequest):
    try:
        user = login_user(username=req.username, password=req.password)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password.")
        return {"status": "success", "data": user}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user")
async def fetch_user(user_id: Optional[str] = None):
    try:
        uid = _resolve_user_id(user_id)
        user = get_user(uid)
        return {"status": "success", "data": user}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/goals")
async def fetch_goals(user_id: Optional[str] = None):
    try:
        uid = _resolve_user_id(user_id)
        goals = get_goals(uid)
        return {"status": "success", "data": goals}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/goals")
async def save_goal(req: GoalRequest):
    try:
        uid = _resolve_user_id(req.user_id)
        if req.goal_number < 1 or req.goal_number > 10:
            raise HTTPException(status_code=400, detail="Goal number must be between 1 and 10.")
        
        result = upsert_goal(uid, req.goal_number, req.title, req.description)
        return {"status": "success", "message": "Goal saved successfully", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prompt")
async def fetch_prompt(user_id: Optional[str] = None):
    try:
        uid = _resolve_user_id(user_id)
        prompt = get_user_prompt(uid)
        return {"status": "success", "data": {"system_prompt": prompt}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/prompt")
async def save_prompt(req: PromptRequest):
    try:
        uid = _resolve_user_id(req.user_id)
        res = upsert_user_prompt(uid, req.persona_name, req.system_prompt)
        return {"status": "success", "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/morning")
async def get_morning_briefing(req: ChatRequest):
    try:
        uid = _resolve_user_id(req.user_id)
        user_info = get_user(uid)
        goals = get_goals(uid)
        
        # 1. 데일리 로그 가져오기 (없으면 생성)
        daily_log = get_daily_log(req.log_id) if req.log_id else get_or_create_daily_log(uid)
        if not daily_log:
            raise HTTPException(status_code=404, detail="Chat log not found.")
        log_id = daily_log["id"]
        
        # 2. 아침 브리핑 텍스트 생성
        briefing_text = generate_morning_briefing(user_info, goals)
        
        # 3. Egogo 메시지 DB 저장
        assistant_msg = insert_log_message(log_id, "assistant", briefing_text, None)
        
        return {
            "status": "success",
            "data": {
                "roast": briefing_text,
                "log_id": log_id,
                "assistant_message_id": assistant_msg["id"] if assistant_msg else None
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat_with_egogo(req: ChatRequest):
    try:
        uid = _resolve_user_id(req.user_id)
        user_info = get_user(uid)
        goals = get_goals(uid)
        
        # 1. 데일리 로그 가져오기 (없으면 생성)
        daily_log = get_daily_log(req.log_id) if req.log_id else get_or_create_daily_log(uid)
        if not daily_log:
            raise HTTPException(status_code=404, detail="Chat log not found.")
        log_id = daily_log["id"]
        
        # 2. 유저 메시지 DB 저장 (이미지가 있으면 내용에 [사진 첨부] 텍스트 추가)
        msg_content = req.message
        if req.image_base64:
            msg_content = f"[사진 첨부됨] {req.message}"
        insert_log_message(log_id, "user", msg_content, req.goal_number)
        
        # 3. 과거 대화 내역 가져오기 (오늘 하루치)
        chat_history = get_log_messages(log_id)
        
        # 4. 프롬프트 세팅 (유저별 커스텀 프롬프트)
        system_prompt = get_user_prompt(uid)
        
        # 5. Gemini API 호출하여 팩폭 생성
        egogo_response = generate_egogo_roast(
            system_prompt=system_prompt,
            user_info=user_info,
            goals=goals,
            chat_history=chat_history[:-1], # 마지막 방금 넣은 유저 메시지 제외
            new_message=(
                f"[목표 {req.goal_number} 심층 대화] {req.message}"
                if req.goal_number else req.message
            ),
            image_base64=req.image_base64
        )
        
        roast_text = egogo_response.get("roast", "오류가 발생했습니다.")
        related_goal = egogo_response.get("related_goal_number") or req.goal_number
        is_violation = egogo_response.get("is_violation", False)
        
        # 6. 실패 부채 (Ego-Debt) 적용 및 페르소나 진화
        current_laziness = user_info.get("laziness_score", 50)
        if is_violation:
            updated_user = update_user_score(uid, penalty_points=5)
            if updated_user:
                current_laziness = updated_user.get("laziness_score", 50)
                # 점수가 올라갔으므로 페르소나 프롬프트 재생성 (더 독해짐)
                new_prompt = generate_persona_prompt(updated_user)
                upsert_user_prompt(uid, f"{updated_user['name']} 전용 에고고", new_prompt)
        
        # 7. Egogo 메시지 DB 저장
        assistant_msg = insert_log_message(log_id, "assistant", roast_text, related_goal)
        
        return {
            "status": "success",
            "data": {
                "roast": roast_text,
                "related_goal_number": related_goal,
                "is_violation": is_violation,
                "laziness_score": current_laziness,
                "log_id": log_id,
                "assistant_message_id": assistant_msg["id"] if assistant_msg else None
            }
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/history")
async def fetch_chat_history(user_id: Optional[str] = None):
    try:
        uid = _resolve_user_id(user_id)
        logs = get_daily_logs(uid)
        if not logs:
            logs = [get_or_create_daily_log(uid)]
        messages = []
        for log in logs:
            for msg in get_log_messages(log["id"]):
                msg["log_id"] = log["id"]
                msg["log_date"] = log.get("log_date")
                messages.append(msg)
        return {"status": "success", "data": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/logs/{log_id}/messages")
async def fetch_log_messages(log_id: str, user_id: Optional[str] = None):
    try:
        _resolve_user_id(user_id)
        log = get_daily_log(log_id)
        if not log:
            raise HTTPException(status_code=404, detail="Chat log not found.")
        messages = get_log_messages(log_id)
        for msg in messages:
            msg["log_id"] = log_id
            msg["log_date"] = log.get("log_date")
        return {"status": "success", "data": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
