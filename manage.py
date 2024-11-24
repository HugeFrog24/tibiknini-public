import os
import subprocess
import argparse  # Import argparse for better argument parsing

def collect_static():
    subprocess.run(['python', 'backend/manage.py', 'collectstatic', '--noinput'])

def dev_environment():
    # Clean up any old containers/builds first
    subprocess.run([
        'docker-compose',
        '-f', 'docker-compose.yml',
        '-f', 'docker-compose.dev.yml',
        'down', '--remove-orphans'
    ])
    
    # Build and start development environment
    subprocess.run([
        'docker-compose',
        '-f', 'docker-compose.yml',
        '-f', 'docker-compose.dev.yml',
        'up', '--build'
    ])

def prod_environment():
    # Pull latest images
    subprocess.run([
        'docker-compose',
        '-f', 'docker-compose.yml',
        '-f', 'docker-compose.prod.yml',
        'pull'
    ])
    
    # Restart services with new images
    subprocess.run([
        'docker-compose',
        '-f', 'docker-compose.yml',
        '-f', 'docker-compose.prod.yml',
        'up', '-d', '--remove-orphans'
    ])

def main():
    # Create the argument parser
    parser = argparse.ArgumentParser(description="Manage Docker environments. Allows starting up or shutting down services. In development, 'up' will execute 'watch'.")
    # Add arguments for operation and environment
    parser.add_argument('operation', choices=['up', 'down', 'collectstatic'], help="Operation to perform: 'up' to start services (executes 'watch' in dev), 'down' to stop them, 'collectstatic' to collect static files.")
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
            dev_environment()
        case ('up', _):
            prod_environment()
        case ('down', _):
            subprocess.run(['docker-compose', *compose_files, 'down'], env=subprocess_env)
        case ('collectstatic', _):
            collect_static()

if __name__ == "__main__":
    main()
