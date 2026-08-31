from fastapi import APIRouter, Depends

from api.schemas.agent import (
    AgentRequest,
    AgentResponse,
)

from agent.planner import create_plan
from agent.executor import execute_plan
from agent.analyzer import analyze_results

from memory.memory import save_memory

from utils.output import save_output
from utils.report import save_report


router = APIRouter(
    prefix="/agent",
    tags=["Agent"]
)


@router.post(
    "/query",
    response_model=AgentResponse
)
def agent_query(request: AgentRequest):

    user_input = request.query

    # -------------------------
    # Planning
    # -------------------------

    plan = create_plan(user_input)

    results = []
    analysis = None

    # -------------------------
    # Execution
    # -------------------------

    if plan.get("steps"):

        results = execute_plan(plan)

        # -------------------------
        # Analysis
        # -------------------------

        if results:

            analysis = analyze_results(
                results,
                user_input
            )

    # -------------------------
    # Memory
    # -------------------------

    save_memory(
        query=user_input,
        plan=plan,
        results=results,
        analysis=analysis
    )

    # -------------------------
    # Output
    # -------------------------

    output = {
        "query": user_input,
        "plan": plan,
        "execution_results": results
    }

    save_output(output)

    if analysis:
        save_report(analysis)

    return AgentResponse(
        success=True,
        query=user_input,
        plan=plan,
        results=results,
        analysis=analysis
    )