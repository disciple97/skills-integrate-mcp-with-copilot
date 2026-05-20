# Mergington High School Activities API

A super simple FastAPI application that allows students to view activities, while only teachers can register/unregister students.

## Features

- View all available extracurricular activities
- Teacher login/logout (credentials from `teachers.json`)
- Teacher-only student registration and unregistration

## Getting Started

1. Install the dependencies:

   ```
   pip install -r requirements.txt
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

4. Teacher credentials are stored in `src/teachers.json`.
   The default examples are:
   - `mr_smith` / `mergington-123`
   - `ms_johnson` / `mergington-456`

## Run tests

```
pytest
```

## API Endpoints

| Method | Endpoint                                                             | Description                                                         |
| ------ | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                        | Get all activities with their details and current participant count |
| POST   | `/auth/login`                                                        | Teacher login, returns bearer token                                |
| POST   | `/auth/logout`                                                       | Teacher logout                                                      |
| GET    | `/auth/me`                                                           | Return authenticated teacher info                                   |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu`   | Register a student (teacher-only)                                   |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister a student (teacher-only)                                 |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
