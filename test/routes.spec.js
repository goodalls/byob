/* eslint-disable-next-line */
const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require('chai-http');
const server = require('../server');
const jwt = require('jsonwebtoken')
const environment = process.env.NODE_ENV || 'test';
const configuration = require('../knexfile')[environment];
const db = require('knex')(configuration);

chai.use(chaiHttp);

// beforeEach(done => {
//   database.migrate.rollback().then(() => {
//     database.migrate.latest().then(() => {
//       return database.seed.run().then(() => {
//         done();
//       });
//     });
//   });
// });

describe('Client Routes', () => {
  beforeEach(done => {
    db.migrate.rollback().then(() => {
      db.migrate.latest().then(() => {
        return db.seed.run().then(() => {
          done();
        });
      });
    });
  });

  it('should return 404', () => {
    return chai
      .request(server)
      .get('/sad')
      .then(response => {
        response.should.have.status(404);
      })
      .catch(error => {
        throw error;
      });
  });
});

describe('API ROUTES', () => {
  
  const token = jwt.sign({ email: 'test@turing.io', app_name: 'test App' }, process.env.SECRET_KEY, {expiresIn: '48h'});

  beforeEach(done => {
    db.migrate.rollback().then(() => {
      db.migrate.latest().then(() => {
        return db.seed.run().then(() => {
          done();
        });
      });
    });

  });

  describe('GET /api/v1/groups', () => {
    it('should return all groups', () => {
      return chai
        .request(server)
        .get('/api/v1/groups/')
        .then(response => {
          expect(response).to.have.status(200);
          expect(response.body).to.be.a('array');
          expect(response.body[0]).to.have.property('id');
          expect(response.body[0]).to.have.property('group');
          expect(response.body[0]).to.have.property('gender');
          expect(response.body[0]).to.have.property('age');
          expect(response.body[0]).to.have.property('ethnicity');
        })
        .catch(error => {
          throw error;
        });
    });

    it('should return individual groups by id', () => {
      return chai
        .request(server)
        .get('/api/v1/groups/1')
        .then(response => {
          expect(response).to.have.status(200);
          expect(response.body).to.be.a('array');
          expect(response).to.be.json;
          expect(response.body[0].id).to.equal(1);
          expect(response.body[0].group).to.equal(
            'White, non-Hispanic, Female'
          );
          expect(response.body[0].gender).to.equal('Female');
          expect(response.body[0].age).to.equal('Ages 18-19');
          expect(response.body[0].ethnicity).to.equal('White, non-Hispanic');
        });
    });

    it('should return 404 if id does not exist', () => {
      return chai
        .request(server)
        .get('/api/v1/groups/1000')
        .then(response => {
          expect(response).to.have.status(404);
        });
    });
  });

  describe('POST /api/v1/groups', () => {
    it('should post a new group that has complete params', () => {
      return chai
        .request(server)
        .post('/api/v1/groups')
        .send({
          group: 'test group',
          ethnicity: 'test ethnicity',
          gender: 'test gender',
          age: 'test age',
          token
        })
        .then(response => {
          response.should.have.status(201);
          response.body.should.be.a('object');
          response.body.should.have.property('id');
          response.body.id.should.equal(3);
        })
        .catch(err => {
          throw err;
        });
    });

    it('should not create a new group if called with incorrect params', () => {
      return chai
        .request(server)
        .post('/api/v1/groups')
        .send({
          group: 'test group',
          ethnicity: 'test ethnicity',
          age: 'test age',
          token
        })
        .then(response => {
          response.should.have.status(422);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.error.should.equal(
            `Expected format: { group: <string>, ethnicity: <string>, gender: <string>, age: <string> } You're missing a "gender" property`
          );
        })
        .catch(err => {
          throw err;
        });
    });

  });

  describe('PATCH /api/v1/groups/:id', () => {
    it('should update the expected group', () => {
      return chai
        .request(server)
        .patch('/api/v1/groups/1')
        .send({ age: 'test', token })
        .then(response => {
          response.should.have.status(200);
          expect(response.body).to.equal('Record successfully updated');
        });
    });

    it('should return 422 if no record was updated', () => {
      return chai
        .request(server)
        .patch('/api/v1/groups/999')
        .send({ age: 'test2', token })
        .then(response => {
          response.should.have.status(422);
          expect(response.body.error).to.equal('unable to update item');
        });
    });
    
    it('should return 403 when not passed a token', () => {
      return chai
        .request(server)
        .patch('/api/v1/groups/1')
        .send({ age: 'test2' })
        .then(response => {
          response.should.have.status(403);
          response.body.should.be.a('object');
          response.body.error.should.equal('request must contain a valid token')
        })
        .catch(err => {
          throw err;
        });
    })

    it('should return 403 when passed an invalid token', () => {
      return chai
        .request(server)
        .patch('/api/v1/groups/1')
        .send({ age: 'test2', token: 'test.test.test' })
        .then(response => {
          response.should.have.status(403);
          response.body.should.be.a('object');
          response.body.error.should.equal('invalid token')
        })
        .catch(err => {
          throw err;
        });
    })
  });
  
  describe('DELETE /api/v1/groups/:id', () => {
    it('should delete a group', () => {
      return chai
        .request(server)
        .delete('/api/v1/groups/1')
        .send({token})
        .then(response => {
          expect(response).to.have.status(200);
          expect(response.body).to.equal(1);
        });
    });

    it('should return 404 if delete group incorrect', () => {
      return chai
        .request(server)
        .delete('/api/v1/groups/2500')
        .send({token})
        .then(response => {
          expect(response).to.have.status(404);
        });
    });

    it('should return 403 when not passed a token', () => {
      return chai
        .request(server)
        .delete('/api/v1/groups/1')
        .send({})
        .then(response => {
          response.should.have.status(403);
          response.body.should.be.a('object');
          response.body.error.should.equal('request must contain a valid token')
        })
        .catch(err => {
          throw err;
        });
    })

    it('should return 403 when passed an invalid token', () => {
      return chai
        .request(server)
        .delete('/api/v1/groups/1')
        .send({ token: 'test.test.test' })
        .then(response => {
          response.should.have.status(403);
          response.body.should.be.a('object');
          response.body.error.should.equal('invalid token')
        })
        .catch(err => {
          throw err;
        })
    })
  })
  describe('GET /api/v1/years', () => {
    it('should return all years', () => {
      return chai
        .request(server)
        .get('/api/v1/years/')
        .then(response => {
          response.should.have.status(200);
          response.body.should.be.a('array');
          expect(response.body[0]).to.have.property('id');
          expect(response.body[0]).to.have.property('unemployment_score');
          expect(response.body[0]).to.have.property('year');
          expect(response.body[0]).to.have.property('group_id');
        })
        .catch(error => {
          throw error;
        });
    });

    it('should return all years for a requested group_id', () => {
      return chai
        .request(server)
        .get('/api/v1/years?group_id=1')
        .then(response => {
          response.should.have.status(200);
          response.body.should.be.a('array');
          expect(response.body[0]).to.have.property('id');
          expect(response.body[0]).to.have.property('unemployment_score');
          expect(response.body[0]).to.have.property('year');
          expect(response.body[0]).to.have.property('group_id');
          expect(response.body[0].group_id).to.equal(1);
          expect(response.body.length).to.equal(68);
        })
        .catch(error => {
          throw error
        })
    })

    it('should return 404 if years do not exist for requested group_id', () => {
      return chai
        .request(server)
        .get('/api/v1/years?group_id=1000')
        .then(response => {
          expect(response).to.have.status(404);
        });
    });

  });

  describe('GET /api/v1/years/:id', () => {
    it('should return individual years by id', () => {
      return chai
        .request(server)
        .get('/api/v1/years/1')
        .then(response => {
          expect(response).to.have.status(200);
          expect(response.body).to.be.a('array');
          expect(response).to.be.json;
          expect(response.body[0].id).to.equal(1);
          expect(response.body[0].unemployment_score).to.equal('13');
          expect(response.body[0].year).to.equal('1980');
          expect(response.body[0].group_id).to.equal(1);
        });
    });

    it('should return 404 if id does not exist', () => {
      return chai
        .request(server)
        .get('/api/v1/years/1000')
        .then(response => {
          expect(response).to.have.status(404);
        });
    });
  });

  describe('POST /api/v1/years', () => {
    it('should post a new year to a group that has complete params', () => {
      return chai
        .request(server)
        .post('/api/v1/years')
        .send({
          year: '3000',
          group_id: '1',
          unemployment_score: '100%',
          token
        })
        .then(response => {
          response.should.have.status(201);
          response.body.should.be.a('object');
          response.body.should.have.property('id');
          response.body.id.should.equal(137);
        })
        .catch(err => {
          throw err;
        });
    });

    it('should not create a new year if called with incorrect params', () => {
      return chai
        .request(server)
        .post('/api/v1/years')
        .send({
          group_id: '1',
          unemployment_score: '100%',
          token
        })
        .then(response => {
          response.should.have.status(422);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.error.should.equal(
            `Expected format: { year: <string>, group_id: <string>, unemployment_score: <string> } You're missing a "year" property`
          );
        })
        .catch(err => {
          throw err;
        });
    });

    it('should return 403 when passed an invalid token', () => {
      return chai
        .request(server)
        .patch('/api/v1/years/1')
        .send({
          group_id: '1',
          unemployment_score: '100%',
          token: 'test.test.test'
        })
        .then(response => {
          response.should.have.status(403);
          response.body.should.be.a('object');
          response.body.error.should.equal('invalid token')
        })
        .catch(err => {
          throw err;
        })
    });

  });

  describe('PATCH /api/v1/years/:id', () => {
    it('should update the expected group', () => {
      return chai
        .request(server)
        .patch('/api/v1/years/1')
        .send({ unemployment_score: 'test', token })
        .then(response => {
          response.should.have.status(200);
          expect(response.body).to.equal('Record successfully updated');
        });
    });

    it('should return 422 if no record was updated', () => {
      return chai
        .request(server)
        .patch('/api/v1/years/9999')
        .send({ unemployment_score: 'test2', token })
        .then(response => {
          response.should.have.status(422);
          expect(response.body.error).to.equal('unable to update item');
        });
    });

    it('should return 403 when not passed a token', () => {
      return chai
        .request(server)
        .patch('/api/v1/years/1')
        .send({ age: 'test2' })
        .then(response => {
          response.should.have.status(403);
          response.body.should.be.a('object');
          response.body.error.should.equal('request must contain a valid token')
        })
        .catch(err => {
          throw err;
        });
    })

    it('should return 403 when passed an invalid token', () => {
      return chai
        .request(server)
        .patch('/api/v1/years/1')
        .send({ age: 'test2', token: 'test.test.test' })
        .then(response => {
          response.should.have.status(403);
          response.body.should.be.a('object');
          response.body.error.should.equal('invalid token')
        })
        .catch(err => {
          throw err;
        })
    })
  });

  describe('DELETE /api/v1/years/:id', () => {
    it('should delete a year', () => {
      return chai
        .request(server)
        .delete('/api/v1/years/1')
        .send({token})
        .then(response => {
          expect(response).to.have.status(200);
          expect(response.body).to.equal(1);
        });
    });

    it('should return 404 if delete year incorrect', () => {
      return chai
        .request(server)
        .delete('/api/v1/years/2500')
        .send({token})
        .then(response => {
          expect(response).to.have.status(404);
        });
    });  

    it('should return 403 when not passed a token', () => {
      return chai
        .request(server)
        .delete('/api/v1/years/10')
        .send({})
        .then(response => {
          response.should.have.status(403);
          response.body.should.be.a('object');
          response.body.error.should.equal('request must contain a valid token')
        })
        .catch(err => {
          throw err;
        });
    })

    it('should return 403 when passed an invalid token', () => {
      return chai
        .request(server)
        .delete('/api/v1/years/10')
        .send({ token: 'test.test.test' })
        .then(response => {
          response.should.have.status(403);
          response.body.should.be.a('object');
          response.body.error.should.equal('invalid token')
        })
        .catch(err => {
          throw err;
        })
    })
  });

  describe('POST /authorize', () => {
    it('should respond with the JWT when passed the expected params', () => {
      return chai
        .request(server)
        .post('/authorize')
        .send({ app_name: 'test project', email: 'test@turing.io' })
        .then( response => {
          response.should.have.status(201)
          response.body.should.be.a('object')
          response.body.token.should.be.a('string')
        })
        .catch( err => {
          throw err;
        })
    })

    it('should respond with 404 if not passed a valid email', () => {
      return chai
        .request(server)
        .post('/authorize')
        .send({ app_name: 'test project', email: 'test@notturing.io' })
        .then( response => {
          response.should.have.status(404)
          response.body.should.be.a('object')
          response.body.error.should.equal('not valid')
        })
        .catch( err => {
          throw err;
        })
    })
  })
});
