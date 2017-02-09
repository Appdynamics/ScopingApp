from models import db
from models import povs


# create the database and the database table
db.create_all()

# insert recipe data
pov1 = povs('eric.johanson@appdynamics.com', 'SFDClink', 'Jan11', 'jan15')
db.session.add(pov1)

# commit the changes
db.session.commit()
