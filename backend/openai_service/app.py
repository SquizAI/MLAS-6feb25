from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai
import os
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi.responses import HTMLResponse, JSONResponse
from openai import OpenAI  # Update this import

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="OpenAI Structured Output Service",
    description="API for OpenAI integration with structured outputs",
    version="1.0.0",
)

# Add CORS middleware with more permissive settings for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # More permissive for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Set OpenAI API key from environment
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# After loading environment variables
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
)

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <html>
        <head>
            <title>OpenAI Service API</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
                .endpoint { margin-bottom: 20px; }
                .method { color: #e83e8c; }
            </style>
        </head>
        <body>
            <h1>OpenAI Service API</h1>
            <p>Available endpoints:</p>
            <div class="endpoint">
                <h3><a href="/docs">/docs</a></h3>
                <p>Interactive API documentation</p>
            </div>
            <div class="endpoint">
                <h3><span class="method">POST</span> /complete</h3>
                <p>Structured output completion</p>
                <code>curl -X POST http://localhost:5000/complete -H "Content-Type: application/json" -d '{"prompt": "Schedule meeting tomorrow", "agent_level": "manager"}'</code>
            </div>
            <div class="endpoint">
                <h3><span class="method">POST</span> /function_call/send_email</h3>
                <p>Email function calling</p>
                <code>curl -X POST http://localhost:5000/function_call/send_email -H "Content-Type: application/json" -d '{"prompt": "Send email to john@example.com", "model": "gpt-4o", "reasoning_effort": 1.0}'</code>
            </div>
            <div class="endpoint">
                <h3><span class="method">POST</span> /function_call/search_knowledge_base</h3>
                <p>Knowledge base search</p>
                <code>curl -X POST http://localhost:5000/function_call/search_knowledge_base -H "Content-Type: application/json" -d '{"prompt": "Find info about AI", "model": "gpt-4o", "reasoning_effort": 1.0}'</code>
            </div>
            <p>For detailed API documentation and testing interface, visit the <a href="/docs">docs page</a>.</p>
        </body>
    </html>
    """

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/function_call/send_email")
async def send_email_info():
    """Information about the send_email endpoint"""
    return JSONResponse({
        "endpoint": "/function_call/send_email",
        "method": "POST",
        "description": "Send emails using function calling",
        "request_format": {
            "prompt": "string",
            "model": "string (default: gpt-4o)",
            "reasoning_effort": "number (default: 1.0)"
        },
        "example": {
            "prompt": "Send an email to john@example.com about the project deadline",
            "model": "gpt-4o",
            "reasoning_effort": 1.0
        }
    })

@app.get("/function_call/search_knowledge_base")
async def search_knowledge_base_info():
    """Information about the search_knowledge_base endpoint"""
    return JSONResponse({
        "endpoint": "/function_call/search_knowledge_base",
        "method": "POST",
        "description": "Search knowledge base using function calling",
        "request_format": {
            "prompt": "string",
            "model": "string (default: gpt-4o)",
            "reasoning_effort": "number (default: 1.0)"
        },
        "example": {
            "prompt": "Find information about machine learning frameworks",
            "model": "gpt-4o",
            "reasoning_effort": 1.0
        }
    })

class FunctionCallRequest(BaseModel):
    model: str
    prompt: str
    reasoning_effort: float

@app.post("/function_call/send_email")
async def send_email_function(request: FunctionCallRequest):
    """
    Send email using function calling
    """
    print(f"Received request: {request}")  # Debug log
    
    try:
        # Define the 'send_email' tool specification
        tools = [{
            "type": "function",
            "function": {
                "name": "send_email",
                "description": "Send an email to a given recipient with a subject and message.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "to": {
                            "type": "string",
                            "description": "The recipient email address."
                        },
                        "subject": {
                            "type": "string",
                            "description": "Email subject line."
                        },
                        "body": {
                            "type": "string",
                            "description": "Body of the email message."
                        }
                    },
                    "required": ["to", "subject", "body"]
                }
            }
        }]

        try:
            completion = client.chat.completions.create(
                model="gpt-4",  # Use a valid model name
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that creates emails."},
                    {"role": "user", "content": request.prompt}
                ],
                tools=tools
            )
            
            print(f"OpenAI response: {completion}")  # Debug log
            
            # Access the message and tool calls correctly based on the API response structure
            message = completion.choices[0].message
            tool_calls = message.tool_calls if hasattr(message, 'tool_calls') else []
            
            return {
                "tool_calls": [
                    {
                        "function": {
                            "name": tool_call.function.name,
                            "arguments": tool_call.function.arguments
                        }
                    } for tool_call in tool_calls
                ] if tool_calls else []
            }
            
        except Exception as openai_error:
            print(f"OpenAI API error: {str(openai_error)}")  # Debug log
            raise HTTPException(
                status_code=500,
                detail=f"OpenAI API error: {str(openai_error)}"
            )
            
    except Exception as e:
        print(f"Unexpected error: {str(e)}")  # Debug log
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )

# ================================
# New Function-Calling Endpoint for search_knowledge_base
# ================================

@app.post("/function_call/search_knowledge_base")
async def search_knowledge_base_function(request: FunctionCallRequest):
    # Define the 'search_knowledge_base' tool specification.
    tools = [{
        "type": "function",
        "function": {
            "name": "search_knowledge_base",
            "description": "Query a knowledge base to retrieve relevant info on a topic.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The user question or search query."
                    },
                    "options": {
                        "type": "object",
                        "properties": {
                            "num_results": {
                                "type": "number",
                                "description": "Number of top results to return."
                            },
                            "domain_filter": {
                                "type": ["string", "null"],
                                "description": "Optional domain to narrow the search (e.g. 'finance', 'medical'). Pass null if not needed."
                            },
                            "sort_by": {
                                "type": ["string", "null"],
                                "enum": ["relevance", "date", "popularity", "alphabetical"],
                                "description": "How to sort results. Pass null if not needed."
                            }
                        },
                        "required": ["num_results", "domain_filter", "sort_by"],
                        "additionalProperties": False
                    }
                },
                "required": ["query", "options"],
                "additionalProperties": False
            },
            "strict": True
        }
    }]

    try:
        params = {
            "model": request.model,
            "messages": [{"role": "user", "content": request.prompt}],
            "tools": tools
        }
        if request.reasoning_effort:
            params["reasoning_effort"] = request.reasoning_effort

        completion = openai.ChatCompletion.create(**params)
        tool_calls = completion.choices[0].message.get("tool_calls", [])
        return {"tool_calls": tool_calls}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.middleware("http")
async def log_requests(request, call_next):
    print(f"Incoming request: {request.method} {request.url}")
    print(f"Headers: {request.headers}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response 