var bigint = require('bigint');
var crypto = require('crypto');

var Otr = function(){
  const wrapper_pattern = /(\?OTR:)([^\.]+)(\.)/;
  // RFC 3926
  const modulus = bigint.fromBuffer(new Buffer("FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA237327FFFFFFFFFFFFFFFF", "hex"));

  var helpers = {
    unwrap: function(message_wrapped){
      var matches = message_wrapped.match(wrapper_pattern);
      var message_base64 = matches[2];
      return new Buffer(message_base64, "base64");
    },
    wrap: function(buff_unwrapped){
      var message_base64 = buff_unwrapped.toString('base64');
      return "?OTR:"+message_base64+".";
    }
  }

  this.dh_commit_parse = function(message){
    var dh_commit_buff = helpers.unwrap(message);

    this.dh_commit_hash = {};
    this.dh_commit_hash['version'] = dh_commit_buff.slice(0,2);
    this.dh_commit_hash['type'] = dh_commit_buff.slice(2,3);

    // build hash from commit parse
    this.dh_commit_hash['gxmpi_size'] = dh_commit_buff.slice(3,7);
    var gxmpi_size = this.dh_commit_hash['gxmpi_size'].readUInt32BE(0);
    var gxmpi_end_offset = gxmpi_size + 7;
    this.dh_commit_hash['gxmpi_enc'] = dh_commit_buff.slice(7, gxmpi_end_offset);
    var gxmpi_end_size_hash_offset = gxmpi_end_offset + 4;
    this.dh_commit_hash['gxmpi_hash_size'] = dh_commit_buff.slice(gxmpi_end_offset, gxmpi_end_size_hash_offset);
    var gxmpi_hash_size = this.dh_commit_hash['gxmpi_hash_size'].readUInt32BE(0);
    var gxmpi_end_hash_offset = gxmpi_end_size_hash_offset + gxmpi_hash_size;
    this.dh_commit_hash['gxmpi_hash'] = dh_commit_buff.slice(gxmpi_end_size_hash_offset, gxmpi_end_hash_offset);
  }

  this.dh_key_gen = function(){
    this.dh_key_hash = {};
    this.dh_key_hash['version'] = new Buffer('0002', 'hex');
    this.dh_key_hash['type'] = new Buffer('0a', 'hex');

    // generate a random y, raise g to it's power, stick it in a MPI
    var y_bin = crypto.randomBytes(40); // 40 bytes = 320 bit random binary
    this.y = new Buffer(y_bin, 'binary');
    var y_bigint = bigint.fromBuffer(this.y);
    this.dh_key_hash['gy'] = bigint(2).powm(y_bigint,modulus).toBuffer();
    this.dh_key_hash['gy_size'] = new Buffer(4);
    this.dh_key_hash['gy_size'].writeUInt32BE(this.dh_key_hash['gy'].length, 0);

    // compose the dh key buffer to return
    this.dh_key_buff = new Buffer(7+this.dh_key_hash['gy'].length);
    this.dh_key_hash['version'].copy(this.dh_key_buff, 0, 0, 2);
    this.dh_key_hash['type'].copy(this.dh_key_buff, 2, 0, 1);
    this.dh_key_hash['gy_size'].copy(this.dh_key_buff, 3, 0, 4);
    this.dh_key_hash['gy'].copy(this.dh_key_buff, 7, 0);
    
    return helpers.wrap(this.dh_key_buff);
  }

  this.reveal_sig_parse = function(message){
    var reveal_sig_buff = helpers.unwrap(message);
    this.reveal_sig_hash = {};
    this.reveal_sig_hash['version'] = reveal_sig_buff.slice(0,2);
    this.reveal_sig_hash['type'] = reveal_sig_buff.slice(2,3);

    // build hash from reveal sig
    this.reveal_sig_hash['r_size'] = reveal_sig_buff.slice(3,7);
    var r_size = this.reveal_sig_hash['r_size'].readUInt32BE(0);
    var r_end_offset = 7 + r_size;
    this.reveal_sig_hash['r'] = reveal_sig_buff.slice(7, r_end_offset);
    var enc_sig_size_end_offset = r_end_offset + 4;
    this.reveal_sig_hash['enc_sig_size'] = reveal_sig_buff.slice(r_end_offset, enc_sig_size_end_offset);
    var enc_sig_end_offset = reveal_sig_buff.length - 20;
    this.reveal_sig_hash['enc_sig'] = reveal_sig_buff.slice(enc_sig_size_end_offset, enc_sig_end_offset);
    this.reveal_sig_hash['eng_sig_mac'] = reveal_sig_buff.slice(enc_sig_end_offset, reveal_sig_buff.length);
  }

}

module.exports = Otr;


