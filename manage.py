import os
import subprocess
from dotenv import load_dotenv
from pathlib import Path
import argparse  # Import argparse for better argument parsing
import sys  # Import sys for sys.exit()

def main():
    # Create the argument parser
    parser = argparse.ArgumentParser(description="Manage Docker environments. Allows starting up or shutting down services. In development, 'up' will execute 'watch'.")
    # Add arguments for operation and environment
    parser.add_argument('operation', choices=['up', 'down'], help="Operation to perform: 'up' to start services (executes 'watch' in dev), 'down' to stop them.")
    parser.add_argument('--env', default='prod', help="Specify the environment to use (default: 'prod'). If 'dev' is specified and operation is 'up', 'watch' will be executed.")

    # Parse the command-line arguments
    args = parser.parse_args()

    # Get the operation and environment from the parsed arguments
    operation = args.operation
    env = args.env

    # Load the appropriate .env file based on the --env argument
    env_file = Path(f'./backend/.env.{env}')
    if not env_file.exists():
        print(f"Environment file {env_file} does not exist.")
        sys.exit(1)
    load_dotenv(dotenv_path=str(env_file))

    # Print the environment for confirmation
    print(f"Running in {env} environment, using {env_file}")

    # Prepare the environment for subprocess
    subprocess_env = os.environ.copy()
    subprocess_env["ENV"] = env  # Set the ENV variable to be used by Docker

    # Run docker-compose with the specified operation
    match (operation, env):
        case ('up', 'dev'):
            subprocess.run(['docker-compose', 'build'], env=subprocess_env)
            subprocess.run(['docker-compose', 'watch'], env=subprocess_env)
        case ('up', _):
            subprocess.run(['docker-compose', 'up', '--build', '-d'], env=subprocess_env)
        case ('down', _):
            subprocess.run(['docker-compose', 'down'], env=subprocess_env)

if __name__ == "__main__":
    main()
