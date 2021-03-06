from flask import Flask, redirect, url_for, session, render_template, send_file, request, flash, json, jsonify
from flask_oauth import OAuth
from urllib2 import Request, urlopen, URLError

from sqlalchemy import create_engine, Column, Integer, String
from flask_sqlalchemy import SQLAlchemy
from bson import ObjectId

import pymongo
from pymongo import MongoClient

import models

from models import db, povs, apps, products, appsproducts, questions, answers, responses, answersresponses, customresponses, customanswersresponses

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
        #data = json.loads(resRead)
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


        if(userLogin == 'trabaut@appdynamics.com' or userLogin == 'dan.kowalski@appdynamics.com' or userLogin == 'frank.lamprea@appdynamics.com' or userLogin == 'steve.jenner@appdynamics.com' or userLogin == 'eric.johanson@appdynamics.com'):
            povs2 = povs.query.all()

        else:
            povs2 = povs.query.filter_by(email=userLogin).all()

        povsList = []

        for pov in povs2:
            povItem = {
                    'email':pov.email,
                    'account':pov.account,
                    'sfdc':pov.sfdc,
                    'start':pov.start,
                    'enddate':pov.enddate,
                    'targetenddate':pov.targetenddate,
                    'id':pov.get_id()
                    }
            povsList.append(povItem)
    except Exception,e:
        db.session.rollback()
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
                'targetenddate':pov.targetenddate,
                'id':pov.get_id()
                }
        return json.dumps(povItem)
    except Exception, e:
        db.session.rollback()
        return jsonify(status='ERROR',message=str(e))

@app.route('/getUser', methods=['GET'])
def get_user():
    try:
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

        povsList = []
        povItem = { 'user':userLogin }
        povsList.append(povItem)
        return json.dumps(povsList)
    except Exception as e:
        return jsonify('ERROR', message=str(e))


@app.route('/add', methods=['POST'])
def pov_add():
    try:
        povInfo = request.json['info']
        povEmail2 = request.json['email']
        povEmail = povEmail2['info']
        povAccount = povInfo['account']
        povSFDC = povInfo['sfdc']
        povStartDate = povInfo['start']
        povTargetEndDate = povInfo['targetenddate']
        #format date strings before insert, enddate check if null
        if 'enddate' not in povInfo:
            povEndDate = ''

        else:
            povEndDate = povInfo['enddate']
            povEndDate = povEndDate[:-14]

        povStartDate = povStartDate[:-14]
        povTargetEndDate = povTargetEndDate[:-14]
        pov=povs(povEmail, povAccount, povSFDC, povStartDate, povEndDate, povTargetEndDate)
        pov_add=pov.add(pov)
        povidreturn = pov.get_id()
        povreturn = { 'id' : povidreturn }
        return json.dumps(povreturn)
    except Exception, e:
        db.session.rollback()
        return jsonify(status='ERROR',message=str(e))

#UPDATE
@app.route('/update' , methods=['POST'])
def pov_update():
    #Check if the POV exists:
    try:
        povInfo = request.json['info']
        pov = povs.query.get(povInfo['id'])
        fixStartDate = povInfo['start']
        fixEndDate = povInfo['enddate']
        fixTargetEndDate = povInfo['targetenddate']
        pov.email = povInfo['email']
        pov.account = povInfo['account']
        pov.sfdc = povInfo['sfdc']
        pov.start = fixStartDate[:-14]
        pov.enddate = fixEndDate[:-14]
        pov.targetenddate = fixTargetEndDate[:-14]
        pov_update=pov.update()
        return jsonify(status='OK',message='updated successfully')
        #If POV.update does not return an error
    except Exception, e:
        db.session.rollback()
        return jsonify(status='ERROR',message=str(e))

