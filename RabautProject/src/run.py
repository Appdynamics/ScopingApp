from flask import Flask, redirect, url_for, session, render_template, send_file, request, flash, json, jsonify
from flask_oauth import OAuth
from urllib2 import Request, urlopen, URLError

from sqlalchemy import create_engine, Column, Integer, String
from flask_sqlalchemy import SQLAlchemy

import models

from models import db, povs, apps, products, appsproducts

import psycopg2
import os
# You must configure these 3 values from Google APIs console
# https://code.google.com/apis/console
GOOGLE_CLIENT_ID = '201266052742-8ntv6ml3cqdpc1esfh57j8v0f62gitus.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET = 'VB_8NBJhzE3g2RBy_gGK2kAr'
REDIRECT_URI = '/oauth2callback'  # one of the Redirect URIs from Google APIs console

SECRET_KEY = 'development key'


app = Flask(__name__)
app.secret_key = SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = os.environ.get('SQLALCHEMY_TRACK_MODIFICATIONS')

oauth = OAuth()

postgresDatabase = 'AppDynamicsPostgres'
postgresUser = 'test'
postgresPassword = 'test'
postgresHost = 'postgres-data'
postgresPort = '5432'
#userLogin = ''

google = oauth.remote_app('google',
                          base_url='https://www.google.com/accounts/',
                          authorize_url='https://accounts.google.com/o/oauth2/auth',
                          request_token_url=None,
                          request_token_params={'scope': 'https://www.googleapis.com/auth/userinfo.email',
                                                'response_type': 'code',
                                                'hd':'appdynamics.com'},
                          access_token_url='https://accounts.google.com/o/oauth2/token',
                          access_token_method='POST',
                          access_token_params={'grant_type': 'authorization_code'},
                          consumer_key=GOOGLE_CLIENT_ID,
                          consumer_secret=GOOGLE_CLIENT_SECRET)

@app.route('/' , methods=['POST', 'GET'])
def index():
    access_token = session.get('access_token')
    if access_token is None:
        return redirect(url_for('login'))

    access_token = access_token[0]

    headers = {'Authorization': 'OAuth '+access_token}
    req = Request('https://www.googleapis.com/oauth2/v1/userinfo',
                  None, headers)
    try:
        res = urlopen(req)
        resRead = res.read()
        data = json.loads(resRead)
        #global userLogin
        #userLogin = data['email']
    except URLError, e:
        if e.code == 401:
            # Unauthorized - bad token
            session.pop('access_token', None)
            return redirect(url_for('login'))
        return res.read()

    #GET POVS FOR SPECIFIC PERSON
    #pov = db.query.all()

    return render_template('index.html')


@app.route('/login')
def login():
    callback=url_for('authorized', _external=True)
    return google.authorize(callback=callback)



@app.route(REDIRECT_URI)
@google.authorized_handler
def authorized(resp):
    access_token = resp['access_token']
    session['access_token'] = access_token, ''
    return redirect(url_for('index'))

@google.tokengetter
def get_access_token():
    return session.get('access_token')


@app.route('/getPovs', methods=['POST', 'GET'])
def povList():
    try:
        #filter based on session access_token
        userLogin = ''
        access_token = session.get('access_token')
        access_token = access_token[0]
        headers = {'Authorization': 'OAuth '+access_token}
        req = Request('https://www.googleapis.com/oauth2/v1/userinfo',
                      None, headers)
        try:
            res = urlopen(req)
            resRead = res.read()
            data = json.loads(resRead)
            userLogin = data['email']
        except URLError, e:
            session.pop('access_token', None)
            return redirect(url_for('login'))

        #povs2 = povs.query.all()
        povs2 = povs.query.filter_by(email=userLogin).all()
        povsList = []
        for pov in povs2:
            povItem = {
                    'email':pov.email,
                    'account':pov.account,
                    'sfdc':pov.sfdc,
                    'start':pov.start,
                    'enddate':pov.enddate,
                    'id':pov.get_id()
                    }
            povsList.append(povItem)
    except Exception,e:
        return str(e)
    return json.dumps(povsList)

@app.route('/getPov', methods=['POST'])
def get_pov():
    try:
        povId = request.json['id']
        pov = povs.query.get(povId)
        povItem = {
                'email':pov.email,
                'account':pov.account,
                'sfdc':pov.sfdc,
                'start':pov.start,
                'enddate':pov.enddate,
                'id':pov.get_id()
                }
        return json.dumps(povItem)
    except Exception, e:
        return jsonify(status='ERROR',message=str(e))

@app.route('/getDetails', methods=['POST'])
def get_details():
    try:
        povId = request.json['id']
        pass
    except Exception, e:
        return jsonify(status='ERROR',message=str(e))

