/*
 * Fetching parameters from URL:
 */

function findGetParameter(parameterName) {
  let result = null,
      tmp = [],
      items = location.search.substr(1).split("&");
  for (var index = 0; index < items.length; index++) {
    tmp = items[index].split("=");
    if (tmp[0] === parameterName)
      result = decodeURIComponent(tmp[1]);
  }
  return result;
}

const fields = {
  verticalBands: false,
  colors: [ "#000000" ],
  bands: [ 0 ],
  widthFactor: 5,
  heightFactor: 3,
  sizeFactor: 100,
};
for (let fieldName in fields) {
  const value = findGetParameter(fieldName.charAt(0));
  if (value) {
    if (fieldName === "colors") {
      fields.colors =
        value.split("+").map((a) => a.replaceAll("_", "#").replaceAll("'", ","));
    } else if (fieldName === "bands") {
      fields.bands = 
        value.split("+").map((a) => parseInt(a));
    } else if (fieldName === "verticalBands") {
      console.log(value);
      fields.verticalBands = value === "true";
    } else {
      fields[fieldName] = parseFloat(value);
    }
  }
}

/*
 * Vue object declaration:
 */

const VueObject = {
  
  data() {
    return {
      ...fields,
      fileNameInput: "",
      fileNameDefault: "flag",
      actions: [],
      undoneActions: [],
      showSection: [ true, true, true ]
    }
  },
  
  computed: {
    url() {
      return `${location.protocol}//${location.host}${location.pathname}?c=${
          this.colors
          .filter((a) => a)
          .map((a) => encodeURIComponent(
            a
            .replaceAll(",", "'")
            .replaceAll("#", "_"))
          ).join("+")
        }&b=${
          this.bands.join("+")
        }${ this.verticalBands === true ? `&v=${ this.verticalBands }` : ''
        }${ this.widthFactor !== 5 ? `&w=${ encodeURIComponent(this.widthFactor) }` : ''
        }${ this.heightFactor !== 3 ? `&h=${ encodeURIComponent(this.heightFactor) }` : ''
        }${ this.sizeFactor !== 100 ? `&s=${ encodeURIComponent(this.sizeFactor) }` : '' }`;
    },
    width() {
      return this.sizeFactor * this.widthFactor;
    },
    height() {
      return this.sizeFactor * this.heightFactor;
    },
    fileName() {
      return this.fileNameInput != "" ? this.fileNameInput : this.fileNameDefault;
    },
    isOneColor() {
      for (let i = 0; i < this.bands.length - 1; i++) {
        if (this.bands[i] !== this.bands[i + 1])
          return false;
      }
      return true;
    },
    isSymmetrical() {
      for (let i = 0; i < this.bands.length; i++) {
        if (this.bands[i] !== this.bands[this.bands.length - 1 - i])
          return false;
      }
      return true;
    }
  },
  
  methods: {
    
    createColor() {
      this.colors.push("#000000");
    },
    deleteColor(i) {
      this.colors.splice(i, 1);
    },
  
    undo() {
      const a = this.actions.pop();
      this.undoneActions.push(a);
      this.action(a, 'undo');
    },
    redo() {
      const a = this.undoneActions.pop();
      this.actions.push({ ...a, band: this.bands[a.i] });
      this.action(a, 'redo');
    },
    
    action(action, type='normal') {
      let { name, i } = action;
      switch (type) {
        case 'normal':
          this.actions.push({ ...action, oldColor: this.bands[i] });
          this.undoneActions = [];
          break;
        case 'undo':
          switch (name) {
            case 'createBand':
              name = 'deleteBand';
              break;
            case 'colorBand':
              name = 'undoColorBand';
              break;
            case 'duplicateBand':
              name = 'deleteBand';
              break;
            case 'deleteBand':
              name = 'recoverBand';
              break;
            case 'moveBandUp': break;
            case 'moveBandDown': break;
            case 'deleteAll':
              name = 'restoreAll';
              break;
            case 'flip': break;
            case 'mirrorUp':
              name = 'unmirrorUp';
              break;
            case 'mirrorDown':
              name = 'unmirrorDown';
              break;
            case 'rotateUp':
              name = 'rotateDown';
              break;
            case 'rotateDown':
              name = 'rotateUp';
              break;
          }
          break;
        case 'redo': break;
      }
      switch (name) {
        case 'createBand':
          if (i === -1)
            i = this.bands.length-1;
          this.bands.splice(action.i, 0, 0);
          break;
        case 'colorBand':
          this.bands[action.i] = action.newColor;
          break;
        case 'duplicateBand':
          this.bands.splice(action.i, 0, this.bands[i]);
          break;
        case 'deleteBand':
          this.bands.splice(action.i, 1);
          break;
        case 'moveBandUp':
          const aux = this.bands[i];
          this.bands[i] = this.bands[i - 1];
          this.bands[i - 1] = aux;
          break;
        case 'moveBandDown':
          const aux2 = this.bands[i];
          this.bands[i] = this.bands[i + 1];
          this.bands[i + 1] = aux2;
          break;
        case 'deleteAll':
          this.actions[this.actions.length - 1].bands = this.bands;
          this.bands = [];
          break;
        case 'flip':
          this.bands.reverse();
          break;
        case 'mirrorUp':
          const oldLength = this.bands.length;
          for (let i = 0; i < oldLength - 1; i++) {
            this.bands.unshift(this.bands[i * 2 + 1]);
          }
          break;
        case 'mirrorDown':
          const oldLength2 = this.bands.length;
          for (let i = 0; i < oldLength2 - 1; i++) {
            this.bands.push(this.bands[oldLength2 - i - 2]);
          }
          break;
        case 'rotateUp':
          this.bands.push(this.bands.shift());
          break;
        case 'rotateDown':
          this.bands.unshift(this.bands.pop());
          break;
        
        // These only exist as reversals:
        case 'recoverBand':
          this.bands.splice(action.i, 0, action.oldColor);
          break;
        case 'undoColorBand':
          this.bands[action.i] = action.oldColor;
          break;
        case 'restoreAll':
          this.bands = action.bands;
          break;
        case 'unmirrorUp':
          this.bands.splice(0, Math.floor((this.bands.length - 1) / 2));
          break;
        case 'unmirrorDown':
          this.bands.splice(Math.floor((this.bands.length + 1) / 2), this.bands.length);
          break;
      }
    },
  
    createBand(i=-1) {
      this.action({ name: 'createBand', i });
    },
    colorBand(i, newColor) {
      this.action({ name: 'colorBand', i, newColor })
    },
    duplicateBand(i) {
      this.action({ name: 'duplicateBand', i });
    },
    deleteBand(i) {
      this.action({ name: 'deleteBand', i });
    },
    moveBandUp(i) {
      this.action({ name: 'moveBandUp', i });
    },
    moveBandDown(i) {
      this.action({ name: 'moveBandDown', i });
    },
    deleteAll() {
      this.action({ name: 'deleteAll' });
    },
    flip() {
      this.action({ name: 'flip' });
    },
    mirrorUp() {
      this.action({ name: 'mirrorUp' });
    },
    mirrorDown() {
      this.action({ name: 'mirrorDown' });
    },
    rotateUp() {
      this.action({ name: 'rotateUp' });
    },
    rotateDown() {
      this.action({ name: 'rotateDown' });
    },
    
    restoreRatio() {
      this.widthFactor = 5;
      this.heightFactor = 3;
    },
    
    copyUrl() {
      const el = document.createElement('textarea');  
      el.value = this.url;                                 
      el.setAttribute('readonly', '');                
      el.style.position = 'absolute';                     
      el.style.left = '-9999px';                      
      document.body.appendChild(el);                  
      const selected = document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false;                                    
      el.select();                                    
      document.execCommand('copy');                   
      document.body.removeChild(el);                  
      if (selected) {                                 
        document.getSelection().removeAllRanges();    
        document.getSelection().addRange(selected);   
      }
    },
    
    download() {
      const data = document.getElementById("svg-flag-container").innerHTML;
      let filename = this.fileName;
      if (!filename.endsWith(".svg")) filename += ".svg";
      const type = ".svg";
      var file = new Blob([data], {type: type});
      if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
      else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);  
        }, 0); 
      }
    }
   
  }
};

/*
 *Vue initialization:
 */

Vue.createApp(VueObject).mount('#flag-maker');