#DELETE
@app.route('/delete' , methods=['POST'])
def pov_delete():
    try:
        povInfo = request.json['id']
        pov1 = povs.query.get(povInfo)
        for app in pov1.apps:
            appInfo = app.get_id()

            results = db.responsedata.delete_many({'appid' : appInfo})
            results2 = db.notesdata.delete_many({'appid' : appInfo})
            appy = apps.query.get(appInfo)
            app_delete=appy.delete(appy)

        pov_delete=pov.delete(pov)
        return jsonify(status='OK',message='deleted successfully')
        #If POV.update does not return an error
    except Exception, e:
        db.session.rollback()
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
        add_values10 = ['Synthetics']
        add_values11 = ['Database Monitoring']

        add_values12 = ['Supported!']
        add_values13 = ['Not Supported!']
        add_values14 = ['4.4 Release']
        add_values15 = ['Other']
        add_values16 = ['Terminate']
        add_values17 = ['Follow Up']
        add_values18 = ['Low Risk']
        add_values19 = ['Medium Risk']
        add_values20 = ['High Risk']

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

        add_person2 = ("INSERT INTO responses (subject) VALUES (%s)")
        cursor.execute(add_person2, add_values12)
        cursor.execute(add_person2, add_values13)
        cursor.execute(add_person2, add_values14)
        cursor.execute(add_person2, add_values15)
        cursor.execute(add_person2, add_values16)
        cursor.execute(add_person2, add_values17)
        cursor.execute(add_person2, add_values18)
        cursor.execute(add_person2, add_values19)
        cursor.execute(add_person2, add_values20)


        conn.commit()
        cursor.close()
        conn.close()
        return jsonify(status='OK',message=str('Insert ok'))
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
        db.session.rollback()
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
                    'appname':app.name,
                    'products':productList,
                    'id':str(app.id)
                    }
            appsList.append(appItem)
            productList = []
    except Exception,e:
        db.session.rollback()
        return str(e)
    return json.dumps(appsList)

@app.route('/api/getApp', methods=['POST'])
def getApp():
    try:
        client = MongoClient('mongodb://mongo-data:27017/')
        db = client.AppDynamicsMongo
        appId = request.json['id']
        appy = apps.query.get(appId)
        products2 = appy.products.all()
        productList = []
        notesInfo = ""
        for product3 in products2:
            productList.append(product3.name)

        for doc in db.notesdata.find({'appid': appId}):
            if(doc):
                notesInfo = doc['NotesInfo']
            else:
                notesInfo = []

        appItem = {
                'appname':appy.name,
                'products':productList,
                'notes': notesInfo,
                'id':str(appy.id)
                }
        return json.dumps(appItem)
    except Exception, e:
        return jsonify(status='ERROR',message=str(e))

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

        appidlist = { 'appid' : str(app.id)}
        return json.dumps(appidlist)
        #return jsonify(status='OK',message='App inserted successfully')
    except Exception, e:
        db.session.rollback()
        return jsonify(status='ERROR',message=str(e))

#need to make sure no memory leak if completed sequence then updated app
@app.route('/updateApp' , methods=['POST'])
def app_update():
    #Check if the POV exists:
    try:
        appInfo = request.json['info']
        appProducts = request.json['products']

        appName = appInfo['appname']
        appz = apps.query.get(appInfo['id'])

        #appProducts = appProductCheck['products']

        appz.name = appName
        appz.products = []
        db.session.commit()

        #for product in productList:
            #appz.products.remove(product)
            #db.session.commit()

        for product in appProducts:
            productItem = products.query.filter_by(name=product).first()
            appz.products.append(productItem)
            db.session.commit()

        #will also need to get the products
        app_update=appz.update()
        return jsonify(status='OK',message='updated successfully')

    except Exception, e:
        return jsonify(status='ERROR',message=str(e))

#DELETE App also need to delete the data in mongo associated with the app
@app.route('/deleteApp' , methods=['POST'])
def app_delete():
    try:
        client = MongoClient('mongodb://mongo-data:27017/')
        db = client.AppDynamicsMongo
        appInfo = request.json['id']
        results = db.responsedata.delete_many({'appid' : appInfo})
        results2 = db.notesdata.delete_many({'appid' : appInfo})
        appy = apps.query.get(appInfo)
        app_delete=appy.delete(appy)
        return jsonify(status='OK',message='app deleted successfully')
        #If POV.update does not return an error
    except Exception, e:
        return jsonify(status='ERROR',message=str(e))

