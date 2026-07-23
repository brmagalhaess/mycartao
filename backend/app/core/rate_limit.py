from __future__ import annotations

from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from threading import Lock

_WINDOW = timedelta(minutes=15)
_MAX_REQUESTS = 5
_lock = Lock()
_buckets: dict[str, deque[datetime]] = defaultdict(deque)


def clear_rate_limits() -> None:
    with _lock:
        _buckets.clear()


def check_rate_limit(key: str, *, max_requests: int = _MAX_REQUESTS) -> bool:
    """Return True if allowed; False if rate limited."""
    now = datetime.now(timezone.utc)
    cutoff = now - _WINDOW
    with _lock:
        bucket = _buckets[key]
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= max_requests:
            return False
        bucket.append(now)
        return True
