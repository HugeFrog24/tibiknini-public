# start from an official Python image
FROM python:3

# arbitrary location choice: you can change the directory
WORKDIR /usr/src/app

# install our dependencies
# we use --system flag because we don't need an extra virtualenv
COPY requirements.txt .
RUN pip install -r /usr/src/app/requirements.txt

# copy our project code
COPY . /usr/src/app/

# expose the port 8000
EXPOSE 8000

# define the default command to run when starting a container
CMD python3 manage.py makemigrations --merge && python3 manage.py migrate && python3 manage.py collectstatic --no-input && gunicorn tibiknini.wsgi:application --workers 3 --bind 0.0.0.0:8000
