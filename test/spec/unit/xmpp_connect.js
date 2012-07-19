var xmpp = require('node-xmpp');
var assert = require('assert');
var _ = require('underscore');
var xmpp_config = require('../../xmpp_config');
//var otr = require('../../../lib/node-otr-native');

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
      var otr_wrapper_pattern = /(\?OTR:)(.+)(\.)/;
      var matches = dh_commit_base64_wrapper.match(otr_wrapper_pattern);
      var dh_commit_base64 = matches[2];
      var dh_commit_buff = new Buffer(dh_commit_base64, "base64");
      var dh_commit_hash = {};
      dh_commit_hash['version'] = dh_commit_buff.slice(0,2);
      dh_commit_hash['type'] = dh_commit_buff.slice(2,3);
      dh_commit_hash['gxmpi_size'] = dh_commit_buff.slice(3,7);
      var gxmpi_size = dh_commit_hash['gxmpi_size'].readUInt32BE(0);
      var gxmpi_end_offset = gxmpi_size + 7;
      dh_commit_hash['gxmpi_enc'] = dh_commit_buff.slice(7, gxmpi_end_offset);
      var gxmpi_end_size_hash_offset = gxmpi_end_offset + 4;
      dh_commit_hash['gxmpi_hash_size'] = dh_commit_buff.slice(gxmpi_end_offset, gxmpi_end_size_hash_offset);
      var gxmpi_hash_size = dh_commit_hash['gxmpi_hash_size'].readUInt32BE(0);
      var gxmpi_end_hash_offset = gxmpi_end_size_hash_offset + gxmpi_hash_size;
      dh_commit_hash['gxmpi_hash'] = dh_commit_buff.slice(gxmpi_end_size_hash_offset, gxmpi_end_hash_offset);
      console.log(dh_commit_hash);
    });
  });
});
 
