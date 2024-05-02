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

    # Prepare the environment for subprocess
    subprocess_env = os.environ.copy()
    subprocess_env["ENV"] = env  # Set the ENV variable to be used by Docker

    # Define the base and override Compose files
    base_compose_file = 'docker-compose.yml'
    override_compose_file = f'docker-compose.{env}.yml'

    # Run docker-compose with the specified operation
    compose_files = ['-f', base_compose_file, '-f', override_compose_file]
    match (operation, env):
        case ('up', 'dev'):
            subprocess.run(['docker-compose', *compose_files, 'build'], env=subprocess_env)
            subprocess.run(['docker-compose', *compose_files, 'watch'], env=subprocess_env)
        case ('up', _):
            subprocess.run(['docker-compose', *compose_files, 'up', '--build', '-d'], env=subprocess_env)
        case ('down', _):
            subprocess.run(['docker-compose', *compose_files, 'down'], env=subprocess_env)

if __name__ == "__main__":
    main()
