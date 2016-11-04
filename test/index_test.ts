import mocha = require('mocha')
import chai = require('chai')
const expect = chai.expect


describe('describe', () => {
  context('context', () => {
    it('should..', () => {
      expect(1).to.eql(1)
    })
  })
})
