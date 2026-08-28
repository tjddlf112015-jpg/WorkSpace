def register_and_login(client, email="player@example.com"):
    register_response = client.post(
        "/api/auth/register",
        json={"email": email, "password": "strong-pass-123"},
    )
    assert register_response.status_code == 201
    login_response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "strong-pass-123"},
    )
    assert login_response.status_code == 200
    return login_response.json()["access_token"]


def test_register_login_and_protected_me(client):
    token = register_and_login(client)
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "player@example.com"


def test_duplicate_and_invalid_login_are_rejected(client):
    register_and_login(client)
    duplicate = client.post(
        "/api/auth/register",
        json={"email": "PLAYER@example.com", "password": "strong-pass-123"},
    )
    assert duplicate.status_code == 409
    wrong_password = client.post(
        "/api/auth/login",
        json={"email": "player@example.com", "password": "wrong-pass"},
    )
    missing_user = client.post(
        "/api/auth/login",
        json={"email": "missing@example.com", "password": "wrong-pass"},
    )
    assert wrong_password.status_code == missing_user.status_code == 401
    assert wrong_password.json()["detail"] == missing_user.json()["detail"]


def test_records_and_highest_score(client):
    token = register_and_login(client)
    auth = {"Authorization": f"Bearer {token}"}
    assert client.post("/api/games/records", json={"score": -1}, headers=auth).status_code == 422
    first = client.post(
        "/api/games/records",
        json={"score": 1200, "lines_cleared": 4, "level": 2},
        headers=auth,
    )
    second = client.post("/api/games/records", json={"score": 800}, headers=auth)
    assert first.status_code == second.status_code == 201
    assert len(client.get("/api/games/records/me", headers=auth).json()) == 2
    highest = client.get("/api/scores/highest")
    assert highest.status_code == 200
    assert highest.json()["score"] == 1200


def test_highest_score_empty_state(client):
    assert client.get("/api/scores/highest").json() is None
