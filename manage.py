import os
import subprocess
import sys
from dotenv import load_dotenv
from pathlib import Path

def main():
    # Check if a command-line argument is provided
    if len(sys.argv) != 2:
        print("Usage: python3 start.py [up|down]. In development, 'up' will execute 'watch'.")
        sys.exit(1)

    # Get the operation (up or down) from command-line argument
    operation = sys.argv[1]
    if operation not in ['up', 'down']:
        print("Invalid operation. Use 'up' or 'down'.")
        sys.exit(1)

    # Get the ENV environment variable, default to 'prod' if not set
    env = os.environ.get('ENV', 'prod')

    # Load the appropriate .env file based on the ENV variable
    env_file = Path(f'./backend/.env.{env}')
    if not env_file.exists():
        print(f"Environment file {env_file} does not exist.")
        sys.exit(1)
    load_dotenv(dotenv_path=str(env_file))

    # Print the environment for confirmation (optional, can be removed)
    print(f"Running in {env} environment, using {env_file}")

    # Run docker-compose with the specified operation
    if operation == 'up' and env == 'dev':
        subprocess.run(['docker-compose', 'build'])
        subprocess.run(['docker-compose', 'watch'])
    if operation == 'up':
        subprocess.run(['docker-compose', 'up', '--build', '-d'])
    if operation == 'down':
        subprocess.run(['docker-compose', 'down'])

if __name__ == "__main__":
    main()
