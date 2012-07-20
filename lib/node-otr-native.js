var Otr = function(){
  this.otr_wrapper_pattern = function(){
    return /(\?OTR:)(.+)(\.)/;
  }
}

module.exports = Otr;

Otr.wrapper_pattern = /(\?OTR:)([^\.]+)(\.)/;

Otr.prototype.dh_commit_recv = function(message){
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
