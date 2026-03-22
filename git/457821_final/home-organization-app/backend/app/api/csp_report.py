"""
CSP (Content Security Policy) Violation Reporting
==================================================

Endpoint to receive and log CSP violation reports from browsers.
"""
from fastapi import APIRouter, Request, HTTPException, status
from app.core.logging import logger
from typing import Any, Dict

router = APIRouter(prefix="/csp-report", tags=["security"])


@router.post("/")
async def csp_report(request: Request):
    """
    Receive CSP violation reports from browsers.

    Browsers automatically send violation reports when CSP is violated.
    This endpoint logs the violations for monitoring and debugging.

    Note: This endpoint should be publicly accessible (no auth required)
    to allow browsers to report violations.
    """
    try:
        # Parse JSON report
        report_data: Dict[str, Any] = await request.json()

        # Extract violation details
        csp_report = report_data.get("csp-report", {})

        violation = {
            "document-uri": csp_report.get("document-uri"),
            "referrer": csp_report.get("referrer"),
            "violated-directive": csp_report.get("violated-directive"),
            "effective-directive": csp_report.get("effective-directive"),
            "original-policy": csp_report.get("original-policy"),
            "blocked-uri": csp_report.get("blocked-uri"),
            "source-file": csp_report.get("source-file"),
            "line-number": csp_report.get("line-number"),
            "column-number": csp_report.get("column-number"),
            "status-code": csp_report.get("status-code"),
        }

        # Log violation
        logger.warning(
            "CSP violation detected",
            extra={
                "violation": violation,
                "client_ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
            }
        )

        # Return success (browsers expect 204 or 200)
        return {"status": "ok"}

    except Exception as e:
        # Log error but don't fail (browsers will retry)
        logger.error(f"Error processing CSP report: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/test")
def test_csp_report():
    """
    Test endpoint to verify CSP reporting is working.

    This endpoint can be used to test CSP violation reporting.
    """
    return {
        "message": "CSP reporting endpoint is active",
        "instructions": "Add 'report-uri /api/csp-report/' to your CSP policy to enable reporting"
    }
