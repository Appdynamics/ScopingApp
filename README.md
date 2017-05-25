#ScopingApp
POV Scoping App

#Starting The App
If you wish to spin up your own databases, comment out the volume mounts. from
there just type docker-compose up. In a seperate terminal type
 docker exec -it <scoping container> bash. From there cd into the scoping app
 and run python models db init, python models.py db migrate, python models.py upgrade
 . This will create the tables. Then point the URL to /insertProducts and then to
 /createMongo to create the mongo db and insert set values into responses/products.
