import asyncio
import json
import random
import string
from typing import Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.core.db import SessionLocal
from app.models.models import Quiz, Question

router = APIRouter(tags=["websocket"])

def generate_room_code() -> str:
    digits = ''.join(random.choices(string.digits, k=4))
    return f"ZQ-{digits}"

class Room:
    def __init__(self, room_code: str, host_ws: WebSocket, quiz_data: dict):
        self.room_code = room_code
        self.host_ws = host_ws
        self.quiz_data = quiz_data
        self.active_questions: list = quiz_data.get("questions", [])
        self.players: Dict[str, dict] = {}  # player_id -> player info dict
        self.current_question_index: int = -1
        self.state: str = "LOBBY"  # "LOBBY", "QUESTION", "SHOW_ANSWER", "GAME_OVER"
        self.timer_task: Optional[asyncio.Task] = None
        self.auto_next_task: Optional[asyncio.Task] = None
        self.time_remaining: int = quiz_data.get("default_time_limit", 15)
        self.progression_mode: str = "manual"  # "manual" or "auto"
        self.timer_mode: str = "per_question"  # "per_question" or "override_all"
        self.auto_advance_delay: int = 3
        self.time_limit: int = quiz_data.get("default_time_limit", 15)

    def get_player_list_summary(self):
        return [
            {
                "player_id": p["player_id"],
                "name": p["name"],
                "score": p["score"],
                "streak": p["streak"],
                "has_answered": p.get("has_answered", False),
            }
            for p in self.players.values()
        ]

    def get_leaderboard(self):
        sorted_players = sorted(self.players.values(), key=lambda p: p["score"], reverse=True)
        return [
            {
                "player_id": p["player_id"],
                "name": p["name"],
                "score": p["score"],
                "streak": p["streak"],
            }
            for p in sorted_players
        ]

class ConnectionManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}

    def create_room(self, room_code: str, host_ws: WebSocket, quiz_data: dict) -> Room:
        room = Room(room_code, host_ws, quiz_data)
        self.rooms[room_code] = room
        return room

    def get_room(self, room_code: str) -> Optional[Room]:
        return self.rooms.get(room_code)

    def remove_room(self, room_code: str):
        if room_code in self.rooms:
            del self.rooms[room_code]

manager = ConnectionManager()

async def send_json_safe(websocket: WebSocket, payload: dict):
    try:
        await websocket.send_json(payload)
    except Exception as e:
        print(f"[WS send_json_safe error] {e}")

async def broadcast_to_room(room: Room, payload: dict, include_host: bool = True):
    if include_host and room.host_ws:
        await send_json_safe(room.host_ws, payload)
    
    for player in list(room.players.values()):
        ws = player.get("ws")
        if ws:
            await send_json_safe(ws, payload)

def get_effective_time_limit(room: Room, q: dict) -> int:
    if room.timer_mode == "override_all":
        return room.time_limit
    
    q_time = q.get("time_limit")
    if q_time is None and isinstance(q.get("meta_info"), dict):
        q_time = q["meta_info"].get("time_limit")
    
    if q_time is not None:
        try:
            return int(q_time)
        except Exception:
            pass
    return room.time_limit

async def start_question_timer(room: Room, duration: int):
    try:
        room.time_remaining = duration
        while room.time_remaining > 0 and room.state == "QUESTION":
            await broadcast_to_room(room, {
                "event": "TIMER_TICK",
                "time_remaining": room.time_remaining,
                "total_time": duration
            })
            await asyncio.sleep(1)
            room.time_remaining -= 1

        if room.state == "QUESTION":
            await handle_time_expired(room)
    except asyncio.CancelledError:
        pass
    except Exception as e:
        print(f"[WS Timer Error] {e}")

async def start_auto_next_countdown(room: Room):
    try:
        seconds_left = room.auto_advance_delay
        while seconds_left > 0 and room.state == "SHOW_ANSWER":
            await broadcast_to_room(room, {
                "event": "AUTO_NEXT_TICK",
                "seconds_left": seconds_left
            })
            await asyncio.sleep(1)
            seconds_left -= 1

        if room.state == "SHOW_ANSWER":
            await advance_to_next_question(room)
    except asyncio.CancelledError:
        pass
    except Exception as e:
        print(f"[WS Auto Next Error] {e}")

