var xmpp = require('node-xmpp');
var assert = require('assert');
var _ = require('underscore');
var xmpp_config = require('../../xmpp_config');
var Otr = require('../../../lib/node-otr-native');
var dh_commit_base64_wrapper;
var cl;

if(config.xmpp_dev == true){
  describe("client", function() {
    cl = new xmpp.Client({
      jid: xmpp_config.client.jid,
      password: xmpp_config.client.password,
      host: xmpp_config.client.host,
      port: xmpp_config.client.port
    });
    
    it('should go online', function(done){
      cl.on('online', function(){
        assert.ok(true, 'client went online');
        done();
      });
      cl.on('error', function(e){
        console.log(e);
        assert.fail(true, 'there was an error connecting: '+e);
        done();
      });
    });

    it('should receive dh upon sending a message to recipient', function(done){
      cl.send(new xmpp.Element('presence', { }).c('show').t('chat').up().c('status').t('node-xmpp otr test'));
      setTimeout(function(){
        cl.send(new xmpp.Element('message', { to: xmpp_config.interlocutor, type: 'chat'}).c('body').t('?OTR?v2?'));
        cl.on('error', function(e){
          assert.fail(true, 'unable to send a message to recipient: '+e);
          done();
        });
      }, 0);
      cl.on('stanza', function(stanza){
        if(stanza.name == "message"){
          _.each(stanza.children, function(child){
            if(child.name == "body"){
              assert.ok(true, 'got a dh response from recipient');
              dh_commit_base64_wrapper = child.children[0];
              done();
            }
          });
        }
      });
    });
  });
}
  
describe('node-otr-native', function(){
  it('should parse dh commit', function(){
    dh_commit_base64_wrapper = "?OTR:AAICAAAAxNyJFLZknz8c0F98r6MH3Dr2GrMCuvp0DqfU1tA8BALSaj12ksOEBm2RstSeZ/R7ZOgOJzsOjIGrA7ygn5UHLu1h4RG0koRa04WSQs5vFCC2V1S2RU7u/JAQlBY262fLJIGw2/EbuLY5twb92TKOd/cj6AIEQxMdCelaSHG0NcIZWJH61FyfNRWyVRNWtKG50z0BpPX9swO+18wVV1hnK9AGbWiEJ/elHcmq10Izov+1DD7+zFis36e2zx/filaeRLW1fi4AAAAgChOq6J9QmqzmV6oGhHep2/7PQUYrKwe8syPSM7jg4nE=.";
    var otr = new Otr();
    otr.dh_commit_parse(dh_commit_base64_wrapper);
    console.log(otr.dh_key_gen());
  });
});
 
