FROM 632713433352.dkr.ecr.us-west-2.amazonaws.com/python_base:latest

MAINTAINER Eric Johanson (eric.johanson@appdynamics.com)

################## BEGIN INSTALLATION ######################

# PIP install packages
RUN pip install pip
RUN pip install --upgrade pip
RUN pip install flask
RUN pip install psycopg2
RUN pip install urllib3
RUN pip install requests
RUN pip install flask-mysql
RUN pip install datetime
RUN pip install sqlalchemy
RUN pip install flask-sqlalchemy
RUN pip install flask-oauth
RUN pip install flask-migrate
RUN pip install flask-restful
RUN pip install alembic
RUN pip install pymongo

RUN mkdir /ScopingApp

COPY . /ScopingApp/

##################### INSTALLATION END #####################

# Expose Ports
EXPOSE 5000

CMD ["python", "/ScopingApp/src/run.py"]