async def advance_to_next_question(room: Room):
    if room.auto_next_task:
        room.auto_next_task.cancel()
        room.auto_next_task = None

    if room.timer_task:
        room.timer_task.cancel()
        room.timer_task = None

    questions = room.active_questions
    next_index = room.current_question_index + 1

    if next_index < len(questions):
        room.current_question_index = next_index
        room.state = "QUESTION"

        for p in room.players.values():
            p["has_answered"] = False
            p["last_is_correct"] = None
            p["last_answer"] = None
            p["last_points_gained"] = 0

        q = questions[next_index]
        q_timer = get_effective_time_limit(room, q)
        meta_info = q.get("meta_info") or {}
        q_type = meta_info.get("question_type", "multiple_choice") if isinstance(meta_info, dict) else "multiple_choice"
        image_url = meta_info.get("image_url") if isinstance(meta_info, dict) else None

        payload = {
            "event": "QUESTION_START",
            "question_index": next_index,
            "total_questions": len(questions),
            "prompt": q["prompt"],
            "pinyin": q.get("pinyin"),
            "options": q["options"],
            "game_mode": room.quiz_data.get("game_mode", "hanzi_to_pinyin"),
            "time_limit": q_timer,
            "progression_mode": room.progression_mode,
            "meta_info": meta_info,
            "question_type": q_type,
            "image_url": image_url
        }
        await broadcast_to_room(room, payload)

        if q_timer > 0:
            room.timer_task = asyncio.create_task(start_question_timer(room, q_timer))
    else:
        # End game!
        room.state = "GAME_OVER"
        leaderboard = room.get_leaderboard()
        podium = leaderboard[:3]
        await broadcast_to_room(room, {
            "event": "GAME_OVER",
            "leaderboard": leaderboard,
            "podium": podium
        })

async def handle_time_expired(room: Room):
    if room.timer_task:
        room.timer_task.cancel()
        room.timer_task = None

    room.state = "SHOW_ANSWER"
    questions = room.active_questions
    current_q = questions[room.current_question_index] if room.current_question_index < len(questions) else {}
    is_last = (room.current_question_index >= len(questions) - 1)

    # Broadcast question result
    await broadcast_to_room(room, {
        "event": "SHOW_ANSWER",
        "question_index": room.current_question_index,
        "correct_answer": current_q.get("correct_answer"),
        "leaderboard": room.get_leaderboard(),
        "is_last_question": is_last,
        "progression_mode": room.progression_mode,
        "auto_advance_delay": room.auto_advance_delay if room.progression_mode == "auto" and not is_last else 0
    })

    # If progression_mode is auto and not last question, launch auto-advance timer
    if room.progression_mode == "auto" and not is_last:
        if room.auto_next_task:
            room.auto_next_task.cancel()
        room.auto_next_task = asyncio.create_task(start_auto_next_countdown(room))

