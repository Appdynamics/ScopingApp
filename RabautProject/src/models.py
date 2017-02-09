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

class povs(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  email = db.Column(db.String(128), nullable=False)
  account = db.Column(db.String(128), nullable=False)
  sfdc = db.Column(db.String(128), nullable=False)
  start = db.Column(db.String(128), nullable=False)
  enddate = db.Column(db.String(128), nullable=False)
  apps = db.relationship('apps', backref="povs", cascade="all, delete-orphan")

  def __init__(self, email, account, sfdc, start, enddate):
        self.email = email
        self.account = account
        self.sfdc = sfdc
        self.start = start
        self.enddate = enddate


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
  products = db.relationship('products', secondary=appsproducts, backref=db.backref('products', lazy='dynamic'))

  def __init__(self, name, products):
        self.name = name
        self.products = products

class products(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128),nullable=False)

    def __init__(self, name):
          self.name = name

    def get_id(self):
        return str(self.id)



def session_commit():
    try:
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return reason

if __name__ == '__main__':
    manager.run()