@app.route('/createMongo', methods=['GET'])
def qualifyQuestions():
    try:
        client = MongoClient('mongodb://mongo-data:27017/')
        db = client.AppDynamicsMongo
        return redirect(url_for('index'))
    except Exception as e:
        return jsonify(status='ERROR',message=str(e))

@app.route('/addSequence', methods=['POST'])
def addSequence():
    try:
        sequenceInfo = request.json['info']
        answersInfo = request.json['answers']
        productInfo = request.json['language']

        questionInfo = sequenceInfo['question']


        productQuestion = products.query.filter_by(name=productInfo).first()

        question = questions(questionInfo)
        productQuestion.questions.append(question)
        question_add = question.add(question)

        #if response does't exist insert into custom response
        for ans in answersInfo:
            answerInfoInsert = ans['name']
            responseInfo = ans['subject']
            answer = answers(answerInfoInsert)
            question.answers.append(answer)
            answer_add = answer.add(answer)
            response = responses.query.filter_by(subject=responseInfo).first()
            if not response:
                customResponseOne = customresponses(responseInfo)
                answer.customresponses.append(customResponseOne)
                customAdd = customResponseOne.add(customResponseOne)
                db.session.commit()
            else:
                answer.responses.append(response)
                db.session.commit()


        return jsonify(status='OK',message='Inserted Sequence successfully')
    except Exception as e:
        return jsonify(status='ERROR',message=str(e))

@app.route('/addLogicSequence', methods=['POST'])
def addLogicSequence():
    try:
        client = MongoClient('mongodb://mongo-data:27017/')
        db = client.AppDynamicsMongo
        answers = []
        responses = []
        parent = []
        child = []
        followUpArray = []
        setChild = False
        parentId = ''
        key = ''

        sequenceInfo = request.json['info']
        answersInfo = request.json['answers']
        productInfo = request.json['language']
        questionInfo = sequenceInfo['question']

        if request.json['parent'] == '':
            parent = []
        else:
            setChild = True
            parentId = request.json['parent']
            key = request.json['key']
            parent.append(parentId)


        for ans in answersInfo:
            answerInfoInsert = ans['name']
            responseInfo = ans['subject']
            answers.append(answerInfoInsert)
            responses.append(responseInfo)
            if(responseInfo == 'Follow Up'):
                followUpArray.append(answerInfoInsert)



        LogicData = db.logicsequencedata
        returnid = LogicData.insert_one(
        {
        "question": questionInfo,
        "language": productInfo,
        "key": key,
        "answers": answers,
        "responses": responses,
        "parent": parent,
        "child": child
        })

        #if there is a parent then we need to set the parents child
        if setChild == True:
            parentToObject = ObjectId(parentId)
            newChildarray = []
            doc = db.logicsequencedata.find_one({'_id': parentToObject})
            newChildarray = doc["child"]
            newChildarray.append(str(returnid.inserted_id))
            db.logicsequencedata.update_one(
            {"_id": parentToObject},
            {"$set": {"child" : newChildarray}}
            )



        returnItem = {
        'answerstofollow': followUpArray,
        'parentid': str(returnid.inserted_id)
        }

        return json.dumps(returnItem)
    except Exception as e:
        return jsonify(status='ERROR',message=str(e))

@app.route('/api/getLogicSequences', methods=['GET'])
def getLogicSequences():
    try:
        #this will take a variable and filter by that
        client = MongoClient('mongodb://mongo-data:27017/')
        db = client.AppDynamicsMongo
        filterbylanguage = request.args.get('language')
        sequenceList = []
        for doc in db.logicsequencedata.find({'language' : filterbylanguage}):
            answerList = []
            responseList = []
            answerQuestions = doc['answers']
            responseQuestions = doc['responses']
            for answer in answerQuestions:
                answerList.append(answer)

            for response in responseQuestions:
                responseList.append(response)


            sequenceItem = {
            'question' : doc['question'],
            'key' : doc['key'],
            'answers' : answerList,
            'responses' : responseList
            }
            sequenceList.append(sequenceItem)
    except Exception as e:
        return jsonify(status='ERROR',message=str(e))
    return json.dumps(sequenceList)

