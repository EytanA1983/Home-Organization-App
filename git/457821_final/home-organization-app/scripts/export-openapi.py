#!/usr/bin/env python3
"""
Export OpenAPI Schema from FastAPI Application

Usage:
    python scripts/export-openapi.py
    python scripts/export-openapi.py --output docs/openapi.json
    python scripts/export-openapi.py --format yaml
"""

import argparse
import json
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))


def export_openapi(output_path: str = "docs/openapi.json", format: str = "json"):
    """Export OpenAPI schema from FastAPI app."""
    try:
        from app.main import app

        schema = app.openapi()

        # Create output directory
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        if format == "yaml":
            try:
                import yaml
                with open(output_file, "w", encoding="utf-8") as f:
                    yaml.dump(schema, f, allow_unicode=True, default_flow_style=False)
            except ImportError:
                print("PyYAML not installed. Install with: pip install pyyaml")
                sys.exit(1)
        else:
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(schema, f, indent=2, ensure_ascii=False)

        print(f"✓ OpenAPI schema exported to: {output_file}")
        print(f"  - Title: {schema.get('info', {}).get('title', 'N/A')}")
        print(f"  - Version: {schema.get('info', {}).get('version', 'N/A')}")
        print(f"  - Paths: {len(schema.get('paths', {}))}")
        print(f"  - Schemas: {len(schema.get('components', {}).get('schemas', {}))}")

        return True

    except ImportError as e:
        print(f"Error importing FastAPI app: {e}")
        print("Make sure you're running from the project root and dependencies are installed.")
        sys.exit(1)
    except Exception as e:
        print(f"Error exporting schema: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Export OpenAPI schema from FastAPI")
    parser.add_argument(
        "--output", "-o",
        default="docs/openapi.json",
        help="Output file path (default: docs/openapi.json)"
    )
    parser.add_argument(
        "--format", "-f",
        choices=["json", "yaml"],
        default="json",
        help="Output format (default: json)"
    )

    args = parser.parse_args()
    export_openapi(args.output, args.format)


if __name__ == "__main__":
    main()