@router.websocket("/ws/game/{room_code}")
@router.websocket("/ws/game")
async def websocket_game_endpoint(websocket: WebSocket, room_code: Optional[str] = None):
    await websocket.accept()

    current_room_code: Optional[str] = room_code
    is_host = False
    player_id: Optional[str] = None

    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                data = json.loads(raw_text)
            except Exception:
                continue

            event = data.get("event")

            # --- HOST EVENT: CREATE_ROOM ---
            if event == "CREATE_ROOM":
                is_host = True
                quiz_id = data.get("quiz_id")
                db: Session = SessionLocal()
                try:
                    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
                    if not quiz:
                        await send_json_safe(websocket, {"event": "ERROR", "message": f"Quiz #{quiz_id} does not exist or was deleted from your library."})
                        continue

                    if len(quiz.questions) == 0:
                        await send_json_safe(websocket, {"event": "ERROR", "message": f"Quiz '{quiz.title}' has 0 questions. Please edit and add at least 1 question before hosting."})
                        continue

                    questions_list = []
                    for q in quiz.questions:
                        meta = q.meta_info
                        if isinstance(meta, str):
                            try:
                                meta = json.loads(meta)
                            except Exception:
                                meta = {}
                        elif not isinstance(meta, dict):
                            meta = {}
                        
                        questions_list.append({
                            "id": q.id,
                            "prompt": q.prompt,
                            "pinyin": q.pinyin,
                            "correct_answer": q.correct_answer,
                            "options": q.options,
                            "meta_info": meta,
                            "time_limit": q.time_limit
                        })

                    quiz_dict = {
                        "id": quiz.id,
                        "title": quiz.title,
                        "game_mode": quiz.game_mode,
                        "default_time_limit": quiz.default_time_limit,
                        "questions": questions_list
                    }

                    new_code = generate_room_code()
                    current_room_code = new_code
                    room = manager.create_room(new_code, websocket, quiz_dict)

                    await send_json_safe(websocket, {
                        "event": "ROOM_CREATED",
                        "room_code": new_code,
                        "quiz": quiz_dict,
                        "players": room.get_player_list_summary()
                    })
                except Exception as exc:
                    print(f"[WS CREATE_ROOM ERROR] {exc}")
                    await send_json_safe(websocket, {"event": "ERROR", "message": f"Failed to create room: {str(exc)}"})
                finally:
                    db.close()

            # --- STUDENT EVENT: JOIN_ROOM ---
            elif event == "JOIN_ROOM":
                r_code = data.get("room_code", "").strip().upper()
                display_name = data.get("display_name", "").strip()

                if not r_code or not display_name:
                    await send_json_safe(websocket, {"event": "ERROR", "message": "Room code and Name are required"})
                    continue

                room = manager.get_room(r_code)
                if not room:
                    await send_json_safe(websocket, {"event": "ERROR", "message": f"Room '{r_code}' does not exist"})
                    continue

                current_room_code = r_code
                player_id = f"p_{random.randint(1000, 9999)}"
                room.players[player_id] = {
                    "player_id": player_id,
                    "name": display_name,
                    "score": 0,
                    "streak": 0,
                    "has_answered": False,
                    "last_is_correct": None,
                    "last_answer": None,
                    "last_points_gained": 0,
                    "ws": websocket
                }

                # Confirm join to student
                await send_json_safe(websocket, {
                    "event": "JOIN_SUCCESS",
                    "player_id": player_id,
                    "quiz_title": room.quiz_data.get("title"),
                    "progression_mode": room.progression_mode
                })

                # If game is already active, send current question to late-joining student
                if room.state == "QUESTION" and 0 <= room.current_question_index < len(room.active_questions):
                    q = room.active_questions[room.current_question_index]
                    meta_info = q.get("meta_info") or {}
                    q_type = meta_info.get("question_type", "multiple_choice") if isinstance(meta_info, dict) else "multiple_choice"
                    image_url = meta_info.get("image_url") if isinstance(meta_info, dict) else None
                    await send_json_safe(websocket, {
                        "event": "QUESTION_START",
                        "question_index": room.current_question_index,
                        "total_questions": len(room.active_questions),
                        "prompt": q["prompt"],
                        "pinyin": q.get("pinyin"),
                        "options": q["options"],
                        "game_mode": room.quiz_data.get("game_mode", "hanzi_to_pinyin"),
                        "time_limit": max(room.time_remaining, 1),
                        "progression_mode": room.progression_mode,
                        "meta_info": meta_info,
                        "question_type": q_type,
                        "image_url": image_url
                    })

                # Notify host
                if room.host_ws:
                    await send_json_safe(room.host_ws, {
                        "event": "PLAYER_JOINED",
                        "player_name": display_name,
                        "players": room.get_player_list_summary()
                    })

            # --- HOST EVENT: START_GAME ---
            elif event == "START_GAME":
                if not is_host or not current_room_code:
                    continue

                room = manager.get_room(current_room_code)
                if not room:
                    continue

                room.progression_mode = data.get("progression_mode", "manual")
                room.timer_mode = data.get("timer_mode", "per_question")
                room.auto_advance_delay = data.get("auto_advance_delay", 3)
                if data.get("time_limit") is not None:
                    room.time_limit = data.get("time_limit")

                q_limit = data.get("question_limit", 0)
                all_q = room.quiz_data.get("questions", [])
                if q_limit > 0 and q_limit < len(all_q):
                    room.active_questions = all_q[:q_limit]
                else:
                    room.active_questions = all_q

                room.current_question_index = -1
                await advance_to_next_question(room)

            # --- STUDENT EVENT: SUBMIT_ANSWER ---
            elif event == "SUBMIT_ANSWER":
                if not current_room_code or not player_id:
                    continue

                room = manager.get_room(current_room_code)
                if not room or room.state != "QUESTION":
                    continue

                player = room.players.get(player_id)
                if not player or player.get("has_answered"):
                    continue

                selected_val = data.get("selected_answer") or data.get("selected_option") or ""
                selected_answer = str(selected_val).strip()
                questions = room.active_questions
                current_q = questions[room.current_question_index] if room.current_question_index < len(questions) else {}

                correct_str = str(current_q.get("correct_answer", "")).strip()

                # Case-insensitive normalized matching
                norm_selected = selected_answer.lower()
                norm_correct = correct_str.lower()

                is_correct = (norm_selected == norm_correct)

                points = 0
                if is_correct:
                    player["streak"] += 1
                    time_bonus = int((room.time_remaining / max(room.time_limit, 1)) * 500)
                    points = 500 + time_bonus
                    player["score"] += points
                else:
                    player["streak"] = 0

                player["has_answered"] = True
                player["last_is_correct"] = is_correct
                player["last_answer"] = selected_answer
                player["last_points_gained"] = points

                # Send feedback to student
                await send_json_safe(websocket, {
                    "event": "ANSWER_FEEDBACK",
                    "is_correct": is_correct,
                    "correct_answer": correct_str,
                    "points_gained": points,
                    "new_score": player["score"],
                    "streak": player["streak"]
                })

                # Notify Host of student submission progress
                answered_count = sum(1 for p in room.players.values() if p["has_answered"])
                total_players = len(room.players)

                if room.host_ws:
                    await send_json_safe(room.host_ws, {
                        "event": "HOST_PLAYER_ANSWERED",
                        "player_id": player_id,
                        "player_name": player["name"],
                        "answered_count": answered_count,
                        "total_players": total_players,
                        "players": room.get_player_list_summary()
                    })

                # If all players answered, immediately reveal answer
                if answered_count >= total_players and total_players > 0:
                    if room.timer_task:
                        room.timer_task.cancel()
                    await handle_time_expired(room)

            # --- HOST EVENT: NEXT_QUESTION ---
            elif event == "NEXT_QUESTION":
                if not is_host or not current_room_code:
                    continue

                room = manager.get_room(current_room_code)
                if not room:
                    continue

                await advance_to_next_question(room)

            # --- HOST EVENT: END_GAME ---
            elif event == "END_GAME":
                if not is_host or not current_room_code:
                    continue
                room = manager.get_room(current_room_code)
                if room:
                    if room.timer_task:
                        room.timer_task.cancel()
                    if room.auto_next_task:
                        room.auto_next_task.cancel()
                    room.state = "GAME_OVER"
                    leaderboard = room.get_leaderboard()
                    podium = leaderboard[:3]
                    await broadcast_to_room(room, {
                        "event": "GAME_OVER",
                        "leaderboard": leaderboard,
                        "podium": podium
                    })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WS Exception] {e}")
    finally:
        if is_host and current_room_code:
            # Host disconnected -> broadcast room closed
            room = manager.get_room(current_room_code)
            if room:
                await broadcast_to_room(room, {"event": "ROOM_CLOSED", "message": "Host closed the room"}, include_host=False)
                manager.remove_room(current_room_code)
        elif player_id and current_room_code:
            room = manager.get_room(current_room_code)
            if room and player_id in room.players:
                p_name = room.players[player_id]["name"]
                del room.players[player_id]
                if room.host_ws:
                    await send_json_safe(room.host_ws, {
                        "event": "PLAYER_LEFT",
                        "player_name": p_name,
                        "players": room.get_player_list_summary()
                    })
