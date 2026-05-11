import os
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_first_user():
    """프로토타입용: DB의 첫 번째 유저를 가져옵니다. 없으면 테스트 유저를 생성합니다."""
    if not supabase: return None
    res = supabase.table("users").select("*").limit(1).execute()
    if res.data:
        return res.data[0]
    
    # 유저가 하나도 없으면 테스트 유저 생성
    test_user = {
        "id": str(uuid.uuid4()), # 백엔드에서 명시적 UUID 부여
        "username": "test_user",
        "password": "password123",
        "name": "에고테스터",
        "impulse_score": 50,
        "laziness_score": 50
    }
    try:
        create_res = supabase.table("users").insert(test_user).execute()
        return create_res.data[0] if create_res.data else None
    except Exception as e:
        print("Error creating test user:", e)
        return None

def get_user(user_id: str):
    if not supabase: return None
    res = supabase.table("users").select("*").eq("id", user_id).execute()
    return res.data[0] if res.data else None

def signup_user(username: str, password: str, name: str, impulse_score: int, laziness_score: int):
    if not supabase: return None
    try:
        username_clean = username.strip().lower()
        # Check if exists first for better error handling
        existing = supabase.table("users").select("id").eq("username", username_clean).execute()
        if existing.data:
            return None
            
        new_user = {
            "id": str(uuid.uuid4()), 
            "username": username_clean,
            "password": password.strip(),
            "name": name.strip(),
            "impulse_score": impulse_score,
            "laziness_score": laziness_score
        }
        res = supabase.table("users").insert(new_user).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        print("Signup error:", e)
        return None

def login_user(username: str, password: str):
    if not supabase: return None
    try:
        username_clean = username.strip().lower()
        password_clean = password.strip()
        res = supabase.table("users").select("*").eq("username", username_clean).eq("password", password_clean).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        print("Login error:", e)
        return None

def update_user_score(user_id: str, penalty_points: int = 5):
    """사용자가 목표를 어겼을 때 laziness_score를 증가시킵니다."""
    if not supabase: return None
    try:
        user = get_user(user_id)
        if not user: return None
        new_score = max(0, min(100, user.get("laziness_score", 50) + penalty_points))
        res = supabase.table("users").update({"laziness_score": new_score}).eq("id", user_id).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        print("Error updating user score:", e)
        return None

def get_goals(user_id: str):
    if not supabase: return []
    res = supabase.table("goals").select("*").eq("user_id", user_id).order("goal_number").execute()
    return res.data

def upsert_goal(user_id: str, goal_number: int, title: str, description: str = ""):
    if not supabase: return None
    data = {
        "user_id": user_id,
        "goal_number": goal_number,
        "title": title,
        "description": description,
        "is_active": True
    }
    
    # 1) 먼저 해당 유저의 해당 목표 번호가 이미 있는지 조회합니다.
    existing = supabase.table("goals").select("id").eq("user_id", user_id).eq("goal_number", goal_number).execute()
    
    if existing.data and len(existing.data) > 0:
        # 2) 있으면 업데이트
        res = supabase.table("goals").update(data).eq("user_id", user_id).eq("goal_number", goal_number).execute()
    else:
        # 3) 없으면 새로 삽입
        res = supabase.table("goals").insert(data).execute()
        
    return res.data

def get_or_create_daily_log(user_id: str):
    if not supabase: return {"id": "mock-log-id"}
    
    # 오늘 날짜의 로그 찾기
    from datetime import date
    today = date.today().isoformat()
    
    res = supabase.table("daily_logs").select("*").eq("user_id", user_id).eq("log_date", today).execute()
    if res.data:
        return res.data[0]
    else:
        # 없으면 새로 생성
        new_log = {
            "user_id": user_id,
            "log_date": today,
            "status": "ongoing"
        }
        create_res = supabase.table("daily_logs").insert(new_log).execute()
        return create_res.data[0]

def get_daily_logs(user_id: str):
    if not supabase: return []
    res = supabase.table("daily_logs").select("*").eq("user_id", user_id).order("log_date", desc=True).execute()
    return res.data

def get_daily_log(log_id: str):
    if not supabase: return None
    res = supabase.table("daily_logs").select("*").eq("id", log_id).execute()
    return res.data[0] if res.data else None

def get_log_messages(log_id: str):
    if not supabase: return []
    res = supabase.table("log_messages").select("*").eq("log_id", log_id).order("created_at").execute()
    return res.data

def insert_log_message(log_id: str, role: str, content: str, related_goal_number: int = None):
    if not supabase: return None
    data = {
        "log_id": log_id,
        "role": role,
        "content": content
    }
    if related_goal_number is not None:
        data["related_goal_number"] = related_goal_number
        
    res = supabase.table("log_messages").insert(data).execute()
    return res.data[0] if res.data else None

def get_user_prompt(user_id: str):
    if not supabase: return "너는 사용자의 10대 목표를 근거로 독설을 퍼붓는 에고고야. 나태해진 사용자에게 팩트 폭격을 날려."
    
    # 1. 사용자 전용 프롬프트 찾기
    try:
        user_res = supabase.table("ai_prompts").select("system_prompt").eq("user_id", user_id).eq("is_active", True).execute()
        if user_res.data:
            return user_res.data[0]["system_prompt"]
    except Exception as e:
        print("Error fetching user prompt, checking global fallback:", e)

    # 2. 없으면 전역(기본) 프롬프트 찾기 (user_id가 null인 경우로 가정하거나 단순히 첫 번째 active)
    try:
        global_res = supabase.table("ai_prompts").select("system_prompt").eq("is_active", True).execute()
        if global_res.data:
            return global_res.data[0]["system_prompt"]
    except:
        pass
        
    return "너는 사용자의 10대 목표를 근거로 독설을 퍼붓는 에고고야. 나태해진 사용자에게 팩트 폭격을 날려."

def upsert_user_prompt(user_id: str, persona_name: str, system_prompt: str):
    if not supabase: return None
    data = {
        "user_id": user_id,
        "persona_name": persona_name,
        "system_prompt": system_prompt,
        "is_active": True
    }
    
    try:
        # 기존 프롬프트가 있는지 확인
        existing = supabase.table("ai_prompts").select("id").eq("user_id", user_id).execute()
        if existing.data:
            # 업데이트
            res = supabase.table("ai_prompts").update(data).eq("id", existing.data[0]["id"]).execute()
        else:
            # 새로 생성
            res = supabase.table("ai_prompts").insert(data).execute()
        return res.data
    except Exception as e:
        print("Error saving user prompt:", e)
        return None
