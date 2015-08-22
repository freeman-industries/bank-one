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
    extension.className = "extension";
    img.appendChild(extension);
  }

  tile.querySelector(".wrapper").appendChild(img);

  var filename = document.createElement("div");
  filename.className = "filename";
  filename.innerHTML = data.filename;

  tile.querySelector(".wrapper").appendChild(filename);

  return tile;
}


function renderTiles(filter){
  if(filter){

  }

  var files_view = document.querySelector(".files-view");

  var dates = {};

  window._files.forEach(function(tile){
    var date = new Date(tile.time * 1000);

    date.setUTCHours(0);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);

    var midnight = date.getTime();

    if(dates[midnight] === undefined){
      dates[midnight] = [];
    }

    dates[midnight].push(tile);
  });

  for(date in dates){
    var section = document.createElement("section");

    var date_title = new Date(parseInt(date));

    section.innerHTML = "<h2>" + date_title + "</h2>";

    var tiles = document.createElement("div");
    tiles.className = "tiles";

    dates[date].forEach(function(tile){
      tiles.insertBefore(makeTile(tile), tiles.querySelector(".tile"));
    });

    section.appendChild(tiles);

    files_view.insertBefore(section, files_view.querySelector("section"));
  }
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

    console.log(response);

    makeTile(response);

  };

  if(xhr.upload){
    xhr.upload.onprogress = function(e){
      if(e.lengthComputable){
        // progressBar.value = (e.loaded / e.total) * 100;
        // progressBar.textContent = progressBar.value;

        console.log((e.loaded / e.total) * 100);
      }
    };
  }

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
      window._files = [];

      var rows = JSON.parse(this.responseText);

      rows.forEach(function(row){
        // makeTile(JSON.parse(row.data));

        row.data = JSON.parse(row.data);
        row.data.id = row.id;
        row.data.time = row.time;

        window._files.push(row.data);
      });

      renderTiles();
    }
  }

  var url = "/files";

  xhr.addEventListener('load', load);
  xhr.open("get", url, true);
  xhr.send();
};

init();