#if they change the question then this won't work
@app.route('/updateSequence', methods=['POST'])
def updateSequence():
    try:
        client = MongoClient('mongodb://mongo-data:27017/')
        db = client.AppDynamicsMongo
        sequenceInfo = request.json['info']
        answersInfo = request.json['answers']
        productInfo = request.json['language']

        questionInfo = sequenceInfo['question']

        answers = []
        responses = []

        for ans in answersInfo:
            answerInfoInsert = ans['name']
            responseInfo = ans['subject']
            answers.append(answerInfoInsert)
            responses.append(responseInfo)


        result = db.logicsequencedata.find_one({"language" : productInfo, "question" : questionInfo})

        if(result['key'] != ''):
            resul2 = db.logicsequencedata.update_one({"language" : productInfo, "question" : questionInfo},
            {"$set": {"answers" : answers, "responses" : responses}})

        return jsonify(status='OK',message='Update Sequence successfully')
    except Exception as e:
        return jsonify(status='ERROR',message=str(e))

@app.route('/deleteSequence', methods=['POST'])
def deleteSequence():
    try:
        client = MongoClient('mongodb://mongo-data:27017/')
        db = client.AppDynamicsMongo
        languageInfo = request.json['language']
        questionInfo = request.json['info']
        resultList = []

        result = db.logicsequencedata.find_one({"language" : languageInfo, "question" : questionInfo})
        if(result['parent'] == []):
            for child in result['child']:
                stringToObject = ObjectId(child)
                resultDelete = db.logicsequencedata.delete_one({"_id" : stringToObject})
            parentDelete = db.logicsequencedata.delete_one({"_id" : result['_id']})
        else:
            parentCheck = result['parent'][0]
            parentObject = ObjectId(parentCheck)
            parent2 = db.logicsequencedata.find_one({"_id" : parentObject})
            for child in parent2['child']:
                stringToObject = ObjectId(child)
                resultDelete = db.logicsequencedata.delete_one({"_id" : stringToObject})
            parentDelete = db.logicsequencedata.delete_one({"_id" : parent2['_id']})

        return jsonify(status='OK',message='Question deleted successfully')
    except Exception as e:
        return jsonify(status='ERROR',message=str(e))

@app.route('/api/getSequences', methods=['POST'])
def getSequences():
    try:
        #this will take a variable and filter by that
        filterbylanguage = request.json['language']
        languageSequence = products.query.filter_by(name=filterbylanguage).first()
        languageQuestion = questions.query.filter_by(product_id=languageSequence.get_id()).all()
        sequenceList = []
        for question in languageQuestion:
            answerList = []
            responseList = []
            answerQuestions = question.answers.all()
            for answer in answerQuestions:
                responseToAnswer = answer.responses.all()
                if(responseToAnswer):
                    answerList.append(answer.answerQuestion)
                    for singleResponse in responseToAnswer:
                        responseList.append(singleResponse.subject)
                else:
                    answerList.append(answer.answerQuestion)
                    responseToAnswer = answer.customresponses.all()
                    for singleResponse in responseToAnswer:
                        responseList.append(singleResponse.subject)

            sequenceItem = {
            'question' : question.subject,
            'answers' : answerList,
            'responses' : responseList
            }
            answerList = []
            sequenceList.append(sequenceItem)
    except Exception as e:
        return jsonify(status='ERROR',message=str(e))
    return json.dumps(sequenceList)

@app.route('/api/getResponses', methods=['POST','GET'])
def getResponses():
    try:
        #filter based on session access_token
        #povs2 = povs.query.filter_by(email='eric.johanson@appdynamics.com').all()
        responses2 = responses.query.all()
        responsesList = []
        for response in responses2:
            responseItem = {
                    'name':response.subject,
                    'id':response.get_id()
                    }
            responsesList.append(responseItem)
    except Exception,e:
        return str(e)
    return json.dumps(responsesList)

