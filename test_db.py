import os
import sys
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.supabase_service import upsert_goal, get_goals

# First user from your DB
uid = "d20886f3-e039-4430-b129-015627096f1a"
print("Before:", get_goals(uid))
print("Upserting...")
print("Result:", upsert_goal(uid, 5, "Python Test Goal", ""))
print("After:", get_goals(uid))
