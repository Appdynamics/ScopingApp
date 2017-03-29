from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_script import Manager
from flask_migrate import Migrate, MigrateCommand
import datetime
import os


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = os.environ.get('SQLALCHEMY_TRACK_MODIFICATIONS')
db = SQLAlchemy(app)
#Create Database migrations
migrate = Migrate(app, db)
manager = Manager(app)
manager.add_command('db', MigrateCommand)

appsproducts = db.Table('appsproducts',
        db.Column('app_id', db.Integer, db.ForeignKey('apps.id')),
        db.Column('product_id', db.Integer, db.ForeignKey('products.id'))
        )

answersresponses = db.Table('answersresponses',
        db.Column('answer_id', db.Integer, db.ForeignKey('answers.id')),
        db.Column('response_id', db.Integer, db.ForeignKey('responses.id'))
        )

customanswersresponses = db.Table('customanswersresponses',
        db.Column('answer_id', db.Integer, db.ForeignKey('answers.id')),
        db.Column('customresponse_id', db.Integer, db.ForeignKey('customresponses.id'))
        )

class povs(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  email = db.Column(db.String(128), nullable=False)
  account = db.Column(db.String(128), nullable=False)
  sfdc = db.Column(db.String(128), nullable=False)
  start = db.Column(db.String(128), nullable=False)
  enddate = db.Column(db.String(128), nullable=False)
  targetenddate = db.Column(db.String(128), nullable=False)
  apps = db.relationship('apps', backref="povs", lazy='dynamic', cascade="all, delete-orphan")

  def __init__(self, email, account, sfdc, start, enddate, targetenddate):
        self.email = email
        self.account = account
        self.sfdc = sfdc
        self.start = start
        self.enddate = enddate
        self.targetenddate = targetenddate


  def add(self,povs):
        db.session.add(povs)
        return session_commit()

  def get_id(self):
      return str(self.id)

  def update(self):
        return session_commit()

  def delete(self,povs):
        db.session.delete(povs)
        return session_commit()

class apps(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  name = db.Column(db.String(128),nullable=False)
  povs_id = db.Column(db.Integer, db.ForeignKey('povs.id'))
  products = db.relationship('products', secondary=appsproducts, lazy='dynamic', backref=db.backref('apps', lazy='dynamic'))

  def __init__(self, name):
        self.name = name

  def add(self, apps):
      db.session.add(apps)
      return session_commit()

  def update(self):
        return session_commit()

  def delete(self,apps):
        db.session.delete(apps)
        return session_commit()

class products(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128),nullable=False)
    questions = db.relationship('questions', backref="products", lazy='dynamic', cascade="all, delete-orphan")

    def __init__(self, name):
          self.name = name

    def get_id(self):
        return str(self.id)

class questions(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String(128),nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'))
    answers = db.relationship('answers', backref="questions", lazy='dynamic', cascade="all, delete-orphan")

    def __init__(self, subject):
          self.subject = subject

    def add(self,questions):
        db.session.add(questions)
        return session_commit()

    def get_id(self):
        return str(self.id)

    def update(self):
          return session_commit()

    def delete(self,questions):
          db.session.delete(questions)
          return session_commit()

class answers(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    answerQuestion = db.Column(db.String(128),nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'))
    responses = db.relationship('responses', secondary=answersresponses, backref="answers", lazy='dynamic')
    customresponses = db.relationship('customresponses', secondary=customanswersresponses, backref="answers", lazy='dynamic')

    def __init__(self, answerQuestion):
          self.answerQuestion = answerQuestion

    def add(self,answers):
        db.session.add(answers)
        return session_commit()

    def get_id(self):
        return str(self.id)

    def update(self):
          return session_commit()

    def delete(self,answers):
          db.session.delete(answers)
          return session_commit()

class responses(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String(128),nullable=False)

    def __init__(self, subject):
          self.subject = subject

    def add(self,responses):
        db.session.add(responses)
        return session_commit()

    def get_id(self):
        return str(self.id)

    def update(self):
          return session_commit()

    def delete(self,responses):
          db.session.delete(responses)
          return session_commit()

class customresponses(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String(128),nullable=False)

    def __init__(self, subject):
          self.subject = subject

    def add(self,customresponses):
        db.session.add(customresponses)
        return session_commit()

    def get_id(self):
        return str(self.id)

    def update(self):
          return session_commit()

    def delete(self,responses):
          db.session.delete(customresponses)
          return session_commit()


def session_commit():
    try:
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return reason

if __name__ == '__main__':
    manager.run()
