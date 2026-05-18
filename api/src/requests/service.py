from uuid import UUID

from src.exceptions import NotFoundException
from src.requests.schemas import Request, RequestCreate


class RequestService:
    def __init__(self) -> None:
        self._requests: list[Request] = []

    def list_requests(self) -> list[Request]:
        return list(self._requests)

    def create_request(self, payload: RequestCreate, requester_id: UUID) -> Request:
        request = Request(**payload.model_dump(), requester_id=requester_id)
        self._requests.append(request)
        return request

    def get_request(self, request_id: str) -> Request:
        for request in self._requests:
            if str(request.id) == request_id:
                return request
        raise NotFoundException("Request")


request_service = RequestService()
