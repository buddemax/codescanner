import os
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(
    title="FastAPI Gemini Proxy",
    description="A middleware service that handles requests from the frontend and forwards them to the Gemini API.",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific domains
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Load configuration from environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDqQNM3UCwCeirsMqeaYcYL6iGOQmJ_aIE")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set. Please define the environment variable.")

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8129711950:AAGTFNloBPoreQoyl9g1UKTOoBMxg7N5fzI")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "-4662919414")
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"

async def call_gemini(prompt: str) -> dict:
    """
    Send a prompt to the Gemini API and return the raw response.
    """
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 2048,
        }
    }
    params = {"key": GEMINI_API_KEY}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GEMINI_API_URL,
                headers=headers,
                json=payload,
                params=params
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        error_msg = f"HTTP error occurred: {str(e)}"
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_data = e.response.json()
                error_msg = f"Gemini API error: {error_data.get('error', {}).get('message', str(e))}"
            except:
                error_msg = f"Gemini API error: {e.response.text}"
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

async def send_telegram_message(message: str):
    """
    Send a message to the configured Telegram chat.
    """
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        raise RuntimeError("Telegram configuration missing (BOT_TOKEN or CHAT_ID)")

    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "HTML"
    }
    headers = {"Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(TELEGRAM_API_URL, json=payload, headers=headers)
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send Telegram message: {str(e)}"
        )

@app.post("/scan")
async def scan_code(request: Request):
    """
    POST /scan expects JSON with fields:
    - filename: Name of the file
    - content: Source code

    Forwards these to Gemini and returns the results.
    """
    try:
        body = await request.json()
        filename: Optional[str] = body.get("filename")
        content: Optional[str] = body.get("content")

        if not filename or not content:
            raise HTTPException(
                status_code=400,
                detail="'filename' and 'content' are required."
            )

        prompt = (
            f"Analyze this code for potential issues, vulnerabilities, and outdated dependencies. "
            f"Provide the analysis in the following JSON format:\n"
            f"[\n"
            f"  {{\n"
            f"    \"type\": \"error|vulnerability|dependency\",\n"
            f"    \"severity\": \"high|medium|low\",\n"
            f"    \"message\": \"Description of the issue\",\n"
            f"    \"location\": \"File and line number\",\n"
            f"    \"impact\": 1-10,\n"
            f"    \"effort\": 1-10,\n"
            f"    \"recommendation\": \"How to fix the issue\"\n"
            f"  }}\n"
            f"]\n\n"
            f"File: {filename}\nCode:\n{content}\n"
        )

        try:
            gemini_response = await call_gemini(prompt)
            return gemini_response
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to analyze code with Gemini: {str(e)}"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process scan request: {str(e)}"
        )

@app.post("/notify")
async def notify(request: Request):
    """
    POST /notify expects JSON with fields:
    - message: The text to send
    - scan_results: Optional - List of scan results for detailed analysis
    """
    try:
        body = await request.json()
        text: Optional[str] = body.get("message")
        scan_results: Optional[list] = body.get("scan_results")

        if not text and not scan_results:
            raise HTTPException(status_code=400, detail="'message' or 'scan_results' is required.")

        if scan_results:
            # Create a humorous summary of scan results
            total_issues = len(scan_results)
            severity_counts = {
                'high': len([r for r in scan_results if r.get('severity') == 'high']),
                'medium': len([r for r in scan_results if r.get('severity') == 'medium']),
                'low': len([r for r in scan_results if r.get('severity') == 'low'])
            }

            type_counts = {
                'error': len([r for r in scan_results if r.get('type') == 'error']),
                'vulnerability': len([r for r in scan_results if r.get('type') == 'vulnerability']),
                'dependency': len([r for r in scan_results if r.get('type') == 'dependency'])
            }

            # Top 3 critical issues
            high_priority_issues = [r['message'] for r in scan_results if r.get('severity') == 'high'][:3]
            # Top 2 security vulnerabilities
            vulnerabilities = [r['message'] for r in scan_results if r.get('type') == 'vulnerability'][:2]
            # Top 2 dependency issues
            dependency_issues = [r['message'] for r in scan_results if r.get('type') == 'dependency'][:2]

            text = f"""🎭 Code Drama Report: "The Good, The Bad, and The Ugly" 🎭

🎪 Total Plot Twists: {total_issues}

🎭 Drama Level Breakdown:
🔥 "This is Fine" (High): {severity_counts['high']}
😅 "Could be Worse" (Medium): {severity_counts['medium']}
😌 "Meh" (Low): {severity_counts['low']}

🎪 Genre Breakdown:
🤡 Comedy of Errors: {type_counts['error']}
🎭 Security Thriller: {type_counts['vulnerability']}
📚 Dependency Drama: {type_counts['dependency']}

🎬 Action Items (Starring Your Code):

1️⃣ "Mission Impossible" - Critical Issues:
{chr(10).join(f'   {i+1}. {issue}' for i, issue in enumerate(high_priority_issues))}

2️⃣ "The Matrix" - Security Plot Holes:
{chr(10).join(f'   {i+1}. {vuln}' for i, vuln in enumerate(vulnerabilities))}

3️⃣ "Dependency Day" - Update Required:
{chr(10).join(f'   {i+1}. {dep}' for i, dep in enumerate(dependency_issues))}

4️⃣ "Code Makeover" - Beauty Tips:
   • TypeScript: Because "any" is not a type, it's a cry for help
   • ESLint: Your code's personal trainer
   • Documentation: Because future you will thank past you

5️⃣ "Speed" - Performance Edition:
   • Database queries: Fast & Furious
   • Cache: The memory you wish you had
   • File operations: Size matters

6️⃣ "The Clean Code":
   • Dependencies: Out with the old, in with the new
   • Dead code: Time to say goodbye
   • Formatting: Because beauty is in the eye of the beholder

🎬 Stay tuned for the next episode in your code's dramatic journey!"""

        # Send the message through Telegram
        result = await send_telegram_message(text)
        return {"status": "sent", "message": "Notification sent successfully", "telegram_response": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process notification: {str(e)}")

@app.post("/coverage")
async def estimate_coverage(request: Request):
    """
    POST /coverage expects JSON with fields:
    - sourceFiles: List of source files with name and content
    - testFiles: List of test files with name and content
    """
    try:
        body = await request.json()
        source_files = body.get("sourceFiles", [])
        test_files = body.get("testFiles", [])

        # Professionelle Fehlerbehandlung:
        if not source_files:
            return {"candidates": [{"content": {"parts": [{"text": "0"}], "role": "model"}}]}
        if not test_files:
            return {"candidates": [{"content": {"parts": [{"text": "0"}], "role": "model"}}]}

        prompt = (
            "Given the following source files and test files, estimate what percentage of the code is covered by tests. "
            "Only answer with a single integer number between 0 and 100.\n\n"
            "Source files:\n" + 
            "\n".join(f"File: {f['name']}\n{f['content']}" for f in source_files) + 
            "\n\nTest files:\n" + 
            "\n".join(f"File: {f['name']}\n{f['content']}" for f in test_files) + 
            "\n\nCoverage (%):"
        )

        gemini_response = await call_gemini(prompt)
        return gemini_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to estimate coverage: {str(e)}")

@app.get("/")
async def root():
    return {"message": "FastAPI Gemini Proxy is running."}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