@app.route('/api/addResponses', methods=['POST'])
def addResponses():
    try:
        client = MongoClient('mongodb://mongo-data:27017/')
        db = client.AppDynamicsMongo
        appId = request.json['id']
        productName = request.json['language']
        userResponses = request.json['responses']
        questions = request.json['questions']
        UserData = db.responsedata
        UserData.insert_one(
        {
        "appid": appId,
        "productName": productName,
        "userResponses": userResponses,
        "questions": questions
        })
        return jsonify(status='OK',message='Inserted Responses successfully')
    except Exception as e:
        return jsonify(status='OK',message=str(e))

@app.route('/api/getUserResponses', methods=['POST'])
def getUserResponses():
    try:
        client = MongoClient('mongodb://mongo-data:27017/')
        db = client.AppDynamicsMongo
        appId = request.json['id']
        responseList = []
        arrayofsupport = []
        support = []
        totalQuestions = []
        for doc in db.responsedata.find({'appid': appId}):
            responses = doc['userResponses']
            language = doc['productName']
            totalQuestions = doc['questions']
            for ans in responses:
                for singleAnswer in ans:
                    for doc2 in db.logicsequencedata.find({'language' : language}):
                        count = 0
                        checkAnswers = doc2['answers']
                        feedback = doc2['responses']
                        questionCheck = doc2['question']
                        for check in checkAnswers:
                            if(check == singleAnswer):
                                sup = feedback[count]
                                if(sup == 'Follow Up' or sup == 'Terminate'):
                                    sup = "N/A"
                                support.append(sup)
                                count = 0
                            else:
                                count = count + 1




                arrayofsupport.append(support)
                support = []


            responseList.append({'appid' : doc['appid'], 'productName' : doc['productName'], 'userResponses': doc['userResponses'], 'userFeedback' : arrayofsupport, 'languageQuestions' : totalQuestions})
            arrayofsupport = []
            support = []
            totalQuestions = []

    except Exception as e:
        return jsonify(status='OK',message=str(e))
    return json.dumps(responseList)

@app.route('/old/api/getUserResponses', methods=['POST'])
def oldgetUserResponses():
    try:
        client = MongoClient('mongodb://mongo-data:27017/')
        countten = 0
        db = client.AppDynamicsMongo
        appId = request.json['id']
        responsesList = []
        arrayofsupport = []
        support = []
        totalQuestions = []
        for doc in db.responsedata.find({'appid': appId}):
            getAnswerResponses = doc['userResponses']
            language = doc['productName']
            languageSequence = products.query.filter_by(name=language).first()
            languageQuestion = questions.query.filter_by(product_id=languageSequence.get_id()).all()
            for ans in getAnswerResponses:
                countten = countten + 1
                for singleAnswer in ans:
                    check = answers.query.filter_by(answerQuestion=singleAnswer).first()
                    if(check):
                        checkResponse = check.responses.all()
                        if(checkResponse):
                            for singleResponse in checkResponse:
                                support.append(singleResponse.subject)
                        else:
                            checkResponse = check.customresponses.all()
                            for singleResponse in checkResponse:
                                support.append(singleResponse.subject)


                arrayofsupport.append(support)
                support = []

            for question in languageQuestion:
                totalQuestions.append(question.subject)




            responsesList.append({'appid' : doc['appid'], 'productName' : doc['productName'], 'userResponses' : doc['userResponses'], 'userFeedback' : arrayofsupport, 'languageQuestions' : totalQuestions})
            support = []
            arrayofsupport = []
            totalQuestions = []
            countten = 0

    except Exception as e:
        return jsonify(status='OK',message=str(e))
    return json.dumps(responsesList)

@app.route('/saveNotes', methods=['POST'])
def saveNotes():
    try:
        client = MongoClient('mongodb://mongo-data:27017/')
        db = client.AppDynamicsMongo
        appId = request.json['id']
        notesInfo = request.json['info']
        NotesData = db.notesdata
        NotesData.insert_one(
        {
        "appid": appId,
        "NotesInfo": notesInfo
        })
        return jsonify(status='OK',message='Inserted Notes successfully')
    except Exception as e:
        return jsonify(status='OK',message=str(e))

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, threaded=True)


#
