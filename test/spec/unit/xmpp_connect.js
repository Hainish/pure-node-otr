var xmpp = require('node-xmpp');
var assert = require('assert');
var _ = require('underscore');
var xmpp_config = require('../../xmpp_config');

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

  it('should receive dh upon sending a message to recipient', function(done){
    cl.send(new xmpp.Element('presence', { }).c('show').t('chat').up().c('status').t('node-xmpp otr test'));
    setTimeout(function(){
      cl.send(new xmpp.Element('message', { to: xmpp_config.interlocutor, type: 'chat'}).c('body').t('testing ?OTR?v2? one'));
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
            var dh = child.children[0];
            done();
          }
      });

      }
    });
  });
  
});
 
