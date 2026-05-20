from fastapi.testclient import TestClient

from src.app import activities, app


client = TestClient(app)


def test_activities_are_public():
    response = client.get("/activities")
    assert response.status_code == 200
    assert "Chess Club" in response.json()


def test_signup_requires_teacher_authentication():
    response = client.post("/activities/Chess%20Club/signup?email=student1@mergington.edu")
    assert response.status_code == 401


def test_teacher_can_login_and_manage_registrations():
    login_response = client.post(
        "/auth/login",
        json={"username": "mr_smith", "password": "mergington-123"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    activity_name = "Chess Club"
    email = "new.student@mergington.edu"

    if email in activities[activity_name]["participants"]:
        activities[activity_name]["participants"].remove(email)

    signup_response = client.post(
        f"/activities/{activity_name}/signup?email={email}",
        headers=headers,
    )
    assert signup_response.status_code == 200

    unregister_response = client.delete(
        f"/activities/{activity_name}/unregister?email={email}",
        headers=headers,
    )
    assert unregister_response.status_code == 200


def test_invalid_teacher_credentials_are_rejected():
    response = client.post(
        "/auth/login",
        json={"username": "mr_smith", "password": "wrong-password"},
    )
    assert response.status_code == 401