@app.route('/add', methods=['POST'])
def pov_add():
    try:
        povInfo = request.json['info']
        povEmail = povInfo['email']
        povAccount = povInfo['account']
        povSFDC = povInfo['sfdc']
        povStartDate = povInfo['start']
        #format date strings before insert, enddate check if null
        if 'enddate' not in povInfo:
            povEndDate = ''

        else:
            povEndDate = povInfo['enddate']
            povEndDate = povEndDate[:-14]

        povStartDate = povStartDate[:-14]
        pov=povs(povEmail, povAccount, povSFDC, povStartDate, povEndDate)
        pov_add=pov.add(pov)
        povidreturn = pov.get_id()
        povreturn = { 'id' : povidreturn }
        return json.dumps(povreturn)
    except Exception, e:
        return jsonify(status='ERROR',message=str(e))

#UPDATE
@app.route('/update' , methods=['POST'])
def pov_update():
    #Check if the POV exists:
    try:
        povInfo = request.json['info']
        pov = povs.query.get(povInfo['id'])
        pov.email = povInfo['email']
        pov.account = povInfo['account']
        pov.sfdc = povInfo['sfdc']
        pov.start = povInfo['start']
        pov.enddate = povInfo['enddate']
        pov_update=pov.update()
        return jsonify(status='OK',message='updated successfully')
        #If POV.update does not return an error
    except Exception, e:
        return jsonify(status='ERROR',message=str(e))

#DELETE
@app.route('/delete' , methods=['POST'])
def pov_delete():
    try:
        povInfo = request.json['id']
        pov = povs.query.get(povInfo)
        pov_delete=pov.delete(pov)
        return jsonify(status='OK',message='deleted successfully')
        #If POV.update does not return an error
    except Exception, e:
        return jsonify(status='ERROR',message=str(e))

@app.route('/insertProducts')
def postgresInsert():
    try:
        conn = psycopg2.connect(database=postgresDatabase, user=postgresUser, host=postgresHost, port=postgresPort, password=postgresPassword)
        cursor = conn.cursor()

        #cursor.execute("SELECT email FROM Accounts WHERE email")
        #data = cur.fetchall()
        #if not data:
        #    print ('not found')
        #else:
        #    print ('found')
        add_values = ['Java APM']
        add_values2 = ['.NET APM']
        add_values3 = ['C++ APM']
        add_values4 = ['Python APM']
        add_values5 = ['GO APM']
        add_values6 = ['PHP APM']
        add_values7 = ['NodeJS APM']
        add_values8 = ['Browser RUM']
        add_values9 = ['Mobile RUM']
        add_values10 = ['Synthetic RUM']
        add_values11 = ['Database Monitoring']

        add_person = ("INSERT INTO products (name) VALUES (%s)")
        cursor.execute(add_person, add_values)
        cursor.execute(add_person, add_values2)
        cursor.execute(add_person, add_values3)
        cursor.execute(add_person, add_values4)
        cursor.execute(add_person, add_values5)
        cursor.execute(add_person, add_values6)
        cursor.execute(add_person, add_values7)
        cursor.execute(add_person, add_values8)
        cursor.execute(add_person, add_values9)
        cursor.execute(add_person, add_values10)
        cursor.execute(add_person, add_values11)

        conn.commit()
        cursor.close()
        conn.close()
        return redirect(url_for('index'))
    except (Exception, psycopg2.DatabaseError) as error:
        return jsonify(status='ERROR',message=str(error))

@app.route('/getProducts', methods=['POST','GET'])
def productList():
    try:
        #filter based on session access_token
        #povs2 = povs.query.filter_by(email='eric.johanson@appdynamics.com').all()
        products2 = products.query.all()
        productsList = []
        for product in products2:
            productItem = {
                    'name':product.name,
                    'id':product.get_id()
                    }
            productsList.append(productItem)
    except Exception,e:
        return str(e)
    return json.dumps(productsList)

#get apps from pov id, then get list of products from app
@app.route('/getApps', methods=['POST', 'GET'])
def appList():
    try:

        povId = request.json['id']
        pov = povs.query.get(povId)
        apps2 = pov.apps.all()
        appsList = []
        productList = []
        for app in apps2:
            products2 = app.products.all()
            for product3 in products2:
                productList.append(product3.name)

            appItem = {
                    'name':app.name,
                    'products':productList,
                    'id':str(app.id)
                    }
            appsList.append(appItem)
            productList = []
    except Exception,e:
        return str(e)
    return json.dumps(appsList)

@app.route('/addApp', methods=['POST'])
def addApp():
    try:
        povId = request.json['id']
        pov = povs.query.get(povId)
        appInfo = request.json['info']
        appProducts = request.json['products']
        appName = appInfo['appname']
        app = apps(appName)
        pov.apps.append(app)
        app_add = app.add(app)
        x = 0
        for product in appProducts:
            productItem = products.query.filter_by(name=product).first()
            app.products.append(productItem)
            db.session.commit()
            x = x + 1
        return jsonify(status='OK',message=str(x))
        #return jsonify(status='OK',message='App inserted successfully')
    except Exception, e:
        return jsonify(status='ERROR',message=str(e))


if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, threaded=True)


#
