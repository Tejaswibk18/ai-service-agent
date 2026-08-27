from agent.planner import create_plan
from agent.executor import execute_plan
from agent.analyzer import analyze_results
from utils.output import save_output
from utils.report import save_report
from memory.memory import save_memory


if __name__ == "__main__":

    user_input = input("You: ")

    plan = create_plan(user_input)

    results = []
    analysis = None

    # Execute only if the planner created steps
    if plan.get("steps"):

        results = execute_plan(plan)

        if results:
            analysis = analyze_results(
                results,
                user_input
            )

    else:

        analysis = "No server operation required."

    # Save memory
    save_memory(
        query=user_input,
        plan=plan,
        results=results,
        analysis=analysis
    )

    # Save latest execution
    output = {
        "query": user_input,
        "plan": plan,
        "execution_results": results
    }

    save_output(output)

    # Save report
    if analysis:
        save_report(analysis)

    print("\nOutput saved:")
    print("outputs/agent_output.json")
    print("outputs/health_report.md")