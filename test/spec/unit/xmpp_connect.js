var xmpp = require('node-xmpp');
var assert = require('assert');
var _ = require('underscore');
var xmpp_config = require('../../xmpp_config');
var Otr = require('../../../lib/node-otr-native');
var dh_commit_base64_wrapper;

describe("client", function() {
  var cl = new xmpp.Client({
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
  
  describe('node-otr-native', function(){
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

    it('should parse dh commit', function(){
      var otr = new Otr();
      otr.dh_commit_recv(dh_commit_base64_wrapper);
      console.log(otr);
    });
  });
});
 
