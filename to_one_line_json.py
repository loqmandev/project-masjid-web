#!/usr/bin/env python3
import json
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: to_one_line_json.py <service-account.json>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as exc:
        print(f"Failed to read/parse JSON: {exc}", file=sys.stderr)
        return 1

    print(json.dumps(data))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
