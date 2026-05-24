from __future__ import annotations

from collections.abc import Mapping
from datetime import UTC, datetime
from uuid import UUID

from src.auth.schemas import AuthenticatedUser
from src.config import Settings, get_settings
from src.supabase_rest import SupabaseRestClient
from src.surveys.schemas import UserSurvey, UserSurveyPayload


class UserSurveyRepository:
    async def get_by_user_id(self, user_id: UUID) -> UserSurvey | None:
        raise NotImplementedError

    async def upsert(self, user_id: UUID, payload: UserSurveyPayload) -> UserSurvey:
        raise NotImplementedError


class InMemoryUserSurveyRepository(UserSurveyRepository):
    def __init__(self) -> None:
        self._surveys: dict[UUID, UserSurvey] = {}

    async def get_by_user_id(self, user_id: UUID) -> UserSurvey | None:
        return self._surveys.get(user_id)

    async def upsert(self, user_id: UUID, payload: UserSurveyPayload) -> UserSurvey:
        existing = self._surveys.get(user_id)
        now = datetime.now(UTC)
        survey = UserSurvey.model_validate(
            {
                "user_id": user_id,
                **payload.model_dump(mode="json"),
                "created_at": existing.created_at if existing is not None else now,
                "updated_at": now,
            }
        )
        self._surveys[user_id] = survey
        return survey

    def reset(self) -> None:
        self._surveys.clear()


class SupabaseUserSurveyRepository(UserSurveyRepository):
    def __init__(self, settings: Settings) -> None:
        self._rest = SupabaseRestClient(settings)

    async def get_by_user_id(self, user_id: UUID) -> UserSurvey | None:
        rows = await self._rest.select(
            "user_surveys",
            columns="user_id,answers,created_at,updated_at",
            filters={"user_id": f"eq.{user_id}"},
        )
        if not rows:
            return None
        return self._map_row(rows[0])

    async def upsert(self, user_id: UUID, payload: UserSurveyPayload) -> UserSurvey:
        existing = await self._rest.select(
            "user_surveys",
            columns="user_id",
            filters={"user_id": f"eq.{user_id}"},
        )

        row_payload = {
            "user_id": str(user_id),
            "answers": payload.model_dump(mode="json"),
        }
        if existing:
            row = await self._rest.update(
                "user_surveys",
                payload={"answers": row_payload["answers"]},
                filters={"user_id": f"eq.{user_id}"},
            )
        else:
            row = await self._rest.insert("user_surveys", row_payload)

        return self._map_row(row)

    def _map_row(self, row: Mapping[str, object]) -> UserSurvey:
        answers = row.get("answers")
        answer_payload = answers if isinstance(answers, Mapping) else {}
        return UserSurvey.model_validate(
            {
                "user_id": row["user_id"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
                **answer_payload,
            }
        )


class UserSurveyService:
    def __init__(self, repository: UserSurveyRepository) -> None:
        self._repository = repository

    async def get_current_user_survey(self, current_user: AuthenticatedUser) -> UserSurvey | None:
        return await self._repository.get_by_user_id(current_user.id)

    async def save_current_user_survey(
        self,
        current_user: AuthenticatedUser,
        payload: UserSurveyPayload,
    ) -> UserSurvey:
        return await self._repository.upsert(current_user.id, payload)


def _build_user_survey_repository(settings: Settings) -> UserSurveyRepository:
    if settings.supabase_project_url and settings.supabase_service_role_key:
        return SupabaseUserSurveyRepository(settings)
    return InMemoryUserSurveyRepository()


survey_service = UserSurveyService(_build_user_survey_repository(get_settings()))
