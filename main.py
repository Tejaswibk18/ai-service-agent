from agent.agent import run_agent


if __name__ == "__main__":

    user_input = input("You: ")

    result = run_agent(user_input)

    print("\nAgent:", result)