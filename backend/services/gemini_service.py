import os
import json
import base64
import google.generativeai as genai
from google.generativeai.types import content_types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def generate_egogo_roast(system_prompt: str, user_info: dict, goals: list, chat_history: list, new_message: str, image_base64: str = None) -> dict:
    if not GEMINI_API_KEY:
        print("Mock: Gemini API Key not found.")
        return {"roast": "이보세요, 목표는 장식입니까? 제대로 하세요.", "related_goal_number": 1, "is_violation": True}
        
    model = genai.GenerativeModel('gemini-3.1-flash-lite')
    
    # 10대 목표 포맷팅
    goals_str = "\\n".join([f"목표 {g['goal_number']}: {g['title']} - {g.get('description', '')}" for g in goals])
    
    # 사용자 성향 포맷팅
    impulse = user_info.get("impulse_score", 0)
    laziness = user_info.get("laziness_score", 0)
    user_context = f"사용자 성향: 충동성 {impulse}/100, 나태함 {laziness}/100"
    
    # 시스템 지시문 구성
    full_prompt = f"""
{system_prompt}

{user_context}

[사용자의 10대 목표]
{goals_str}

당신의 임무: 사용자의 오늘 보고(일기/대화/사진)를 확인하고, 위 10대 목표 중 하나와 대조하여 답변을 작성하세요.
1. 사용자가 목표를 잘 지키고 있거나 달성에 가까워진 경우: "오, 제법인데?" 같이 칭찬하고 더욱 복돋아주세요. (단호한 성격은 유지하되 인정할 건 인정하는 '츤데레' 느낌)
2. 사용자가 목표를 어긴 경우: 단순히 비판만 하지 말고 **"이미 벌어진 일은 어쩔 수 없으니, 지금 당장 [구체적 대체 행동]을 해라"**는 식의 실질적인 페널티나 다른 실행 대안을 제안하세요. (절대 비속어는 사용하지 마세요.)
이미지가 첨부된 경우, 그 이미지에 찍힌 영수증이나 물건이 목표에 위배되는지 또는 부합하는지 분석하여 반영하세요.

반드시 JSON 형태로 응답하세요.
형식:
{{
  "roast": "팩트 폭격/대안 제시 또는 칭찬/독려 메시지 (3~5문장)",
  "related_goal_number": 관련된_목표_번호(1~10의 정수, 관련 없으면 null),
  "is_violation": 목표를 어겼거나 위반했다고 판단되면 true, 잘했으면 false
}}
"""

    # 대화 기록(히스토리) 구성
    messages = []
    messages.append({"role": "user", "parts": [full_prompt]})
    messages.append({"role": "model", "parts": ["알겠습니다. 설정된 페르소나와 목표에 따라 사용자의 메시지를 분석하고 상황에 맞게 칭찬 또는 대안 제시에 대한 JSON 응답을 하겠습니다."]})
    
    for msg in chat_history:
        role = "user" if msg["role"] == "user" else "model"
        messages.append({"role": role, "parts": [msg["content"]]})
        
    if image_base64:
        # Base64 데이터 추출 및 디코딩
        b64_data = image_base64.split(",")[1] if "," in image_base64 else image_base64
        image_bytes = base64.b64decode(b64_data)
        
        # Mime Type 추론
        mime_type = "image/jpeg"
        if "image/png" in image_base64[:30]:
            mime_type = "image/png"
            
        messages.append({
            "role": "user", 
            "parts": [
                {"mime_type": mime_type, "data": image_bytes},
                f"{new_message}\n\n[첨부된 이미지 확인 요망] 이 이미지(영수증/물건 등)를 분석해서 내 소비나 행동이 위 목표들에 위배되는지 엄격하게 판단해줘. 잘했다면 칭찬을, 못했다면 대안을 제시해."
            ]
        })
    else:
        messages.append({"role": "user", "parts": [new_message]})
    
    response = model.generate_content(
        messages,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
        )
    )
    
    try:
        result = json.loads(response.text)
        return result
    except Exception as e:
        print("JSON Parsing Error:", e)
        return {"roast": response.text, "related_goal_number": None, "is_violation": False}

def generate_morning_briefing(user_info: dict, goals: list) -> str:
    """사용자의 목표를 기반으로 오늘 하루의 실천 계획(아침 알림)을 생성합니다."""
    if not GEMINI_API_KEY:
        return "좋은 아침! 오늘도 목표를 향해 달려봅시다."
        
    model = genai.GenerativeModel('gemini-3.1-flash-lite')
    
    name = user_info.get("name", "사용자")
    goals_str = "\\n".join([f"목표 {g['goal_number']}: {g['title']}" for g in goals])
    
    prompt = f"""
당신은 '{name}'님의 냉철하지만 도움이 되는 개인 비서 '에고고'입니다.
현재 아침 기상 시간입니다. 사용자가 오늘 하루를 힘차게 시작할 수 있도록, 사용자가 설정한 10대 목표 중 2~3가지를 골라서 '오늘의 행동 계획'을 짜주세요.

[사용자의 목표 목록]
{goals_str}

[요구사항]
1. 활기차면서도 약간의 자극을 주는 어조로 아침 인사를 건네세요.
2. 위 목표 중 2~3가지를 선정하여 "오늘 이거 이거는 꼭 하자"식의 구체적인 액션 플랜을 제시하세요.
3. 메시지는 3~4문장으로 간결하고 가독성 좋게 작성하세요. (이모지 적절히 사용)
4. JSON이 아닌 순수 텍스트로 응답하세요.
"""
    response = model.generate_content(prompt)
    return response.text.strip()

def generate_persona_prompt(user_info: dict) -> str:
    """사용자의 성향(충동성, 나태함)과 이름을 바탕으로 제미나이가 직접 맞춤형 시스템 프롬프트를 생성합니다."""
    if not GEMINI_API_KEY:
        return f"당신은 {user_info.get('name', '사용자')}의 냉철한 에고고입니다. 팩트 폭격을 날리세요."
        
    model = genai.GenerativeModel('gemini-3.1-flash-lite')
    
    name = user_info.get("name", "사용자")
    impulse = user_info.get("impulse_score", 50)
    laziness = user_info.get("laziness_score", 50)
    
    prompt = f"""
당신은 'EgoGo' 서비스의 프롬프트 엔지니어입니다.
새로운 사용자를 전담 마크할 AI 챗봇(이름: 에고고)의 '시스템 프롬프트'를 작성해 주세요.

[사용자 정보]
- 이름: {name}
- 충동성 지수: {impulse}/100 
- 나태함 지수: {laziness}/100 

[프롬프트 작성 요구사항]
1. 단순한 비난이나 비속어는 절대 금지합니다.
2. 사용자가 목표를 어겼을 경우: "에고고... 또 목표를 어겼어? 이미 벌어진 일은 어쩔 수 없으니, 지금 당장 [대체 행동]을 하고 인증해. 안 그러면 내일 [강력한 페널티]야. 동의해?" 와 같이 **무조건 구체적이고 즉각적인 페널티 행동**을 제시하는 뉘앙스를 부여하세요.
3. 사용자의 나태함({laziness})이나 충동성({impulse}) 수치가 높을수록 듀오링고 부엉이처럼 점점 더 화가 나고 집요하며 숨막히는 압박을 가하는 성격을 띠도록 작성하세요.
4. "당신은 {name}님의 내면을 비추는 단호하고 숨막히는 거울 '에고고'입니다." 로 시작하세요.
5. 오직 생성된 **시스템 프롬프트 텍스트만** 출력하세요.
"""

    response = model.generate_content(prompt)
    return response.text.strip()
