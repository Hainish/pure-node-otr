var xmpp = require('node-xmpp');
var assert = require('assert');
var _ = require('underscore');
var test_config = require('../../test_config');
var Otr = require('../../../lib/pure-node-otr');
var dh_commit_base64_wrapper, dh_key_base64_wrapper, reveal_sig_base64_wrapper;
var cl;
var otr;

if(test_config.xmpp_dev == true){
  describe("client", function() {
    cl = new xmpp.Client({
      jid: test_config.client.jid,
      password: test_config.client.password,
      host: test_config.client.host,
      port: test_config.client.port
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
      cl.send(new xmpp.Element('message', { to: test_config.interlocutor, type: 'chat'}).c('body').t('?OTR?v2?'));
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
      if(test_config.xmpp_dev != true) dh_commit_base64_wrapper = "?OTR:AAICAAAAxDf7ibvGyfeMKOrAkEOsOu37WXzza/Q5+iaGWazcQUH5Ud2GrN+c+wUwPzDN2P3HLBAkpQz7K7aGTw/MNzsIhkn+h9nsGUoRhUOQ+InrqmHA9/sK4TwmgT+4DQkFstEUtbAoUlz/AJzsY9U42jXmMscNYx4Kf+atTsdfCIxBqSxlKAmrqREpjhIGHSfweXRQ8AtREdbJ3LzR1V08I1WVT8noLR4e5EpWdeKUSGeIKe51A46J86Er1cdhSgHgFBxuLM1Emu8AAAAgj4RzTJyGjGG1FZi+9ozYf8MojBe9AVOL+ICCbsAD1Ec=.";
      otr = new Otr();
    });

    it('should parse dh commit', function(){
      otr.dh_commit_parse(dh_commit_base64_wrapper);
      assert.equal(_.size(otr.dh_commit_hash), 6, "The parsed DH Commit message should have 6 components [MPI len is a separate component]");
      assert(otr.dh_commit_hash['gxmpi_enc'].length >= 40, "The gxmpi length should be at least 320 bits");
      assert.equal(otr.dh_commit_hash['gxmpi_hash'].length, 32, "The hash length should be 32 bytes");
    });

    it('should generate a dh key message gracefully', function(){
      dh_key_base64_wrapper = otr.dh_key_gen();
      assert.equal(_.size(otr.dh_key_hash), 4, "The parsed DH Key Hash should have 4 components [MPI len is a separate component]");
      assert.equal(otr.dh_key_hash['gy'].length, 192, "The DH g^y var should have a length of 192 bytes");
    });

    after(function(done){
      if(test_config.xmpp_dev == true){
        cl.send(new xmpp.Element('message', { to: test_config.interlocutor, type: 'chat'}).c('body').t(dh_key_base64_wrapper));
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
      if(test_config.xmpp_dev != true) reveal_sig_base64_wrapper = "?OTR:AAIRAAAAEGGI5SPBm03UNeiHvvd30bUAAAHSU1wKJlWldPU55zVDlAwas7ntNDI/pZwD6KQJnbMJ9E/hvu8OFzvQ2J3XlH9K8AUpuMQCPjfLT5oltQ4Rro1uXK8j6t4Sk0OT0oz6ROJnt+WPFGt8aoeAbGamf0aGTKGQ4CGErhkzwb9VENXHD+q4EAIJHpfzBZj3EyDZzjhrFByDXV6QAtYC2vGZvpuHFgIwQBHa+SWZQfT60ovxqQV8NdiT9ReGTlqWk4wdmwtjs7zCB+ljIiAOcFD2DEDGMdjzA7vs6iEEy+uhrC9W4gtY34YjWKezzS0gA3LOdKtUV0T0PoqztWAvia/J/FXMTwrglvo430vgY7ZGQaikFl83We8ueKVSkWEe1X3LUO/q971muUnLYSfGorMbBemnPiedDogZjmzaEtUUcKUwhQu6i10WApoZCaSRakmHSTMNVuGeT54UHCmkICnV3utL0/vxwpyjnjJ/C4uZ//T9/HsaZh4f01759xOg0NNYIZ6lem4UZfYN6yDCqFEa74qw9LOPUWdww9uHLJxJ0MWIgSZD8/jIFn+BJ5Tqod0fcuU12qlI60/r60ThR85Q/T6Vapq0n5pk05xW0ZPNdMUH0kSArIKbjdLS5C8PSCPyjsa31ZIanXQIjXcYP8K+NJrBw6dNwBoSwZJm.";
    });

    it('should parse reveal signature', function(){
      otr.reveal_sig_parse(reveal_sig_base64_wrapper);
      assert.equal(_.size(otr.reveal_sig_hash), 7, "The parsed Reveal Signature message should have 7 components [MPI len is a separate component]");
      assert.equal(otr.reveal_sig_hash['r'].length, 16, "The r length should be 128 bits");
    });

    it('should process reveal signature', function(){
      otr.reveal_sig_process();
    });
  });
});
 
