var xmpp = require('node-xmpp');
var assert = require('assert');
var _ = require('underscore');
var xmpp_config = require('../../xmpp_config');
var Otr = require('../../../lib/pure-node-otr');
var dh_commit_base64_wrapper, dh_key_base64_wrapper, reveal_sig_base64_wrapper;
var cl;
var otr;

if(xmpp_config.xmpp_dev == true){
  describe("client", function() {
    cl = new xmpp.Client({
      jid: xmpp_config.client.jid,
      password: xmpp_config.client.password,
      host: xmpp_config.client.host,
      port: xmpp_config.client.port
    });
    
    it('should go online', function(done){
      cl.on('online', function(){
        assert(true, 'client went online');
        done();
      });
      cl.on('error', function(e){
        console.log(e);
        assert(false, 'there was an error connecting: '+e);
        done();
      });
    });

    it('should receive dh upon sending a message to recipient', function(done){
      cl.send(new xmpp.Element('presence', { }).c('show').t('chat').up().c('status').t('node-xmpp otr test'));
      cl.send(new xmpp.Element('message', { to: xmpp_config.interlocutor, type: 'chat'}).c('body').t('?OTR?v2?'));
      cl.on('error', function(e){
        assert(false, 'unable to send a message to recipient: '+e);
        done();
      });
      cl.on('stanza', function(stanza){
        if(stanza.name == "message"){
          _.each(stanza.children, function(child){
            if(child.name == "body"){
              cl.removeAllListeners('stanza');
              assert(true, 'got a dh response from recipient');
              dh_commit_base64_wrapper = child.children[0];
              done();
            }
          });
        }
      });
    });
  });
}

describe('pure-node-otr', function(){
  describe('AKE [D-H Commit Message, D-H Key Message] as Alice', function(){
    before(function(){
    if(xmpp_config.xmpp_dev != true) dh_commit_base64_wrapper = "?OTR:AAICAAAAxNyJFLZknz8c0F98r6MH3Dr2GrMCuvp0DqfU1tA8BALSaj12ksOEBm2RstSeZ/R7ZOgOJzsOjIGrA7ygn5UHLu1h4RG0koRa04WSQs5vFCC2V1S2RU7u/JAQlBY262fLJIGw2/EbuLY5twb92TKOd/cj6AIEQxMdCelaSHG0NcIZWJH61FyfNRWyVRNWtKG50z0BpPX9swO+18wVV1hnK9AGbWiEJ/elHcmq10Izov+1DD7+zFis36e2zx/filaeRLW1fi4AAAAgChOq6J9QmqzmV6oGhHep2/7PQUYrKwe8syPSM7jg4nE=.";
      otr = new Otr();
    });

    it('should parse dh commit', function(){
      otr.dh_commit_parse(dh_commit_base64_wrapper);
      assert.equal(_.size(otr.dh_commit_hash), 6, "The parsed DH Commit Hash should have 6 components [MPI len is a separate component]");
      assert(otr.dh_commit_hash['gxmpi_enc'].length >= 40, "The gxmpi length should be at least 320 bits");
      assert.equal(otr.dh_commit_hash['gxmpi_hash'].length, 32, "The hash length should be 32 bytes");
    });

    it('should generate a dh key message gracefully', function(){
      dh_key_base64_wrapper = otr.dh_key_gen();
      assert.equal(_.size(otr.dh_key_hash), 4, "The parsed DH Key Hash should have 4 components [MPI len is a separate component]");
      assert.equal(otr.dh_key_hash['gy'].length, 192, "The DH g^y var should have a length of 192 bytes");
    });

    after(function(done){
      if(xmpp_config.xmpp_dev == true){
        cl.send(new xmpp.Element('message', { to: xmpp_config.interlocutor, type: 'chat'}).c('body').t(dh_key_base64_wrapper));
        cl.on('stanza', function(stanza){
          if(stanza.name == "message"){
            _.each(stanza.children, function(child){
              if(child.name == "body"){
                reveal_sig_base64_wrapper = child.children[0];              
                done();
              }
            });
          }
        });
      } else {
        done();
      }
    });
  });

  describe('AKE [Reveal Signature Message, Signature Message] as Alice', function(){
    before(function(){
      if(xmpp_config.xmpp_dev != true) reveal_sig_base64_wrapper = "?OTR:AAIRAAAAECjzE87G2MiB8laRGQEN+24AAAHSMgrrV6GGkszb/ROtTXdOiOhAK3cPNoOKb77tifSbsWkUjzWtd7nZ7MhaBPYrWlzQw4pwy3CwyN4/46W0Rgt+vVajMt+G1iGOV4Lj5NkH9DiaDJq7k+ESl8eCTemD0BJOihS3/DRk9qezAuDwxvMY9rRz9KMF/IionxyXv+5Q5eMssdQ2J3r/JQ6gyIRWjn4FUJqssPY2oh7pG1Z3xv70zmQV11y6n9/YeI9ZRdzx4F5O79IY3MS3BuRjd+rC2iTwgzlMD0wLT5/DnEyDMslaSRyAmowf6Dd47KZXP1lteMTW0oHRgy0pzC1DoOH50FE726TNJ589mdufIHEA9f0RJvfDkhk1OgaJy1C5+4DxToQd3MUTMkjpfpEVM3GLKUv+Zu+n1HlSl4KOwafzktkFgrdMTe/JwQJjuXEvGWeTnV/EbuT7lKldNzyGFZ17oZzTlMpsDe9RXrj0P7MzSiHzA4CAg1BmcMErFwi5JD8UUL1eS0rp5i0CSF03ICf35kdS8sTBb/kfp94Vq7FIGHu2d+aXV6TckFhZzhbDYzUfVjuT+eVZp5JueXiOaI5uKFw/kjF1GVwNYnj6bcqs1onUh6TYnBzCgM3OU83JffWvqIvkjqgl+fDQOD75uUcY4+LW0dGZX4t9."
    });

    it('should parse reveal signature', function(){
      otr.reveal_sig_parse(reveal_sig_base64_wrapper);
    });
  });
});
 
