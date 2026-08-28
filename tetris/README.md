# Tetris Arena

FastAPI와 SQLite로 만든 웹 테트리스 애플리케이션입니다. 이메일 회원가입 후 로그인하면 게임 종료 때마다 점수가 저장되며, 전체 사용자 최고점수가 공개 화면에 표시됩니다.

## 실행

프로젝트 루트에서 Windows CMD 기준:

```cmd
.venv\Scripts\python.exe -m pip install -r requirements.txt
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

브라우저에서 `http://127.0.0.1:8000/game`을 엽니다. 루트 주소 `http://127.0.0.1:8000`에서도 같은 게임 화면을 열 수 있으며, API 문서는 `http://127.0.0.1:8000/docs`에서 확인할 수 있습니다.

## 테스트

```cmd
cd backend
..\.venv\Scripts\python.exe -m pytest -q
```

## 환경 변수

`.env.example`을 참고해 `.env`를 만들 수 있습니다. 운영 환경에서는 반드시 충분히 긴 무작위 `JWT_SECRET`을 사용하고, `CORS_ORIGINS`를 실제 프론트엔드 주소로 제한합니다.

## 주요 API

- `POST /api/auth/register`: 이메일 회원가입
- `POST /api/auth/login`: JWT 로그인
- `GET /api/auth/me`: 현재 사용자 확인
- `POST /api/games/records`: 인증된 게임 기록 저장
- `GET /api/games/records/me`: 현재 사용자의 기록 조회
- `GET /api/scores/highest`: 전체 사용자 최고점수 조회

현재 점수는 클라이언트가 제출하는 값을 저장합니다. 실서비스에서 점수 조작을 방지하려면 서버 권위형 게임 로직 또는 리플레이 검증을 추가해야 합니다.
