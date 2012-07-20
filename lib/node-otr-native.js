var bigint = require('bigint');

var Otr = function(){
  this.otr_wrapper_pattern = function(){
    return /(\?OTR:)(.+)(\.)/;
  }
}

module.exports = Otr;

Otr.wrapper_pattern = /(\?OTR:)([^\.]+)(\.)/;
// RFC 3926
Otr.modulus = bigint.fromBuffer(new Buffer("FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA237327FFFFFFFFFFFFFFFF", "hex"));

Otr.prototype.dh_commit_parse = function(message){
  var matches = message.match(Otr.wrapper_pattern);
  var dh_commit_base64 = matches[2];
  var dh_commit_buff = new Buffer(dh_commit_base64, "base64");
  this.dh_commit_hash = {};
  this.dh_commit_hash['version'] = dh_commit_buff.slice(0,2);
  this.dh_commit_hash['type'] = dh_commit_buff.slice(2,3);
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
