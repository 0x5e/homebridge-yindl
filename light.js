
class YindlLight {
  constructor(name, style, write, read) {
    this.name = name;
    this.style = style; // 0：bool型（0/1），1：value型（0～255）
    this.write = write; // 写id
    this.read = read; // 读id
    this.value = 0;
  }
}

module.exports = YindlLight;
