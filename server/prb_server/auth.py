import functools
import hashlib
import hmac
import time


def authenticate(passphrase, data, *, grace_seconds=10):
    passphrase = passphrase.encode()
    data = data.encode()

    try:
        timestamp, nonce, signature = data.split(b'-')
    except (ValueError, TypeError):
        return False

    if not timestamp.isdigit():
        return False

    if abs(time.time() - int(timestamp)) > grace_seconds:
        return False

    hash_msg = timestamp + nonce
    expected = hmac.new(passphrase, hash_msg, hashlib.sha512).hexdigest()
    expected = expected.encode()
    return hmac.compare_digest(signature, expected)
