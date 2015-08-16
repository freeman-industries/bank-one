var holder = window,

//GOTTA MAKE SURE DRAG N DROP IS SUPPORTED
tests = {
  filereader: typeof FileReader != 'undefined',
  dnd: 'draggable' in document.createElement('span'),
  formdata: !!window.FormData,
  progress: "upload" in new XMLHttpRequest
};


function makeTile(data){
  var tile = document.createElement("div");
  tile.className = "tile";
  tile.innerHTML = '<div class="wrapper"></div>';

  var img = document.createElement("div");
  img.className = "thumbnail"

  if (/(jpe?g|png|gif|svg)/g.test(data.mimetype)) {
    img.setAttribute("style", "background-image:url(" + data.url + ");");
  } else {
    var extension = document.createElement("div");
    extension.className = "extension circular-shadow";
    extension.innerHTML = "FILE";
    img.appendChild(extension);
  }

  tile.querySelector(".wrapper").appendChild(img);

  var filename = document.createElement("div");
  filename.className = "filename";
  filename.innerHTML = data.filename;

  tile.querySelector(".wrapper").appendChild(filename);

  var tiles = document.querySelector(".tiles");
  tiles.insertBefore(tile, tiles.querySelector(".tile"));

  tile.bank_data = data;
}


function readfiles(files) {
  var formData = tests.formdata ? new FormData() : null;
  for (var i = 0; i < files.length; i++) {
    if (tests.formdata) formData.append('file', files[i]);
  }

  // now post a new XHR request
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/upload');
  xhr.onload = function(e) {

    if(!e.target.responseText){
      console.log("ERRO ERROR ERRORO");
      return;
    }

    var response = JSON.parse(e.target.responseText);

    makeTile(response);

  };

  xhr.send(formData);
}

if (tests.dnd) {

  holder.addEventListener("dragover", function(e){

    console.log("DUDE! you're dragging!!!");

    // holder.className = 'dragging';
    e.stopPropagation();
    e.preventDefault();
  });

  holder.addEventListener("dragend", function(e){
    // holder.className = '';
    e.preventDefault();
  });

  holder.addEventListener("drop", function(e){
    // holder.className = '';
    e.preventDefault();
    readfiles(e.dataTransfer.files);
  });

}

var init = function(){
  var xhr = new XMLHttpRequest();

  function load() {
    if(this.responseText){
      var rows = JSON.parse(this.responseText);

      rows.forEach(function(row){
        makeTile(JSON.parse(row.data));
      });
    }
  }

  var url = "/files";

  xhr.addEventListener('load', load);
  xhr.open("get", url, true);
  xhr.send();
};

init();
